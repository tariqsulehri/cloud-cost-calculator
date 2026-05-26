import { describe, expect, it } from 'vitest';
import { RequirementPostProcessor } from './RequirementPostProcessor.js';
import type { NormalizedInfrastructureRequirement } from '../types/estimate.types.js';

const postProcessor = new RequirementPostProcessor();

function baseRequirement(component: NormalizedInfrastructureRequirement['components'][number]): NormalizedInfrastructureRequirement {
  return {
    region: {
      raw: 'US East',
      normalized: 'eastus',
      providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
      confidence: 'high'
    },
    components: [component],
    globalAssumptions: [],
    clarifyingQuestions: [
      'Should PostgreSQL be highly available?',
      'Should Redis be basic/dev or production-grade?',
      'Is the load balancer HTTP/S or TCP?'
    ],
    extractionMethod: 'llm'
  };
}

describe('RequirementPostProcessor', () => {
  it('sets PostgreSQL highAvailability from highly available option', () => {
    const result = postProcessor.process(
      'PostgreSQL with highly available option',
      baseRequirement({
        id: 'database-1',
        type: 'database',
        name: 'PostgreSQL database',
        providerServiceHint: { azure: 'Azure Database for PostgreSQL', aws: null, gcp: null },
        pricingStatus: 'not_implemented',
        confidence: 'high',
        missingFields: ['highAvailability'],
        assumptions: [],
        rawText: 'PostgreSQL with highly available option',
        engine: 'postgresql',
        managed: true,
        vcpu: null,
        memoryGb: null,
        storageGb: null,
        storageType: null,
        highAvailability: null
      })
    );
    const database = result.components[0];

    expect(database).toMatchObject({ highAvailability: true, missingFields: [] });
    expect(result.clarifyingQuestions).not.toContain('Should PostgreSQL be highly available?');
  });

  it('sets Redis tier production from production grade', () => {
    const result = postProcessor.process(
      'Redis cache production grade',
      baseRequirement({
        id: 'cache-1',
        type: 'cache',
        name: 'Redis cache',
        providerServiceHint: { azure: 'Azure Cache for Redis', aws: null, gcp: null },
        pricingStatus: 'not_implemented',
        confidence: 'high',
        missingFields: ['tier'],
        assumptions: [],
        rawText: 'Redis cache production grade',
        engine: 'redis',
        memoryGb: 2,
        tier: null
      })
    );
    const cache = result.components[0];

    expect(cache).toMatchObject({ tier: 'production', missingFields: [] });
    expect(result.clarifyingQuestions).not.toContain('Should Redis be basic/dev or production-grade?');
  });

  it('sets PostgreSQL storage from storage label with TB unit', () => {
    const result = postProcessor.process(
      'Managed PostgreSQL database - 8 vCPU, 32 GB RAM - storage: 1 TB SSD - high availability yes',
      baseRequirement({
        id: 'database-1',
        type: 'database',
        name: 'PostgreSQL database',
        providerServiceHint: { azure: 'Azure Database for PostgreSQL', aws: null, gcp: null },
        pricingStatus: 'not_implemented',
        confidence: 'medium',
        missingFields: ['storageGb'],
        assumptions: [],
        rawText: 'Managed PostgreSQL database - 8 vCPU, 32 GB RAM - storage: 1 TB SSD',
        engine: 'postgresql',
        managed: true,
        vcpu: 8,
        memoryGb: 32,
        storageGb: null,
        storageType: null,
        highAvailability: true
      })
    );

    expect(result.components[0]).toMatchObject({ storageGb: 1024, storageType: 'ssd', missingFields: [] });
  });


  it('sets Redis tier production from UI clarification text', () => {
    const result = postProcessor.process(
      'Redis cache with 2GB memory. Redis tier: production.',
      baseRequirement({
        id: 'cache-1',
        type: 'cache',
        name: 'Redis cache',
        providerServiceHint: { azure: 'Azure Cache for Redis', aws: null, gcp: null },
        pricingStatus: 'not_implemented',
        confidence: 'high',
        missingFields: ['tier'],
        assumptions: [],
        rawText: 'Redis cache with 2GB memory',
        engine: 'redis',
        memoryGb: 2,
        tier: null
      })
    );
    const cache = result.components[0];

    expect(cache).toMatchObject({ tier: 'production', missingFields: [] });
    expect(result.clarifyingQuestions).not.toContain('Should Redis be basic/dev or production-grade?');
  });

  it('sets Redis tier basic from UI clarification text', () => {
    const result = postProcessor.process(
      'Redis cache with 2GB memory. Redis tier: basic.',
      baseRequirement({
        id: 'cache-1',
        type: 'cache',
        name: 'Redis cache',
        providerServiceHint: { azure: 'Azure Cache for Redis', aws: null, gcp: null },
        pricingStatus: 'not_implemented',
        confidence: 'high',
        missingFields: ['tier'],
        assumptions: [],
        rawText: 'Redis cache with 2GB memory',
        engine: 'redis',
        memoryGb: 2,
        tier: null
      })
    );
    const cache = result.components[0];

    expect(cache).toMatchObject({ tier: 'basic', missingFields: [] });
    expect(result.clarifyingQuestions).not.toContain('Should Redis be basic/dev or production-grade?');
  });

  it('sets Redis tier production from concise tier statement', () => {
    const result = postProcessor.process(
      'Cache: Redis. Memory: 2 GB. Tier: production.',
      baseRequirement({
        id: 'cache-1',
        type: 'cache',
        name: 'Redis cache',
        providerServiceHint: { azure: 'Azure Cache for Redis', aws: null, gcp: null },
        pricingStatus: 'not_implemented',
        confidence: 'high',
        missingFields: ['tier'],
        assumptions: [],
        rawText: 'Cache: Redis. Memory: 2 GB.',
        engine: 'redis',
        memoryGb: 2,
        tier: null
      })
    );
    const cache = result.components[0];

    expect(cache).toMatchObject({ tier: 'production', missingFields: [] });
    expect(result.clarifyingQuestions).not.toContain('Should Redis be basic/dev or production-grade?');
  });

  it('sets load balancer HTTP/S scheme and Azure Application Gateway', () => {
    const result = postProcessor.process(
      'Load balancer HTTP/S',
      baseRequirement({
        id: 'load-balancer-1',
        type: 'load_balancer',
        name: 'Load balancer',
        providerServiceHint: { azure: 'Azure Load Balancer / Application Gateway', aws: null, gcp: null },
        pricingStatus: 'not_implemented',
        confidence: 'high',
        missingFields: ['scheme'],
        assumptions: [],
        rawText: 'Load balancer HTTP/S',
        target: null,
        scheme: null
      })
    );
    const loadBalancer = result.components[0];

    expect(loadBalancer).toMatchObject({
      scheme: 'http_s',
      azureService: 'Azure Application Gateway',
      providerServiceHint: { azure: 'Azure Application Gateway' },
      missingFields: []
    });
    expect(result.clarifyingQuestions).not.toContain('Is the load balancer HTTP/S or TCP?');
  });

  it('sets load balancer target from API Gateway evidence', () => {
    const result = postProcessor.process(
      'Expose the API Gateway through an HTTP/S public load balancer or ingress.',
      baseRequirement({
        id: 'load-balancer-1',
        type: 'load_balancer',
        name: 'Load balancer',
        providerServiceHint: { azure: 'Azure Load Balancer / Application Gateway', aws: null, gcp: null },
        pricingStatus: 'not_implemented',
        confidence: 'high',
        missingFields: ['target'],
        assumptions: [],
        rawText: 'load balancer or ingress',
        target: null,
        scheme: 'http_s'
      })
    );

    expect(result.components[0]).toMatchObject({ target: 'API Gateway service', missingFields: [] });
  });

  it('sets AKS node count from Linux Ubuntu worker node evidence', () => {
    const result = postProcessor.process(
      'Kubernetes cluster: AKS with 4 Linux Ubuntu worker nodes. Each node: 8 vCPU, 32 GB RAM. Cluster runtime: 730 hours per month.',
      baseRequirement({
        id: 'kubernetes-1',
        type: 'kubernetes',
        name: 'AKS cluster',
        providerServiceHint: { azure: 'Azure Kubernetes Service (AKS)', aws: null, gcp: null },
        pricingStatus: 'missing_required_fields',
        confidence: 'medium',
        missingFields: ['nodeCount'],
        assumptions: [],
        rawText: 'AKS with 4 Linux Ubuntu worker nodes',
        nodeCount: null,
        vcpuPerNode: 8,
        memoryGbPerNode: 32,
        operatingSystem: 'linux',
        imageType: 'ubuntu',
        monthlyHours: 730
      })
    );

    expect(result.components[0]).toMatchObject({ nodeCount: 4, missingFields: [] });
  });


  it('removes contradictory HTTP/S assumptions when load balancer scheme is not explicit', () => {
    const result = postProcessor.process(
      'Load balancer across both servers',
      {
        ...baseRequirement({
          id: 'load-balancer-1',
          type: 'load_balancer',
          name: 'Load balancer',
          providerServiceHint: { azure: 'Azure Load Balancer / Application Gateway', aws: null, gcp: null },
          pricingStatus: 'not_implemented',
          confidence: 'high',
          missingFields: ['scheme'],
          assumptions: ['Load balancer uses HTTP/S scheme by default when not specified'],
          rawText: 'Load balancer across both servers',
          target: 'both servers',
          scheme: null
        }),
        globalAssumptions: ['Load balancer uses HTTP/S scheme by default when not specified']
      }
    );
    const loadBalancer = result.components[0];

    expect(loadBalancer).toMatchObject({ scheme: null, assumptions: [] });
    expect(result.globalAssumptions).toEqual([]);
  });
});
