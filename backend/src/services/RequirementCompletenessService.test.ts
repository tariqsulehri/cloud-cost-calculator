import { describe, expect, it } from 'vitest';
import { RequirementCompletenessService } from './RequirementCompletenessService.js';
import type { NormalizedInfrastructureRequirement } from '../types/estimate.types.js';

const service = new RequirementCompletenessService();

function requirement(component: NormalizedInfrastructureRequirement['components'][number]): NormalizedInfrastructureRequirement {
  return {
    region: {
      raw: 'US East',
      normalized: 'eastus',
      providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
      confidence: 'high'
    },
    components: [component],
    globalAssumptions: [],
    clarifyingQuestions: [],
    extractionMethod: 'llm'
  };
}

describe('RequirementCompletenessService', () => {
  it('does not require load balancer target when scheme is known', () => {
    const result = service.process(
      requirement({
        id: 'load-balancer-1',
        type: 'load_balancer',
        name: 'Load balancer',
        providerServiceHint: { azure: 'Azure Application Gateway', aws: 'Elastic Load Balancing', gcp: 'Cloud Load Balancing' },
        pricingStatus: 'missing_required_fields',
        confidence: 'high',
        missingFields: ['target'],
        assumptions: ['HTTP/S load balancer pricing maps to Azure Application Gateway Standard v2 baseline pricing.'],
        rawText: 'load balancer or ingress',
        target: null,
        scheme: 'http_s'
      })
    );

    expect(result.components[0]).toMatchObject({
      missingFields: [],
      pricingStatus: 'not_implemented'
    });
  });

  it('still requires load balancer scheme because it chooses the priced service type', () => {
    const result = service.process(
      requirement({
        id: 'load-balancer-1',
        type: 'load_balancer',
        name: 'Load balancer',
        providerServiceHint: { azure: 'Azure Load Balancer / Application Gateway', aws: 'Elastic Load Balancing', gcp: 'Cloud Load Balancing' },
        pricingStatus: 'not_implemented',
        confidence: 'medium',
        missingFields: [],
        assumptions: [],
        rawText: 'load balancer',
        target: 'API Gateway service',
        scheme: null
      })
    );

    expect(result.components[0]).toMatchObject({
      missingFields: ['scheme'],
      pricingStatus: 'missing_required_fields'
    });
  });
});
