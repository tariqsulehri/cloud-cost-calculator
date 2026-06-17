import type { NormalizedComponent, Provider } from '../types/estimate';

export type ReviewStatus = 'supported' | 'notImplemented' | 'needsReview' | 'unsupported';

export function reviewStatusForComponent(component: NormalizedComponent, provider: Provider | 'compare'): ReviewStatus {
  if (component.missingFields.length > 0 || component.pricingStatus === 'missing_required_fields' || component.pricingStatus === 'needs_review') {
    return 'needsReview';
  }

  if (component.pricingStatus === 'unsupported') {
    return 'unsupported';
  }

  if (isEstimableComponent(component, provider) || component.pricingStatus === 'supported') {
    return 'supported';
  }

  return 'notImplemented';
}

export function isEstimableComponent(component: NormalizedComponent, provider: Provider | 'compare' = 'azure'): boolean {
  if (component.pricingStatus === 'missing_required_fields' || component.pricingStatus === 'unsupported' || component.pricingStatus === 'needs_review') {
    return false;
  }

  if (component.optionalAddon && component.missingFields.length === 0) {
    return true;
  }

  if (provider === 'compare') {
    return (['azure', 'aws', 'gcp'] as Provider[]).some((candidate) => isEstimableComponent(component, candidate));
  }

  if (component.type === 'compute') {
    return hasNumber(component.quantity) && hasNumber(component.vcpu) && hasNumber(component.memoryGb);
  }

  if (component.type === 'kubernetes') {
    return hasNumber(component.nodeCount) && hasNumber(component.vcpuPerNode) && hasNumber(component.memoryGbPerNode);
  }

  if (component.type === 'database') {
    return component.engine === 'postgresql' && hasNumber(component.vcpu) && hasNumber(component.storageGb) && typeof component.highAvailability === 'boolean';
  }

  if (component.type === 'cache') {
    return component.engine === 'redis' && hasNumber(component.memoryGb) && typeof component.tier === 'string';
  }

  if (component.type === 'object_storage') {
    return hasNumber(component.dataStoredGb) && typeof component.accessTier === 'string' && typeof component.redundancy === 'string';
  }

  if (component.type === 'cdn') {
    return hasNumber(component.dataTransferGb) || hasNumber(component.monthlyTransferGb) || hasNumber(component.requestCount);
  }

  if (component.type === 'load_balancer') {
    return provider === 'azure' ? component.scheme === 'http_s' : component.scheme === 'http_s' || component.scheme === 'tcp';
  }

  if (component.type === 'queue') {
    return typeof component.tier === 'string' && hasNumber(component.messageVolume);
  }

  if (component.type === 'monitoring') {
    return hasNumber(component.logIngestionGb);
  }

  if (component.type === 'network') {
    return hasNumber(component.monthlyEgressGb);
  }

  return false;
}

function hasNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
