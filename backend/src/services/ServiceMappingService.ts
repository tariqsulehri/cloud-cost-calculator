import { CloudCatalogDatabase, type ProviderServiceHints } from '../database/CloudCatalogDatabase.js';
import { mappedServiceKeyForComponent, providerHintsForComponent } from '../mappings/cloudServiceMap.js';
import type { NormalizedComponent, NormalizedInfrastructureRequirement } from '../types/estimate.types.js';

type ProviderServiceHint = NormalizedComponent['providerServiceHint'];

export class ServiceMappingService {
  constructor(private readonly catalog = new CloudCatalogDatabase()) {}

  mapRequirement(requirement: NormalizedInfrastructureRequirement): NormalizedInfrastructureRequirement {
    const components = requirement.components.map((component) => this.mapComponent(component));
    return {
      ...requirement,
      region: this.normalizeRegion(requirement),
      components,
      globalAssumptions: [
        ...new Set([
          ...requirement.globalAssumptions,
          'Backend service mapping is authoritative; OpenAI extracts requirements only and does not calculate prices.'
        ])
      ]
    };
  }

  private mapComponent(component: NormalizedComponent): NormalizedComponent {
    const normalizedComponent = this.normalizeComponentValues(component);
    return {
      ...normalizedComponent,
      name: normalizedComponent.name || this.defaultName(normalizedComponent),
      providerServiceHint: this.providerServiceHint(normalizedComponent)
    } as NormalizedComponent;
  }

  private providerServiceHint(component: NormalizedComponent): ProviderServiceHint {
    const catalogHints = this.catalogProviderServiceHint(component);
    if (catalogHints) {
      return catalogHints;
    }

    return providerHintsForComponent(component);
  }

  private catalogProviderServiceHint(component: NormalizedComponent): ProviderServiceHints | null {
    try {
      return this.catalog.providerHintsForServiceKey(this.serviceKeyForComponent(component));
    } catch {
      return null;
    }
  }

  private serviceKeyForComponent(component: NormalizedComponent): string {
    return mappedServiceKeyForComponent(component);
  }

  private defaultName(component: NormalizedComponent): string {
    return component.type.replace(/_/g, ' ');
  }

  private normalizeRegion(requirement: NormalizedInfrastructureRequirement): NormalizedInfrastructureRequirement['region'] {
    const raw = `${requirement.region.raw ?? ''} ${requirement.region.normalized ?? ''}`.toLowerCase();
    const normalized = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (
      /\b(us east|east us|us east 1|us east1)\b/.test(normalized) ||
      /(^|[^a-z0-9])(eastus|useast)([^a-z0-9]|$)/.test(raw)
    ) {
      return {
        raw: requirement.region.raw,
        normalized: 'eastus',
        providerRegion: {
          azure: 'eastus',
          aws: 'us-east-1',
          gcp: 'us-east1'
        },
        confidence: requirement.region.confidence
      };
    }

    return requirement.region;
  }

  private normalizeComponentValues(component: NormalizedComponent): NormalizedComponent {
    if (component.type === 'compute') {
      const osText = `${component.os ?? ''} ${component.operatingSystem ?? ''}`.toLowerCase();
      const imageText = `${component.image ?? ''} ${component.imageType ?? ''} ${component.os ?? ''}`.toLowerCase();
      return {
        ...component,
        operatingSystem: osText.includes('linux') ? 'linux' : component.operatingSystem,
        imageType: imageText.includes('ubuntu') ? 'ubuntu' : component.imageType,
        monthlyHours: component.monthlyHours ?? 730
      };
    }

    if (component.type === 'database') {
      return {
        ...component,
        engine: typeof component.engine === 'string' && component.engine.toLowerCase().includes('postgres') ? 'postgresql' : component.engine,
        storageType: typeof component.storageType === 'string' && component.storageType.toLowerCase() === 'ssd' ? 'ssd' : component.storageType
      };
    }

    if (component.type === 'cache') {
      return {
        ...component,
        engine: typeof component.engine === 'string' && component.engine.toLowerCase().includes('redis') ? 'redis' : component.engine
      };
    }

    if (component.type === 'cdn') {
      return {
        ...component,
        dataTransferGb: component.dataTransferGb ?? component.monthlyTransferGb ?? null
      };
    }

    if (component.type === 'load_balancer') {
      return {
        ...component,
        target: component.target ?? component.targets ?? null
      };
    }

    return component;
  }
}
