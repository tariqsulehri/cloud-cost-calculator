import { describe, expect, it } from 'vitest';
import { LLMRequirementExtractionService } from './LLMRequirementExtractionService.js';
import { RequirementExtractionService } from './RequirementExtractionService.js';

const exactPrompt = `I need 2 web servers with 4 vCPU and 16GB RAM each, running Linux Ubuntu.
A managed PostgreSQL database with 8 vCPU and 32GB RAM, 500GB SSD storage with highly available option.
Redis cache production grade with 2GB memory.
A CDN for static assets, 1TB data transfer per month.
Load balancer HTTP/S across both servers.
All in US East region.`;

function fakeClient(output: unknown) {
  return {
    responses: {
      async create() {
        return {
          output_text: typeof output === 'string' ? output : JSON.stringify(output)
        };
      }
    }
  };
}

describe('LLMRequirementExtractionService', () => {
  it('returns validated LLM extraction with extractionMethod', async () => {
    const service = new LLMRequirementExtractionService(new RequirementExtractionService(), {
      model: 'test-model',
      client: fakeClient({
        region: {
          raw: 'US East',
          normalized: 'eastus',
          providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
          confidence: 'high'
        },
        components: [
          {
            id: 'compute-1',
            type: 'compute',
            name: 'Virtual machines',
            providerServiceHint: { azure: 'Virtual Machines', aws: 'EC2', gcp: 'Compute Engine' },
            pricingStatus: 'supported',
            confidence: 'high',
            missingFields: [],
            assumptions: ['Compute hours default to 730 hours per month.'],
            rawText: '2 web servers with 4 vCPU and 16GB RAM each, running Linux Ubuntu',
            role: 'web servers',
            quantity: 2,
            vcpu: 4,
            memoryGb: 16,
            os: 'linux',
            image: 'ubuntu',
            monthlyHours: 730
          },
          {
            id: 'database-1',
            type: 'database',
            name: 'PostgreSQL database',
            providerServiceHint: { azure: 'Azure Database for PostgreSQL', aws: 'Amazon RDS for PostgreSQL', gcp: 'Cloud SQL for PostgreSQL' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: ['PostgreSQL pricing is detected but not implemented in this phase.'],
            rawText: 'A managed PostgreSQL database with 8 vCPU and 32GB RAM, 500GB SSD storage with highly available option.',
            engine: 'postgresql',
            managed: true,
            vcpu: 8,
            memoryGb: 32,
            storageGb: 500,
            storageType: 'ssd',
            highAvailability: true
          },
          {
            id: 'cache-1',
            type: 'cache',
            name: 'Redis cache',
            providerServiceHint: { azure: 'Azure Cache for Redis', aws: 'Amazon ElastiCache for Redis', gcp: 'Memorystore for Redis' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: ['Redis pricing is detected but not implemented in this phase.'],
            rawText: 'Redis cache production grade with 2GB memory.',
            engine: 'redis',
            memoryGb: 2,
            tier: 'production'
          },
          {
            id: 'cdn-1',
            type: 'cdn',
            name: 'CDN',
            providerServiceHint: { azure: 'Azure CDN', aws: 'Amazon CloudFront', gcp: 'Cloud CDN' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: ['1 TB is normalized to 1024 GB.'],
            rawText: 'A CDN for static assets, 1TB data transfer per month.',
            purpose: 'static assets',
            monthlyTransferGb: 1024
          },
          {
            id: 'load-balancer-1',
            type: 'load_balancer',
            name: 'Load balancer',
            providerServiceHint: { azure: 'Azure Load Balancer', aws: 'Elastic Load Balancing', gcp: 'Cloud Load Balancing' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: 'Load balancer HTTP/S across both servers.',
            targets: 'both servers',
            scheme: 'http_s'
          }
        ],
        globalAssumptions: ['OpenAI extracted requirements only; pricing is calculated separately.'],
        clarifyingQuestions: []
      })
    });

    const result = await service.extractRequirements(exactPrompt);
    const compute = result.components.find((component) => component.type === 'compute');
    const database = result.components.find((component) => component.type === 'database');
    const cache = result.components.find((component) => component.type === 'cache');
    const cdn = result.components.find((component) => component.type === 'cdn');
    const loadBalancer = result.components.find((component) => component.type === 'load_balancer');

    expect(result.extractionMethod).toBe('llm');
    expect(result.region.providerRegion).toEqual({ azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' });
    expect(compute).toMatchObject({ quantity: 2, vcpu: 4, memoryGb: 16, operatingSystem: 'linux', imageType: 'ubuntu' });
    expect(database).toMatchObject({ engine: 'postgresql', vcpu: 8, memoryGb: 32, storageGb: 500, storageType: 'ssd', highAvailability: true });
    expect(cache).toMatchObject({ engine: 'redis', memoryGb: 2, tier: 'production' });
    expect(cdn).toMatchObject({ dataTransferGb: 1024, monthlyTransferGb: 1024 });
    expect(loadBalancer).toMatchObject({ target: 'both servers', scheme: 'http_s' });
    expect(result.clarifyingQuestions).toEqual([]);
  });

  it('overwrites LLM service mapping and pricing status with backend mapping', async () => {
    const service = new LLMRequirementExtractionService(new RequirementExtractionService(), {
      model: 'test-model',
      client: fakeClient({
        region: {
          raw: 'US East',
          normalized: 'eastus',
          providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
          confidence: 'high'
        },
        components: [
          {
            id: 'compute-1',
            type: 'compute',
            name: 'Web servers',
            providerServiceHint: { azure: null, aws: null, gcp: null },
            pricingStatus: 'needs_review',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: '2 web servers with 4 vCPU and 16GB RAM each',
            quantity: 2,
            vcpu: 4,
            memoryGb: 16,
            os: 'linux',
            image: 'ubuntu'
          },
          {
            id: 'queue-1',
            type: 'queue',
            name: 'Queue',
            providerServiceHint: { azure: null, aws: null, gcp: null },
            pricingStatus: 'supported',
            confidence: 'medium',
            missingFields: [],
            assumptions: [],
            rawText: 'a message queue'
          }
        ],
        globalAssumptions: [],
        clarifyingQuestions: []
      })
    });

    const result = await service.extractRequirements('2 web servers with 4 vCPU and 16GB RAM each and a message queue in US East.');
    const compute = result.components.find((component) => component.type === 'compute');
    const queue = result.components.find((component) => component.type === 'queue');

    expect(compute).toMatchObject({
      pricingStatus: 'supported',
      providerServiceHint: { azure: 'Azure Virtual Machines', aws: 'Amazon EC2', gcp: 'Compute Engine' }
    });
    expect(queue).toMatchObject({
      pricingStatus: 'not_implemented',
      providerServiceHint: { azure: 'Azure Service Bus', aws: 'Amazon SQS / Amazon EventBridge', gcp: 'Pub/Sub' }
    });
    expect(result.globalAssumptions).toContain('Backend service mapping is authoritative; OpenAI extracts requirements only and does not calculate prices.');
  });

  it('repairs missed explicit HA, Redis tier, and HTTP/S load balancer values after LLM extraction', async () => {
    const service = new LLMRequirementExtractionService(new RequirementExtractionService(), {
      model: 'test-model',
      client: fakeClient({
        region: {
          raw: 'US East',
          normalized: 'eastus',
          providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
          confidence: 'high'
        },
        components: [
          {
            id: 'database-1',
            type: 'database',
            name: 'PostgreSQL database',
            providerServiceHint: { azure: null, aws: null, gcp: null },
            pricingStatus: 'needs_review',
            confidence: 'high',
            missingFields: ['highAvailability'],
            assumptions: [],
            rawText: 'PostgreSQL database with highly available option',
            engine: 'PostgreSQL',
            managed: true,
            vcpu: 8,
            memoryGb: 32,
            storageGb: 500,
            storageType: 'SSD',
            highAvailability: null
          },
          {
            id: 'cache-1',
            type: 'cache',
            name: 'Redis cache',
            providerServiceHint: { azure: null, aws: null, gcp: null },
            pricingStatus: 'needs_review',
            confidence: 'high',
            missingFields: ['tier'],
            assumptions: [],
            rawText: 'Redis cache production grade with 2GB memory',
            engine: 'Redis',
            memoryGb: 2,
            tier: null
          },
          {
            id: 'load-balancer-1',
            type: 'load_balancer',
            name: 'Load balancer',
            providerServiceHint: { azure: null, aws: null, gcp: null },
            pricingStatus: 'needs_review',
            confidence: 'high',
            missingFields: ['scheme'],
            assumptions: [],
            rawText: 'Load balancer HTTP/S across both servers',
            target: 'both servers',
            scheme: null
          }
        ],
        globalAssumptions: [],
        clarifyingQuestions: [
          'Should PostgreSQL be highly available?',
          'Should Redis be basic/dev or production-grade?',
          'Is the load balancer HTTP/S or TCP?'
        ]
      })
    });

    const result = await service.extractRequirements(exactPrompt);
    const database = result.components.find((component) => component.type === 'database');
    const cache = result.components.find((component) => component.type === 'cache');
    const loadBalancer = result.components.find((component) => component.type === 'load_balancer');

    expect(result.extractionMethod).toBe('llm');
    expect(database).toMatchObject({ highAvailability: true, missingFields: [] });
    expect(database?.missingFields).not.toContain('highAvailability');
    expect(cache).toMatchObject({ tier: 'production', missingFields: [] });
    expect(cache?.missingFields).not.toContain('tier');
    expect(loadBalancer).toMatchObject({
      scheme: 'http_s',
      azureService: 'Azure Application Gateway',
      providerServiceHint: { azure: 'Azure Application Gateway' },
      missingFields: []
    });
    expect(loadBalancer?.missingFields).not.toContain('scheme');
    expect(result.clarifyingQuestions).not.toContain('Should PostgreSQL be highly available?');
    expect(result.clarifyingQuestions).not.toContain('Should Redis be basic/dev or production-grade?');
    expect(result.clarifyingQuestions).not.toContain('Is the load balancer HTTP/S or TCP?');
  });

  it('uses rule-based fallback when LLM response fails validation', async () => {
    const service = new LLMRequirementExtractionService(new RequirementExtractionService(), {
      model: 'test-model',
      client: fakeClient({ components: [] })
    });

    const result = await service.extractRequirements(exactPrompt);

    expect(result.extractionMethod).toBe('rule-based-fallback');
    expect(result.globalAssumptions).toContain('OpenAI extraction failed validation; rule-based fallback was used.');
  });

  it('repairs a valid empty LLM extraction when the prompt clearly describes AKS worker nodes', async () => {
    const service = new LLMRequirementExtractionService(new RequirementExtractionService(), {
      model: 'test-model',
      client: fakeClient({
        region: {
          raw: 'Azure East US',
          normalized: 'eastus',
          providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
          confidence: 'high'
        },
        components: [],
        globalAssumptions: [],
        clarifyingQuestions: []
      })
    });

    const result = await service.extractRequirements(`Azure Cost Estimation Request - Compute

Region:
- Azure East US

Azure Kubernetes Service (AKS):
- Node count: 4 Linux worker nodes
- VM size per node: 8 vCPU, 32 GB RAM
- Operating System: Ubuntu Linux
- Runtime: 730 hours per month per node`);
    const kubernetes = result.components.find((component) => component.type === 'kubernetes');

    expect(result.extractionMethod).toBe('llm');
    expect(kubernetes).toMatchObject({
      providerServiceHint: { azure: 'Azure Kubernetes Service (AKS)' },
      missingFields: [],
      nodeCount: 4,
      vcpuPerNode: 8,
      memoryGbPerNode: 32,
      operatingSystem: 'linux',
      imageType: 'ubuntu',
      monthlyHours: 730
    });
  });
});
