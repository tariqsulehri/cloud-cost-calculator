import { describe, expect, it, vi } from 'vitest';
import { AwsPricingAdapter } from './AwsPricingAdapter.js';
import { AzurePricingAdapter } from './AzurePricingAdapter.js';
import { GcpPricingAdapter } from './GcpPricingAdapter.js';
import type { NormalizedEstimateRequest, NormalizedEstimateResponse } from '../../types/estimate.types.js';

describe('Pricing Adapters', () => {
  const dummyRequest: NormalizedEstimateRequest = {
    provider: 'aws',
    requirements: {
      region: {
        raw: 'us-east-1',
        normalized: 'US East',
        providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
        confidence: 'high'
      },
      components: [],
      globalAssumptions: [],
      clarifyingQuestions: [],
      extractionMethod: 'rule-based-fallback'
    }
  };

  const dummyResponse: NormalizedEstimateResponse = {
    provider: 'aws',
    region: 'us-east-1',
    currency: 'USD',
    totalMonthlyCost: 100,
    estimateQuality: {
      status: 'complete',
      coveragePercent: 100,
      pricedComponentCount: 1,
      totalComponentCount: 1,
      summary: 'Complete',
      blockers: []
    },
    calculatedLineItems: [],
    notImplementedLineItems: [],
    unsupportedLineItems: [],
    missingRequiredFieldLineItems: [],
    assumptions: [],
    clarifyingQuestions: []
  };

  it('AwsPricingAdapter delegates to preliminary cloud pricing service', async () => {
    const mockService = {
      estimateNormalized: vi.fn().mockResolvedValue(dummyResponse)
    } as any;
    const adapter = new AwsPricingAdapter(mockService);

    const result = await adapter.estimateNormalized(dummyRequest);
    expect(result.provider).toBe('aws');
    expect(mockService.estimateNormalized).toHaveBeenCalled();
  });

  it('GcpPricingAdapter delegates to preliminary cloud pricing service', async () => {
    const mockService = {
      estimateNormalized: vi.fn().mockResolvedValue({ ...dummyResponse, provider: 'gcp' })
    } as any;
    const adapter = new GcpPricingAdapter(mockService);

    const result = await adapter.estimateNormalized({ ...dummyRequest, provider: 'gcp' });
    expect(result.provider).toBe('gcp');
    expect(mockService.estimateNormalized).toHaveBeenCalled();
  });

  it('AzurePricingAdapter delegates to AzurePricingDelegate', async () => {
    const mockDelegate = {
      estimateAzureNormalized: vi.fn().mockResolvedValue({ ...dummyResponse, provider: 'azure' })
    };
    const adapter = new AzurePricingAdapter(mockDelegate);

    const result = await adapter.estimateNormalized({ ...dummyRequest, provider: 'azure' });
    expect(result.provider).toBe('azure');
    expect(mockDelegate.estimateAzureNormalized).toHaveBeenCalled();
  });
});
