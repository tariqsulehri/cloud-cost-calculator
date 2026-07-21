import type { ICloudPricingAdapter } from './ICloudPricingAdapter.js';
import type { NormalizedEstimateRequest, NormalizedEstimateResponse } from '../../types/estimate.types.js';
import { PreliminaryCloudPricingService } from '../PreliminaryCloudPricingService.js';

export class GcpPricingAdapter implements ICloudPricingAdapter {
  readonly provider = 'gcp' as const;

  constructor(
    private readonly preliminaryCloudPricingService = new PreliminaryCloudPricingService()
  ) {}

  async estimateNormalized(request: NormalizedEstimateRequest): Promise<NormalizedEstimateResponse> {
    return await this.preliminaryCloudPricingService.estimateNormalized({
      ...request,
      provider: 'gcp'
    });
  }
}
