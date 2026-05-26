import type { NormalizedComponent, NormalizedComponentType, NormalizedInfrastructureRequirement, PricingStatus } from '../types/estimate.types.js';

export class RequirementCompletenessService {
  process(requirement: NormalizedInfrastructureRequirement): NormalizedInfrastructureRequirement {
    return {
      ...requirement,
      components: requirement.components.map((component) => {
        const missingFields = this.missingFields(component);
        return {
          ...component,
          missingFields,
          pricingStatus: this.pricingStatus(component.type, missingFields)
        } as NormalizedComponent;
      })
    };
  }

  private missingFields(component: NormalizedComponent): string[] {
    if (component.type === 'compute') {
      return [
        this.isMissing(component.quantity) ? 'quantity' : null,
        this.isMissing(component.vcpu) ? 'vcpu' : null,
        this.isMissing(component.memoryGb) ? 'memoryGb' : null,
        this.isMissing(component.operatingSystem) && this.isMissing(component.os) ? 'operatingSystem' : null,
        this.isMissing(component.imageType) && this.isMissing(component.image) ? 'imageType' : null,
        this.isMissing(component.monthlyHours) ? 'monthlyHours' : null
      ].filter((field): field is string => Boolean(field));
    }

    if (component.type === 'database') {
      return [
        this.isMissing(component.engine) ? 'engine' : null,
        this.isMissing(component.managed) ? 'managed' : null,
        this.isMissing(component.vcpu) ? 'vcpu' : null,
        this.isMissing(component.memoryGb) ? 'memoryGb' : null,
        this.isMissing(component.storageGb) ? 'storageGb' : null,
        this.isMissing(component.storageType) ? 'storageType' : null,
        this.isMissing(component.highAvailability) ? 'highAvailability' : null
      ].filter((field): field is string => Boolean(field));
    }

    if (component.type === 'cache') {
      return [
        this.isMissing(component.engine) ? 'engine' : null,
        this.isMissing(component.memoryGb) ? 'memoryGb' : null,
        this.isMissing(component.tier) ? 'tier' : null
      ].filter((field): field is string => Boolean(field));
    }

    if (component.type === 'cdn') {
      return [this.isMissing(component.monthlyTransferGb) && this.isMissing(component.dataTransferGb) ? 'monthlyTransferGb' : null].filter(
        (field): field is string => Boolean(field)
      );
    }

    if (component.type === 'load_balancer') {
      return [
        this.isMissing(component.target) && this.isMissing(component.targets) ? 'target' : null,
        this.isMissing(component.scheme) ? 'scheme' : null
      ].filter((field): field is string => Boolean(field));
    }

    if (component.type === 'kubernetes') {
      return [
        this.isMissing(component.nodeCount) ? 'nodeCount' : null,
        this.isMissing(component.vcpuPerNode) ? 'vcpuPerNode' : null,
        this.isMissing(component.memoryGbPerNode) ? 'memoryGbPerNode' : null,
        this.isMissing(component.operatingSystem) ? 'operatingSystem' : null,
        this.isMissing(component.imageType) ? 'imageType' : null,
        this.isMissing(component.monthlyHours) ? 'monthlyHours' : null
      ].filter((field): field is string => Boolean(field));
    }

    return component.missingFields ?? [];
  }

  private pricingStatus(type: NormalizedComponentType, missingFields: string[]): PricingStatus {
    if (type === 'compute') {
      return missingFields.length === 0 ? 'supported' : 'missing_required_fields';
    }

    if (missingFields.length > 0) {
      return 'missing_required_fields';
    }

    if (type === 'unknown') {
      return 'unsupported';
    }

    return 'not_implemented';
  }

  private isMissing(value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }
}
