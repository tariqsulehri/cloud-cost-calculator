import type { ICloudPricingAdapter } from './ICloudPricingAdapter.js';
import type { NormalizedEstimateRequest, NormalizedEstimateResponse } from '../../types/estimate.types.js';

export interface AzurePricingDelegate {
  estimateAzureNormalized(request: NormalizedEstimateRequest): Promise<NormalizedEstimateResponse>;
}

export class AzurePricingAdapter implements ICloudPricingAdapter {
  readonly provider = 'azure' as const;

  constructor(private readonly delegate: AzurePricingDelegate) {}

  async estimateNormalized(request: NormalizedEstimateRequest): Promise<NormalizedEstimateResponse> {
    return await this.delegate.estimateAzureNormalized({
      ...request,
      provider: 'azure'
    });
  }
}
