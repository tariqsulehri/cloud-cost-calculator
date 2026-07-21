import type { Provider, NormalizedEstimateRequest, NormalizedEstimateResponse } from '../../types/estimate.types.js';

export interface ICloudPricingAdapter {
  readonly provider: Provider;
  estimateNormalized(request: NormalizedEstimateRequest): Promise<NormalizedEstimateResponse>;
}
