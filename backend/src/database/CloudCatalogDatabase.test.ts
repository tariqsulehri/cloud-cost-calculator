import { afterEach, describe, expect, it } from 'vitest';
import { CloudCatalogDatabase } from './CloudCatalogDatabase.js';

const databases: CloudCatalogDatabase[] = [];

function createCatalog(): CloudCatalogDatabase {
  const catalog = new CloudCatalogDatabase({ path: ':memory:' });
  databases.push(catalog);
  return catalog;
}

afterEach(() => {
  databases.splice(0).forEach((catalog) => catalog.close());
});

describe('CloudCatalogDatabase', () => {
  it('seeds cross-cloud service hints for common services', () => {
    const catalog = createCatalog();

    expect(catalog.providerHintsForServiceKey('kubernetes')).toEqual({
      azure: 'Azure Kubernetes Service (AKS)',
      aws: 'Amazon EKS',
      gcp: 'Google Kubernetes Engine'
    });
    expect(catalog.providerHintsForServiceKey('database.postgresql')).toEqual({
      azure: 'Azure Database for PostgreSQL Flexible Server',
      aws: 'Amazon RDS for PostgreSQL',
      gcp: 'Cloud SQL for PostgreSQL'
    });
  });

  it('lists provider services with aliases and required pricing fields', () => {
    const catalog = createCatalog();
    const services = catalog.listServices({ provider: 'azure', query: 'redis' });
    const redisCache = services.find((service) => service.serviceKey === 'cache.redis');

    expect(services.length).toBeGreaterThanOrEqual(2);
    expect(redisCache).toMatchObject({
      serviceKey: 'cache.redis',
      providerId: 'azure',
      canonicalName: 'Azure Cache for Redis',
      componentType: 'cache',
      pricingServiceName: 'Azure Cache for Redis',
      sourceCategory: 'Databases',
      mappingStatus: 'mapped'
    });
    expect(redisCache?.aliases).toContain('redis');
    expect(redisCache?.requiredFields).toEqual(['engine', 'memoryGb', 'tier']);
  });

  it('does not require load balancer target for pricing readiness', () => {
    const catalog = createCatalog();
    const services = catalog.listServices({ provider: 'azure', query: 'Application Gateway' });
    const applicationGateway = services.find((service) => service.serviceKey === 'load_balancer.http_s');

    expect(applicationGateway?.requiredFields).toEqual(['scheme']);
  });

  it('uses monthly transfer as the CDN pricing readiness field', () => {
    const catalog = createCatalog();
    const services = catalog.listServices({ provider: 'azure', query: 'Azure CDN' });
    const cdn = services.find((service) => service.serviceKey === 'cdn');

    expect(cdn?.requiredFields).toEqual(['monthlyTransferGb']);
  });

  it('imports the full spreadsheet service catalog for each provider', () => {
    const catalog = createCatalog();

    expect(catalog.listServices({ provider: 'azure' }).length).toBeGreaterThanOrEqual(138);
    expect(catalog.listServices({ provider: 'aws' }).length).toBeGreaterThanOrEqual(138);
    expect(catalog.listServices({ provider: 'gcp' }).length).toBeGreaterThanOrEqual(138);

    expect(catalog.listServices({ provider: 'aws', query: 'Amazon SageMaker' })).toContainEqual(
      expect.objectContaining({
        serviceKey: 'ai-machine-learning.azure-machine-learning',
        sourceCategory: 'AI + Machine Learning',
        mappingStatus: 'mapped'
      })
    );
  });

  it('keeps no-direct-equivalent mappings visible for review', () => {
    const catalog = createCatalog();
    const services = catalog.listServices({ provider: 'aws', query: 'Graph Data Connect' });

    expect(services).toContainEqual(
      expect.objectContaining({
        serviceKey: 'analytics.graph-data-connect',
        canonicalName: 'No direct equivalent',
        mappingStatus: 'no_direct_equivalent',
        notes: 'No direct equivalent in the source mapping.'
      })
    );
  });

  it('maps private cloud networks across Azure, AWS, and GCP', () => {
    const catalog = createCatalog();
    const services = catalog.listServices({ query: 'virtual private network' });

    expect(services).toHaveLength(3);
    expect(services.map((service) => service.canonicalName).sort()).toEqual([
      'Amazon Virtual Private Cloud (VPC)',
      'Azure Virtual Network',
      'Virtual Private Cloud (VPC)'
    ]);
  });

  it('upserts Azure retail price meters for later catalog lookup', () => {
    const catalog = createCatalog();

    const rowsUpserted = catalog.upsertAzureRetailPriceMeters([
      {
        currencyCode: 'USD',
        armRegionName: 'eastus',
        location: 'US East',
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
        unitPrice: 0.192,
        tierMinimumUnits: 0
      }
    ]);

    const meters = catalog.listRetailPriceMeters({ provider: 'azure', region: 'eastus', query: 'D4s' });

    expect(rowsUpserted).toBe(1);
    expect(meters).toHaveLength(1);
    expect(meters[0]).toMatchObject({
      providerId: 'azure',
      serviceName: 'Virtual Machines',
      productName: 'Virtual Machines Dsv5 Series',
      skuName: 'D4s v5',
      armSkuName: 'Standard_D4s_v5',
      retailPrice: 0.192
    });
  });

  it('upserts AWS retail price meters for later catalog lookup', () => {
    const catalog = createCatalog();

    const rowsUpserted = catalog.upsertAwsRetailPriceMeters([
      {
        priceKey: 'AmazonEC2:us-east-1:SKU:TERM:RATE',
        serviceName: 'AmazonEC2',
        serviceFamily: 'Compute Instance',
        productName: 'Compute Instance',
        skuName: 'm7i.xlarge',
        armSkuName: 'm7i.xlarge',
        meterId: 'RATE',
        meterName: '$0.2016 per On Demand Linux m7i.xlarge Instance Hour',
        armRegionName: 'us-east-1',
        location: 'US East (N. Virginia)',
        unitOfMeasure: 'Hrs',
        priceType: 'OnDemand',
        currencyCode: 'USD',
        retailPrice: 0.2016,
        unitPrice: 0.2016,
        tierMinimumUnits: 0,
        raw: { sku: 'SKU' }
      }
    ]);

    const meters = catalog.listRetailPriceMeters({ provider: 'aws', region: 'us-east-1', query: 'm7i.xlarge' });

    expect(rowsUpserted).toBe(1);
    expect(meters).toHaveLength(1);
    expect(meters[0]).toMatchObject({
      providerId: 'aws',
      serviceName: 'AmazonEC2',
      skuName: 'm7i.xlarge',
      armSkuName: 'm7i.xlarge',
      unitOfMeasure: 'Hrs',
      unitPrice: 0.2016
    });
  });
});
