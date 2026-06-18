import { EventEmitter } from 'node:events';
import nock from 'nock';
import httpMocks from 'node-mocks-http';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { createCatalogRouter } from './catalog.routes.js';
import { RequirementExtractionService } from '../services/RequirementExtractionService.js';
import type { RequirementExtractor } from './requirements.routes.js';

const ruleBasedExtractionService = new RequirementExtractionService();

const examplePrompt = `I need 2 web servers with 4 vCPU and 16GB RAM each, running Linux Ubuntu.
A managed PostgreSQL database with 8 vCPU and 32GB RAM, 500GB SSD storage.
Redis cache with 2GB memory.
A CDN for static assets, 1TB data transfer per month.
Load balancer across both servers.
All in US East region.`;

const explicitOptionsPrompt = `I need 2 web servers with 4 vCPU and 16GB RAM each, running Linux Ubuntu.
A managed PostgreSQL database with 8 vCPU and 32GB RAM, 500GB SSD storage with highly available option.
Redis cache production grade with 2GB memory.
A CDN for static assets, 1TB data transfer per month.
Load balancer HTTP/S across both servers.
All in US East region.`;

async function invoke(method: 'GET' | 'POST', url: string, body?: unknown, extractionService: RequirementExtractor = ruleBasedExtractionService) {
  const app = createApp({ requirementExtractionService: extractionService });
  const req = httpMocks.createRequest({
    method,
    url,
    body,
    headers: {
      'content-type': 'application/json'
    }
  });
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await new Promise<void>((resolve) => {
    res.on('end', resolve);
    app.handle(req, res);
  });

  const raw = res._getData();
  return {
    status: res.statusCode,
    body: raw ? JSON.parse(raw) : undefined
  };
}

function retailFilterIncludes(query: Record<string, unknown>, terms: string[]): boolean {
  const filter = String(query.$filter ?? query['$filter'] ?? '');
  return terms.every((term) => filter.includes(term));
}

describe('api routes', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('GET /api/health works', async () => {
    const response = await invoke('GET', '/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'cloud-cost-compare-api'
    });
  });

  it('GET /api/azure/regions works', async () => {
    const response = await invoke('GET', '/api/azure/regions');

    expect(response.status).toBe(200);
    expect(response.body).toContainEqual({ name: 'East US', value: 'eastus' });
  });

  it('GET /api/catalog/services returns database-backed service mappings', async () => {
    const response = await invoke('GET', '/api/catalog/services?provider=azure&q=redis');

    expect(response.status).toBe(200);
    expect(response.body.services.length).toBeGreaterThanOrEqual(2);
    expect(response.body.services).toContainEqual(expect.objectContaining({
      serviceKey: 'cache.redis',
      providerId: 'azure',
      canonicalName: 'Azure Cache for Redis',
      sourceCategory: 'Databases',
      mappingStatus: 'mapped',
      requiredFields: ['engine', 'memoryGb', 'tier']
    }));
  });

  it('POST /api/catalog/sync/azure-retail-prices syncs Azure meter metadata', async () => {
    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            armRegionName: 'eastus',
            serviceName: 'Virtual Machines',
            serviceFamily: 'Compute',
            productName: 'Virtual Machines Dsv5 Series',
            skuName: 'D4s v5',
            armSkuName: 'Standard_D4s_v5',
            meterId: 'meter-1',
            meterName: 'D4s v5',
            unitOfMeasure: '1 Hour',
            priceType: 'Consumption',
            retailPrice: 0.192,
            unitPrice: 0.192
          }
        ],
        NextPageLink: null
      });

    const response = await invoke('POST', '/api/catalog/sync/azure-retail-prices', {
      armRegionName: 'eastus',
      serviceName: 'Virtual Machines',
      maxPages: 1
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'completed',
      pagesFetched: 1,
      itemsFetched: 1,
      rowsUpserted: 1
    });
  });

  it('POST /api/catalog/sync/aws-public-prices starts an AWS public catalog sync', async () => {
    const app = createApp({
      catalogRouter: createCatalogRouter(undefined, undefined, {
        async sync(options) {
          return {
            syncRunId: 7,
            status: 'completed',
            offerCode: options?.offerCode ?? 'AmazonEC2',
            regionCode: options?.regionCode ?? 'us-east-1',
            publicationDate: '2026-06-17T17:01:45Z',
            rowsRead: 3,
            rowsUpserted: 3
          };
        }
      })
    });
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/catalog/sync/aws-public-prices',
      body: {
        offerCode: 'AmazonEC2',
        regionCode: 'us-east-1',
        maxMeters: 3
      },
      headers: {
        'content-type': 'application/json'
      }
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await new Promise<void>((resolve) => {
      res.on('end', resolve);
      app.handle(req, res);
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData())).toMatchObject({
      status: 'completed',
      offerCode: 'AmazonEC2',
      regionCode: 'us-east-1',
      rowsUpserted: 3
    });
  });

  it('POST /api/catalog/sync/aws-public-prices/all starts all supported AWS public catalog syncs', async () => {
    const app = createApp({
      catalogRouter: createCatalogRouter(undefined, undefined, {
        async sync() {
          throw new Error('syncSupportedOffers should be used when available');
        },
        async syncSupportedOffers() {
          return {
            status: 'completed',
            results: [
              {
                syncRunId: 8,
                status: 'completed',
                offerCode: 'AmazonEC2',
                regionCode: 'us-east-1',
                publicationDate: '2026-06-17T17:01:45Z',
                rowsRead: 10,
                rowsUpserted: 10
              }
            ]
          };
        }
      })
    });
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/catalog/sync/aws-public-prices/all',
      body: {},
      headers: {
        'content-type': 'application/json'
      }
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await new Promise<void>((resolve) => {
      res.on('end', resolve);
      app.handle(req, res);
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData())).toMatchObject({
      status: 'completed',
      results: [expect.objectContaining({ offerCode: 'AmazonEC2', rowsUpserted: 10 })]
    });
  });

  it('POST /api/catalog/sync/azure-retail-prices/all starts all supported Azure retail syncs', async () => {
    const app = createApp({
      catalogRouter: createCatalogRouter(undefined, undefined, undefined, {
        async sync() {
          throw new Error('syncSupportedServices should be used when available');
        },
        async syncSupportedServices() {
          return {
            status: 'completed',
            results: [
              {
                syncRunId: 9,
                status: 'completed',
                serviceName: 'Virtual Machines',
                armRegionName: 'eastus',
                pagesFetched: 2,
                itemsFetched: 1000,
                rowsUpserted: 1000,
                nextPageLink: null
              }
            ]
          };
        }
      })
    });
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/catalog/sync/azure-retail-prices/all',
      body: {},
      headers: {
        'content-type': 'application/json'
      }
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await new Promise<void>((resolve) => {
      res.on('end', resolve);
      app.handle(req, res);
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData())).toMatchObject({
      status: 'completed',
      results: [expect.objectContaining({ serviceName: 'Virtual Machines', rowsUpserted: 1000 })]
    });
  });

  it('POST /api/catalog/sync/gcp-public-prices/all starts all supported GCP public catalog syncs', async () => {
    const app = createApp({
      catalogRouter: createCatalogRouter(undefined, undefined, undefined, undefined, {
        async sync() {
          throw new Error('syncSupportedServices should be used when available');
        },
        async syncSupportedServices() {
          return {
            status: 'completed',
            results: [
              {
                syncRunId: 10,
                status: 'completed',
                serviceName: 'Compute Engine',
                serviceId: '6F81-5844-456A',
                regionCode: 'us-east1',
                skusRead: 20,
                rowsUpserted: 40
              }
            ]
          };
        }
      })
    });
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/catalog/sync/gcp-public-prices/all',
      body: {},
      headers: {
        'content-type': 'application/json'
      }
    });
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await new Promise<void>((resolve) => {
      res.on('end', resolve);
      app.handle(req, res);
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData())).toMatchObject({
      status: 'completed',
      results: [expect.objectContaining({ serviceName: 'Compute Engine', rowsUpserted: 40 })]
    });
  });

  it('POST /api/requirements/extract works for the example prompt', async () => {
    const response = await invoke('POST', '/api/requirements/extract', { requirementText: examplePrompt });

    expect(response.status).toBe(200);
    expect(response.body.region.providerRegion).toEqual({ azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' });
    expect(response.body.extractionMethod).toBe('rule-based-fallback');
  });

  it('POST /api/requirements/extract returns successful LLM extraction responses', async () => {
    const response = await invoke(
      'POST',
      '/api/requirements/extract',
      { requirementText: examplePrompt },
      {
        async extractRequirements() {
          return {
            region: {
              raw: 'US East',
              normalized: 'eastus',
              providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
              confidence: 'high'
            },
            components: [],
            globalAssumptions: [],
            clarifyingQuestions: [],
            extractionMethod: 'llm'
          };
        }
      }
    );

    expect(response.status).toBe(200);
    expect(response.body.extractionMethod).toBe('llm');
  });

  it('POST /api/requirements/refine returns refined prompt text', async () => {
    const response = await invoke(
      'POST',
      '/api/requirements/refine',
      { requirementText: examplePrompt },
      {
        async extractRequirements() {
          throw new Error('not used');
        },
        async refineRequirements(requirementText) {
          return `Refined:\n${requirementText}`;
        }
      }
    );

    expect(response.status).toBe(200);
    expect(response.body.refinedPrompt).toContain('Refined:');
    expect(response.body.refinedPrompt).toContain('2 web servers');
  });

  it('POST /api/requirements/refine passes preferred provider to refinement', async () => {
    const response = await invoke(
      'POST',
      '/api/requirements/refine',
      { requirementText: examplePrompt, provider: 'aws' },
      {
        async extractRequirements() {
          throw new Error('not used');
        },
        async refineRequirements(_requirementText, provider) {
          return `Provider: ${provider}`;
        }
      }
    );

    expect(response.status).toBe(200);
    expect(response.body.refinedPrompt).toBe('Provider: aws');
  });

  it('POST /api/requirements/refine rejects empty prompts', async () => {
    const response = await invoke('POST', '/api/requirements/refine', { requirementText: '' });

    expect(response.status).toBe(400);
  });

  it('POST /api/requirements/extract rejects empty prompts', async () => {
    const response = await invoke('POST', '/api/requirements/extract', { requirementText: '' });

    expect(response.status).toBe(400);
  });

  it('extracts compute correctly', async () => {
    const response = await invoke('POST', '/api/requirements/extract', { requirementText: examplePrompt });
    const compute = response.body.components.find((component: { type: string }) => component.type === 'compute');

    expect(compute).toMatchObject({ quantity: 2, vcpu: 4, memoryGb: 16, operatingSystem: 'linux', imageType: 'ubuntu' });
  });

  it('extracts PostgreSQL correctly', async () => {
    const response = await invoke('POST', '/api/requirements/extract', { requirementText: examplePrompt });
    const database = response.body.components.find((component: { type: string }) => component.type === 'database');

    expect(database).toMatchObject({ engine: 'postgresql', managed: true, vcpu: 8, memoryGb: 32, storageGb: 500, storageType: 'ssd' });
  });

  it('extracts Redis correctly', async () => {
    const response = await invoke('POST', '/api/requirements/extract', { requirementText: examplePrompt });
    const cache = response.body.components.find((component: { type: string }) => component.type === 'cache');

    expect(cache).toMatchObject({ engine: 'redis', memoryGb: 2 });
  });

  it('extracts CDN correctly', async () => {
    const response = await invoke('POST', '/api/requirements/extract', { requirementText: examplePrompt });
    const cdn = response.body.components.find((component: { type: string }) => component.type === 'cdn');

    expect(cdn).toMatchObject({ purpose: 'static assets', dataTransferGb: 1024 });
  });

  it('extracts load balancer correctly', async () => {
    const response = await invoke('POST', '/api/requirements/extract', { requirementText: examplePrompt });
    const loadBalancer = response.body.components.find((component: { type: string }) => component.type === 'load_balancer');

    expect(loadBalancer).toMatchObject({ target: 'both servers', scheme: null });
  });

  it('returns clarifying questions', async () => {
    const response = await invoke('POST', '/api/requirements/extract', { requirementText: examplePrompt });

    expect(response.body.clarifyingQuestions).toContain('Should PostgreSQL be highly available?');
    expect(response.body.clarifyingQuestions).toContain('Should Redis be basic/dev or production-grade?');
    expect(response.body.clarifyingQuestions).toContain('Is the load balancer HTTP/S or TCP?');
  });

  it('detects explicit HA, Redis tier, and load balancer scheme without clarifying questions', async () => {
    const response = await invoke('POST', '/api/requirements/extract', { requirementText: explicitOptionsPrompt });
    const database = response.body.components.find((component: { type: string }) => component.type === 'database');
    const cache = response.body.components.find((component: { type: string }) => component.type === 'cache');
    const loadBalancer = response.body.components.find((component: { type: string }) => component.type === 'load_balancer');

    expect(database.highAvailability).toBe(true);
    expect(database.missingFields).not.toContain('highAvailability');
    expect(cache.tier).toBe('production');
    expect(cache.missingFields).not.toContain('tier');
    expect(loadBalancer.scheme).toBe('http_s');
    expect(loadBalancer.missingFields).not.toContain('scheme');
    expect(response.body.clarifyingQuestions).toEqual([]);
    expect(response.body.clarifyingQuestions).not.toContain('Should PostgreSQL be highly available?');
    expect(response.body.clarifyingQuestions).not.toContain('Should Redis be basic/dev or production-grade?');
    expect(response.body.clarifyingQuestions).not.toContain('Is the load balancer HTTP/S or TCP?');
  });

  it('POST /api/estimate accepts normalized requirements and returns unsupported services', async () => {
    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            armRegionName: 'eastus',
            serviceName: 'Virtual Machines',
            productName: 'Virtual Machines Dsv5 Series',
            skuName: 'D4s v5',
            armSkuName: 'Standard_D4s_v5',
            meterName: 'D4s v5',
            unitOfMeasure: '1 Hour',
            type: 'Consumption',
            retailPrice: 0.192
          }
        ],
        NextPageLink: null
      });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query((query) => retailFilterIncludes(query, ['Content Delivery Network', 'Standard Data Transfer']))
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'Zone 1',
            serviceName: 'Content Delivery Network',
            serviceFamily: 'Networking',
            productName: 'Azure CDN from Microsoft',
            skuName: 'Standard',
            meterName: 'Standard Data Transfer',
            unitOfMeasure: '1 GB',
            type: 'Consumption',
            retailPrice: 0.081
          }
        ],
        NextPageLink: null
      });
    const extracted = await invoke('POST', '/api/requirements/extract', { requirementText: examplePrompt });

    const response = await invoke('POST', '/api/estimate', { provider: 'azure', requirements: extracted.body });

    expect(response.status).toBe(200);
    expect(response.body.calculatedLineItems[0]).toMatchObject({ skuName: 'D4s v5', monthlyCost: 280.32 });
    expect(response.body.calculatedLineItems).toEqual(expect.arrayContaining([expect.objectContaining({ serviceName: 'Azure CDN', monthlyCost: 82.94 })]));
    expect(response.body.notImplementedLineItems).toEqual([]);
    expect(response.body.missingRequiredFieldLineItems.map((item: { type: string }) => item.type)).toEqual(['database', 'cache', 'load_balancer']);
  });

  it('POST /api/estimate returns AWS public EC2 pricing from mapped requirements', async () => {
    nock('https://pricing.us-east-1.amazonaws.com')
      .get('/offers/v1.0/aws/AmazonEC2/current/us-east-1/index.json')
      .reply(200, {
        products: {
          EC2M7IXLARGE: {
            sku: 'EC2M7IXLARGE',
            productFamily: 'Compute Instance',
            attributes: {
              instanceType: 'm7i.xlarge',
              operatingSystem: 'Linux',
              tenancy: 'Shared',
              preInstalledSw: 'NA',
              capacitystatus: 'Used',
              marketoption: 'OnDemand'
            }
          }
        },
        terms: {
          OnDemand: {
            EC2M7IXLARGE: {
              'EC2M7IXLARGE.JRTCKXETXF': {
                priceDimensions: {
                  'EC2M7IXLARGE.JRTCKXETXF.6YS6EN2CT7': {
                    unit: 'Hrs',
                    description: '$0.2016 per On Demand Linux m7i.xlarge Instance Hour',
                    pricePerUnit: {
                      USD: '0.2016000000'
                    }
                  }
                }
              }
            }
          }
        }
      });
    const extracted = await invoke('POST', '/api/requirements/extract', { requirementText: examplePrompt });

    const response = await invoke('POST', '/api/estimate', { provider: 'aws', requirements: extracted.body });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      provider: 'aws',
      region: 'us-east-1',
      currency: 'USD'
    });
    expect(response.body.totalMonthlyCost).toBeGreaterThan(0);
    expect(response.body.assumptions).toContain('AWS estimates use public on-demand price list data for exact EC2 Linux instance matches. Services without a public adapter still use the early proposal rate card.');
    expect(response.body.calculatedLineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'Compute',
          serviceName: 'EC2',
          skuName: 'm7i.xlarge',
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'Amazon CloudFront',
          pricingSource: 'early-proposal-rate-card'
        })
      ])
    );
  });

  it('POST /api/estimate prices selected Azure optional add-ons with planning rates', async () => {
    const requirements = {
      region: {
        raw: 'US East',
        normalized: 'eastus',
        providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
        confidence: 'high'
      },
      components: [
        {
          id: 'optional-nat-gateway',
          type: 'network',
          name: 'NAT Gateway',
          providerServiceHint: { azure: 'Azure NAT Gateway', aws: 'NAT Gateway', gcp: 'Cloud NAT' },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: [],
          assumptions: ['Optional add-on selected by user.'],
          rawText: 'NAT Gateway optional add-on',
          optionalAddon: 'nat-gateway',
          gatewayCount: 1,
          monthlyDataProcessedGb: 500
        }
      ],
      globalAssumptions: [],
      clarifyingQuestions: []
    };

    const response = await invoke('POST', '/api/estimate', { provider: 'azure', requirements });

    expect(response.status).toBe(200);
    expect(response.body.calculatedLineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceName: 'Azure NAT Gateway',
          pricingSource: 'early-proposal-rate-card'
        })
      ])
    );
    expect(response.body.totalMonthlyCost).toBeGreaterThan(0);
  });

  it('POST /api/estimate prices AKS worker nodes as VM compute', async () => {
    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            armRegionName: 'eastus',
            serviceName: 'Virtual Machines',
            productName: 'Virtual Machines Dsv5 Series',
            skuName: 'D8s v5',
            armSkuName: 'Standard_D8s_v5',
            meterName: 'D8s v5',
            unitOfMeasure: '1 Hour',
            type: 'Consumption',
            retailPrice: 0.384
          }
        ],
        NextPageLink: null
      });

    const extracted = await invoke('POST', '/api/requirements/extract', {
      requirementText: `The application will run on Kubernetes using AKS.
The AKS cluster should have 4 Linux worker nodes.
Each worker node should have 8 vCPU and 32GB RAM.
The cluster should run 730 hours per month.
Use Ubuntu Linux nodes.
All services should be deployed in Azure East US.`
    });

    const response = await invoke('POST', '/api/estimate', { provider: 'azure', requirements: extracted.body });

    expect(response.status).toBe(200);
    expect(response.body.calculatedLineItems[0]).toMatchObject({ skuName: 'D8s v5', quantity: 4, hours: 730, monthlyCost: 1121.28 });
    expect(response.body.assumptions).toContain(
      'AKS estimate includes worker node VM compute only; AKS control plane, ingress, disks, networking, and managed add-ons are still listed separately when detected.'
    );
  });

  it('POST /api/estimate does not count VM fallback pricing as a calculated cost', async () => {
    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [],
        NextPageLink: null
      });

    const requirements = {
      region: {
        raw: 'East US',
        normalized: 'eastus',
        providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
        confidence: 'high'
      },
      components: [
        {
          id: 'compute-1',
          type: 'compute',
          name: 'Web servers',
          providerServiceHint: { azure: 'Azure Virtual Machines', aws: 'Amazon EC2', gcp: 'Compute Engine' },
          pricingStatus: 'supported',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: '2 web servers with 2 vCPU and 4 GB RAM each',
          role: 'web server',
          quantity: 2,
          vcpu: 2,
          memoryGb: 4,
          operatingSystem: 'linux',
          imageType: 'ubuntu',
          monthlyHours: 730
        }
      ],
      globalAssumptions: [],
      clarifyingQuestions: [],
      extractionMethod: 'llm'
    };

    const response = await invoke('POST', '/api/estimate', { provider: 'azure', requirements });

    expect(response.status).toBe(200);
    expect(response.body.totalMonthlyCost).toBe(0);
    expect(response.body.calculatedLineItems).toEqual([]);
    expect(response.body.unsupportedLineItems).toEqual([
      expect.objectContaining({
        componentId: 'compute-1',
        type: 'compute',
        reason: 'Azure Retail Prices API did not return a matching Linux pay-as-you-go VM hourly price for B2als v2 in eastus. Manual review is required.'
      })
    ]);
    expect(response.body.estimateQuality).toMatchObject({ status: 'blocked', pricedComponentCount: 0, totalComponentCount: 1 });
  });

  it('POST /api/estimate requires manual SKU selection for unmapped VM shapes', async () => {
    const requirements = {
      region: {
        raw: 'East US',
        normalized: 'eastus',
        providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
        confidence: 'high'
      },
      components: [
        {
          id: 'compute-1',
          type: 'compute',
          name: 'Application servers',
          providerServiceHint: { azure: 'Azure Virtual Machines', aws: 'Amazon EC2', gcp: 'Compute Engine' },
          pricingStatus: 'supported',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: '3 application servers with 6 vCPU and 24 GB RAM each',
          role: 'application server',
          quantity: 3,
          vcpu: 6,
          memoryGb: 24,
          operatingSystem: 'linux',
          imageType: 'ubuntu',
          monthlyHours: 730
        }
      ],
      globalAssumptions: [],
      clarifyingQuestions: [],
      extractionMethod: 'llm'
    };

    const response = await invoke('POST', '/api/estimate', { provider: 'azure', requirements });

    expect(response.status).toBe(200);
    expect(response.body.calculatedLineItems).toEqual([]);
    expect(response.body.unsupportedLineItems).toEqual([
      expect.objectContaining({
        componentId: 'compute-1',
        type: 'compute',
        reason: 'No deterministic Azure VM SKU mapping exists for 6 vCPU and 24 GB RAM. Manual SKU selection is required.'
      })
    ]);
    expect(response.body.estimateQuality).toMatchObject({ status: 'blocked', pricedComponentCount: 0, totalComponentCount: 1 });
  });

  it('POST /api/estimate excludes ambiguous duplicate compute when AKS worker nodes are already priced', async () => {
    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            armRegionName: 'eastus',
            serviceName: 'Virtual Machines',
            productName: 'Virtual Machines Dsv5 Series',
            skuName: 'D8s v5',
            armSkuName: 'Standard_D8s_v5',
            meterName: 'D8s v5',
            unitOfMeasure: '1 Hour',
            type: 'Consumption',
            retailPrice: 0.384
          }
        ],
        NextPageLink: null
      });

    const requirements = {
      region: {
        raw: 'East US',
        normalized: 'eastus',
        providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
        confidence: 'high'
      },
      components: [
        {
          id: 'kubernetes-1',
          type: 'kubernetes',
          name: 'AKS cluster',
          providerServiceHint: { azure: 'Azure Kubernetes Service (AKS)', aws: 'Amazon EKS', gcp: 'Google Kubernetes Engine' },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: 'AKS with 4 Linux Ubuntu worker nodes. Each node: 8 vCPU, 32 GB RAM.',
          nodeCount: 4,
          vcpuPerNode: 8,
          memoryGbPerNode: 32,
          operatingSystem: 'linux',
          imageType: 'ubuntu',
          monthlyHours: 730
        },
        {
          id: 'compute-duplicate-1',
          type: 'compute',
          name: 'Virtual machines',
          providerServiceHint: { azure: 'Virtual Machines', aws: 'EC2', gcp: 'Compute Engine' },
          pricingStatus: 'supported',
          confidence: 'medium',
          missingFields: [],
          assumptions: [],
          rawText: 'AKS with 4 Linux Ubuntu worker nodes. CDN data transfer: 3 TB/month.',
          role: null,
          quantity: 3,
          vcpu: 8,
          memoryGb: 32,
          operatingSystem: 'linux',
          imageType: 'ubuntu',
          monthlyHours: 730
        }
      ],
      globalAssumptions: [],
      clarifyingQuestions: [],
      extractionMethod: 'llm'
    };

    const response = await invoke('POST', '/api/estimate', { provider: 'azure', requirements });

    expect(response.status).toBe(200);
    expect(response.body.totalMonthlyCost).toBe(1121.28);
    expect(response.body.calculatedLineItems).toHaveLength(1);
    expect(response.body.unsupportedLineItems).toEqual([]);
    expect(response.body.estimateQuality).toMatchObject({ status: 'complete', coveragePercent: 100, pricedComponentCount: 1, totalComponentCount: 1 });
    expect(response.body.assumptions).toContain('Ignored an ambiguous duplicate VM component because AKS worker node compute is priced from the AKS component.');
  });

  it('POST /api/estimate rejects compute line items whose evidence is CDN transfer', async () => {
    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            armRegionName: 'eastus',
            serviceName: 'Virtual Machines',
            productName: 'Virtual Machines Dsv5 Series',
            skuName: 'D8s v5',
            armSkuName: 'Standard_D8s_v5',
            meterName: 'D8s v5',
            unitOfMeasure: '1 Hour',
            type: 'Consumption',
            retailPrice: 0.384
          }
        ],
        NextPageLink: null
      });

    const requirements = {
      region: {
        raw: 'East US',
        normalized: 'eastus',
        providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
        confidence: 'high'
      },
      components: [
        {
          id: 'kubernetes-1',
          type: 'kubernetes',
          name: 'AKS cluster',
          providerServiceHint: { azure: 'Azure Kubernetes Service (AKS)', aws: 'Amazon EKS', gcp: 'Google Kubernetes Engine' },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: 'AKS with 4 Linux Ubuntu worker nodes. Each node: 8 vCPU, 32 GB RAM.',
          nodeCount: 4,
          vcpuPerNode: 8,
          memoryGbPerNode: 32,
          operatingSystem: 'linux',
          imageType: 'ubuntu',
          monthlyHours: 730
        },
        {
          id: 'compute-from-cdn-1',
          type: 'compute',
          name: 'Virtual machines',
          providerServiceHint: { azure: 'Virtual Machines', aws: 'EC2', gcp: 'Compute Engine' },
          pricingStatus: 'supported',
          confidence: 'medium',
          missingFields: [],
          assumptions: [],
          rawText: 'Content Delivery - Azure CDN - Data transfer: 3 TB/month. SKU or tier for AKS worker node VMs is not specified.',
          role: null,
          quantity: 3,
          vcpu: 8,
          memoryGb: 32,
          operatingSystem: 'linux',
          imageType: 'ubuntu',
          monthlyHours: 730
        }
      ],
      globalAssumptions: [],
      clarifyingQuestions: [],
      extractionMethod: 'llm'
    };

    const response = await invoke('POST', '/api/estimate', { provider: 'azure', requirements });

    expect(response.status).toBe(200);
    expect(response.body.totalMonthlyCost).toBe(1121.28);
    expect(response.body.calculatedLineItems).toHaveLength(1);
    expect(response.body.unsupportedLineItems).toEqual([]);
    expect(response.body.assumptions).toContain('Ignored an ambiguous duplicate VM component because AKS worker node compute is priced from the AKS component.');
  });

  it('POST /api/estimate prices Blob Storage capacity and internet egress from Azure Retail Prices API', async () => {
    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'eastus',
            serviceName: 'Storage',
            serviceFamily: 'Storage',
            productName: 'General Block Blob v2',
            skuName: 'Hot LRS',
            meterName: 'Hot LRS Data Stored',
            unitOfMeasure: '1 GB/Month',
            type: 'Consumption',
            retailPrice: 0.0208
          },
          {
            currencyCode: 'USD',
            tierMinimumUnits: 51200,
            armRegionName: 'eastus',
            serviceName: 'Storage',
            serviceFamily: 'Storage',
            productName: 'General Block Blob v2',
            skuName: 'Hot LRS',
            meterName: 'Hot LRS Data Stored',
            unitOfMeasure: '1 GB/Month',
            type: 'Consumption',
            retailPrice: 0.019968
          }
        ],
        NextPageLink: null
      });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'eastus',
            serviceName: 'Bandwidth',
            serviceFamily: 'Networking',
            productName: 'Rtn Preference: MGN',
            skuName: 'Standard',
            meterName: 'Standard Data Transfer Out',
            unitOfMeasure: '1 GB',
            type: 'Consumption',
            retailPrice: 0
          },
          {
            currencyCode: 'USD',
            tierMinimumUnits: 100,
            armRegionName: 'eastus',
            serviceName: 'Bandwidth',
            serviceFamily: 'Networking',
            productName: 'Rtn Preference: MGN',
            skuName: 'Standard',
            meterName: 'Standard Data Transfer Out',
            unitOfMeasure: '1 GB',
            type: 'Consumption',
            retailPrice: 0.087
          }
        ],
        NextPageLink: null
      });

    const requirements = {
      region: {
        raw: 'East US',
        normalized: 'eastus',
        providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
        confidence: 'high'
      },
      components: [
        {
          id: 'object-storage-1',
          type: 'object_storage',
          name: 'Blob Storage',
          providerServiceHint: { azure: 'Azure Blob Storage', aws: 'Amazon S3', gcp: 'Cloud Storage' },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: 'Azure Blob Storage with 5 TB hot LRS data stored.',
          dataStoredGb: 5120,
          accessTier: 'hot',
          redundancy: 'LRS'
        },
        {
          id: 'network-1',
          type: 'network',
          name: 'Internet egress',
          providerServiceHint: { azure: 'Azure Bandwidth', aws: 'Data Transfer', gcp: 'Network Data Transfer' },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: 'Internet egress excluding CDN: 1 TB/month.',
          monthlyEgressGb: 1024
        }
      ],
      globalAssumptions: [],
      clarifyingQuestions: [],
      extractionMethod: 'llm'
    };

    const response = await invoke('POST', '/api/estimate', { provider: 'azure', requirements });

    expect(response.status).toBe(200);
    expect(response.body.totalMonthlyCost).toBe(186.89);
    expect(response.body.estimateQuality).toMatchObject({ status: 'complete', coveragePercent: 100, pricedComponentCount: 2, totalComponentCount: 2 });
    expect(response.body.calculatedLineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceName: 'Azure Blob Storage',
          skuName: 'Hot LRS',
          usageLabel: '5120 GB-month',
          unitPrice: 0.0208,
          monthlyCost: 106.5
        }),
        expect.objectContaining({
          serviceName: 'Azure Bandwidth',
          skuName: 'Standard',
          meterName: 'Standard Data Transfer Out',
          usageLabel: '1024 GB egress',
          unitPrice: 0.087,
          monthlyCost: 80.39
        })
      ])
    );
  });

  it('POST /api/estimate prices common production services from Azure Retail Prices API', async () => {
    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'eastus',
            serviceName: 'Redis Cache',
            serviceFamily: 'Databases',
            productName: 'Azure Redis Cache Standard',
            skuName: 'C3',
            meterName: 'C3 Cache Instance',
            unitOfMeasure: '1 Hour',
            type: 'Consumption',
            retailPrice: 0.225
          }
        ],
        NextPageLink: null
      });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'eastus',
            serviceName: 'Service Bus',
            serviceFamily: 'Integration',
            productName: 'Service Bus',
            skuName: 'Standard',
            meterName: 'Standard Base Unit',
            unitOfMeasure: '1/Month',
            type: 'Consumption',
            retailPrice: 10
          }
        ],
        NextPageLink: null
      });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'eastus',
            serviceName: 'Service Bus',
            serviceFamily: 'Integration',
            productName: 'Service Bus',
            skuName: 'Standard',
            meterName: 'Standard Messaging Operations',
            unitOfMeasure: '1M',
            type: 'Consumption',
            retailPrice: 0
          },
          {
            currencyCode: 'USD',
            tierMinimumUnits: 13,
            armRegionName: 'eastus',
            serviceName: 'Service Bus',
            serviceFamily: 'Integration',
            productName: 'Service Bus',
            skuName: 'Standard',
            meterName: 'Standard Messaging Operations',
            unitOfMeasure: '1M',
            type: 'Consumption',
            retailPrice: 0.8
          }
        ],
        NextPageLink: null
      });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'eastus',
            serviceName: 'Log Analytics',
            serviceFamily: 'Management and Governance',
            productName: 'Log Analytics',
            skuName: 'Analytics Logs',
            meterName: 'Analytics Logs Data Ingestion',
            unitOfMeasure: '1 GB',
            type: 'Consumption',
            retailPrice: 0
          },
          {
            currencyCode: 'USD',
            tierMinimumUnits: 5,
            armRegionName: 'eastus',
            serviceName: 'Log Analytics',
            serviceFamily: 'Management and Governance',
            productName: 'Log Analytics',
            skuName: 'Analytics Logs',
            meterName: 'Analytics Logs Data Ingestion',
            unitOfMeasure: '1 GB',
            type: 'Consumption',
            retailPrice: 2.3
          }
        ],
        NextPageLink: null
      });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'eastus',
            serviceName: 'Azure Database for PostgreSQL',
            serviceFamily: 'Databases',
            productName: 'Azure Database for PostgreSQL Flexible Server General Purpose Ddsv5 Series Compute',
            skuName: '8 vCore',
            armSkuName: 'Standard_D8ds_v5',
            meterName: 'vCore',
            unitOfMeasure: '1 Hour',
            type: 'Consumption',
            retailPrice: 0.712
          }
        ],
        NextPageLink: null
      });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'eastus',
            serviceName: 'Azure Database for PostgreSQL',
            serviceFamily: 'Databases',
            productName: 'Az DB for PostgreSQL Flexible Server Storage',
            skuName: 'Storage',
            meterName: 'Storage Data Stored',
            unitOfMeasure: '1 GB/Month',
            type: 'Consumption',
            retailPrice: 0.115
          }
        ],
        NextPageLink: null
      });

    const requirements = {
      region: {
        raw: 'East US',
        normalized: 'eastus',
        providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
        confidence: 'high'
      },
      components: [
        {
          id: 'cache-1',
          type: 'cache',
          name: 'Redis cache',
          providerServiceHint: { azure: 'Azure Cache for Redis', aws: 'Amazon ElastiCache for Redis', gcp: 'Memorystore for Redis' },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: 'Production Redis cache with 6 GB memory.',
          engine: 'redis',
          memoryGb: 6,
          tier: 'production'
        },
        {
          id: 'queue-1',
          type: 'queue',
          name: 'Service Bus',
          providerServiceHint: { azure: 'Azure Service Bus', aws: 'Amazon SQS', gcp: 'Pub/Sub' },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: 'Service Bus Standard with 10 million messages per month.',
          messageVolume: 10_000_000,
          tier: 'standard'
        },
        {
          id: 'monitoring-1',
          type: 'monitoring',
          name: 'Azure Monitor',
          providerServiceHint: { azure: 'Azure Monitor / Log Analytics', aws: 'Amazon CloudWatch', gcp: 'Cloud Monitoring' },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: 'Log Analytics ingestion is 200 GB per month and retention is 30 days.',
          logIngestionGb: 200,
          retentionDays: 30
        },
        {
          id: 'database-1',
          type: 'database',
          name: 'PostgreSQL database',
          providerServiceHint: { azure: 'Azure Database for PostgreSQL Flexible Server', aws: 'Amazon RDS for PostgreSQL', gcp: 'Cloud SQL for PostgreSQL' },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: 'Azure Database for PostgreSQL Flexible Server 8 vCPU, 32 GB RAM, 1 TB SSD storage, zone redundant HA.',
          engine: 'postgresql',
          managed: true,
          vcpu: 8,
          memoryGb: 32,
          storageGb: 1024,
          storageType: 'ssd',
          highAvailability: true
        }
      ],
      globalAssumptions: [],
      clarifyingQuestions: [],
      extractionMethod: 'llm'
    };

    const response = await invoke('POST', '/api/estimate', { provider: 'azure', requirements });

    expect(response.status).toBe(200);
    expect(response.body.totalMonthlyCost).toBe(1780.03);
    expect(response.body.estimateQuality).toMatchObject({ status: 'complete', coveragePercent: 100, pricedComponentCount: 4, totalComponentCount: 4 });
    expect(response.body.calculatedLineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ serviceName: 'Azure Cache for Redis', skuName: 'Standard C3', monthlyCost: 164.25 }),
        expect.objectContaining({ serviceName: 'Azure Service Bus', meterName: 'Standard Base Unit', monthlyCost: 10 }),
        expect.objectContaining({ serviceName: 'Azure Service Bus', meterName: 'Standard Messaging Operations', monthlyCost: 0 }),
        expect.objectContaining({ serviceName: 'Azure Monitor / Log Analytics', meterName: 'Analytics Logs Data Ingestion', monthlyCost: 448.5 }),
        expect.objectContaining({ serviceName: 'Azure Database for PostgreSQL Flexible Server', skuName: 'Standard_D8ds_v5 General Purpose', monthlyCost: 1039.52 }),
        expect.objectContaining({ serviceName: 'Azure Database for PostgreSQL Flexible Server', meterName: 'Storage Data Stored', monthlyCost: 117.76 })
      ])
    );
  });

  it('POST /api/estimate prices CDN and HTTP/S Application Gateway from Azure Retail Prices API', async () => {
    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query((query) => retailFilterIncludes(query, ['Content Delivery Network', 'Standard Data Transfer']))
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'Zone 1',
            serviceName: 'Content Delivery Network',
            serviceFamily: 'Networking',
            productName: 'Azure CDN from Microsoft',
            skuName: 'Standard',
            meterName: 'Standard Data Transfer',
            unitOfMeasure: '1 GB',
            type: 'Consumption',
            retailPrice: 0.081
          }
        ],
        NextPageLink: null
      });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query((query) => retailFilterIncludes(query, ['Content Delivery Network', 'Standard Requests']))
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'Zone 1',
            serviceName: 'Content Delivery Network',
            serviceFamily: 'Networking',
            productName: 'Azure CDN from Microsoft',
            skuName: 'Standard',
            meterName: 'Standard Requests',
            unitOfMeasure: '1M/Month',
            type: 'Consumption',
            retailPrice: 0.6
          }
        ],
        NextPageLink: null
      });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query((query) => retailFilterIncludes(query, ['Application Gateway', 'Standard Fixed Cost']))
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'eastus',
            serviceName: 'Application Gateway',
            serviceFamily: 'Networking',
            productName: 'Application Gateway Standard v2',
            skuName: 'Standard',
            meterName: 'Standard Fixed Cost',
            unitOfMeasure: '1/Hour',
            type: 'Consumption',
            retailPrice: 0.2
          }
        ],
        NextPageLink: null
      });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query((query) => retailFilterIncludes(query, ['Application Gateway', 'Standard Capacity Units']))
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            tierMinimumUnits: 0,
            armRegionName: 'eastus',
            serviceName: 'Application Gateway',
            serviceFamily: 'Networking',
            productName: 'Application Gateway Standard v2',
            skuName: 'Standard',
            meterName: 'Standard Capacity Units',
            unitOfMeasure: '1/Hour',
            type: 'Consumption',
            retailPrice: 0.008
          }
        ],
        NextPageLink: null
      });

    const requirements = {
      region: {
        raw: 'East US',
        normalized: 'eastus',
        providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
        confidence: 'high'
      },
      components: [
        {
          id: 'cdn-1',
          type: 'cdn',
          name: 'CDN',
          providerServiceHint: { azure: 'Azure CDN', aws: 'Amazon CloudFront', gcp: 'Cloud CDN' },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: 'Azure CDN with 3 TB transfer and 20 million requests per month.',
          dataTransferGb: 3072,
          requestCount: 20_000_000
        },
        {
          id: 'load-balancer-1',
          type: 'load_balancer',
          name: 'Application Gateway',
          providerServiceHint: { azure: 'Azure Application Gateway', aws: 'Elastic Load Balancing', gcp: 'Cloud Load Balancing' },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: 'Expose API Gateway through an HTTP/S public load balancer with TLS termination.',
          target: 'API Gateway service',
          scheme: 'http_s'
        }
      ],
      globalAssumptions: [],
      clarifyingQuestions: [],
      extractionMethod: 'llm'
    };

    const response = await invoke('POST', '/api/estimate', { provider: 'azure', requirements });

    expect(response.status).toBe(200);
    expect(response.body.totalMonthlyCost).toBe(412.67);
    expect(response.body.estimateQuality).toMatchObject({ status: 'complete', coveragePercent: 100, pricedComponentCount: 2, totalComponentCount: 2 });
    expect(response.body.calculatedLineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ serviceName: 'Azure CDN', meterName: 'Standard Data Transfer', monthlyCost: 248.83 }),
        expect.objectContaining({ serviceName: 'Azure CDN', meterName: 'Standard Requests', monthlyCost: 12 }),
        expect.objectContaining({ serviceName: 'Azure Application Gateway', meterName: 'Standard Fixed Cost', monthlyCost: 146 }),
        expect.objectContaining({ serviceName: 'Azure Application Gateway', meterName: 'Standard Capacity Units', monthlyCost: 5.84 })
      ])
    );
  });
});
