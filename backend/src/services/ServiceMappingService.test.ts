import { describe, expect, it } from 'vitest';
import { CloudCatalogDatabase } from '../database/CloudCatalogDatabase.js';
import type { NormalizedInfrastructureRequirement } from '../types/estimate.types.js';
import { ServiceMappingService } from './ServiceMappingService.js';

const baseRequirement: NormalizedInfrastructureRequirement = {
  region: {
    raw: 'US East',
    normalized: 'eastus',
    providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
    confidence: 'high'
  },
  globalAssumptions: [],
  clarifyingQuestions: [],
  extractionMethod: 'rule-based-fallback',
  components: []
};

describe('ServiceMappingService', () => {
  it('uses the SQLite catalog for provider service hints', () => {
    const catalog = new CloudCatalogDatabase({ path: ':memory:' });
    const service = new ServiceMappingService(catalog);

    const result = service.mapRequirement({
      ...baseRequirement,
      components: [
        {
          id: 'cache-1',
          type: 'cache',
          name: 'Redis cache',
          providerServiceHint: { azure: null, aws: null, gcp: null },
          pricingStatus: 'needs_review',
          confidence: 'high',
          missingFields: [],
          assumptions: [],
          rawText: 'Redis cache',
          engine: 'redis',
          memoryGb: 2,
          tier: 'production'
        }
      ]
    });

    expect(result.components[0].providerServiceHint).toEqual({
      azure: 'Azure Cache for Redis',
      aws: 'Amazon ElastiCache for Redis',
      gcp: 'Memorystore for Redis'
    });

    catalog.close();
  });
});
