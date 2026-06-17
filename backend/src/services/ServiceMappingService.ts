import { CloudCatalogDatabase, type ProviderServiceHints } from '../database/CloudCatalogDatabase.js';
import type { NormalizedComponent, NormalizedComponentType, NormalizedInfrastructureRequirement } from '../types/estimate.types.js';

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

    if (component.type === 'database' && 'engine' in component && component.engine === 'postgresql') {
      return {
        azure: 'Azure Database for PostgreSQL Flexible Server',
        aws: 'Amazon RDS for PostgreSQL',
        gcp: 'Cloud SQL for PostgreSQL'
      };
    }

    if (component.type === 'cache' && 'engine' in component && component.engine === 'redis') {
      return {
        azure: 'Azure Cache for Redis',
        aws: 'Amazon ElastiCache for Redis',
        gcp: 'Memorystore for Redis'
      };
    }

    if (component.type === 'load_balancer' && 'scheme' in component) {
      if (component.scheme === 'http_s') {
        return {
          azure: 'Azure Application Gateway',
          aws: 'Application Load Balancer',
          gcp: 'External Application Load Balancer'
        };
      }

      if (component.scheme === 'tcp') {
        return {
          azure: 'Azure Load Balancer',
          aws: 'Network Load Balancer',
          gcp: 'Network Load Balancer'
        };
      }
    }

    const hints: Record<NormalizedComponentType, ProviderServiceHint> = {
      compute: {
        azure: 'Virtual Machines',
        aws: 'EC2',
        gcp: 'Compute Engine'
      },
      database: {
        azure: 'Azure SQL Database / Azure Database',
        aws: 'Amazon RDS',
        gcp: 'Cloud SQL'
      },
      cache: {
        azure: 'Azure Cache for Redis',
        aws: 'Amazon ElastiCache',
        gcp: 'Memorystore'
      },
      storage: {
        azure: 'Azure Storage',
        aws: 'Amazon S3 / EBS / EFS',
        gcp: 'Cloud Storage / Persistent Disk / Filestore'
      },
      object_storage: {
        azure: 'Azure Blob Storage',
        aws: 'Amazon S3',
        gcp: 'Cloud Storage'
      },
      block_storage: {
        azure: 'Azure Managed Disks',
        aws: 'Amazon EBS',
        gcp: 'Persistent Disk'
      },
      file_storage: {
        azure: 'Azure Files',
        aws: 'Amazon EFS',
        gcp: 'Filestore'
      },
      cdn: {
        azure: 'Azure CDN',
        aws: 'Amazon CloudFront',
        gcp: 'Cloud CDN'
      },
      load_balancer: {
        azure: 'Azure Load Balancer / Application Gateway',
        aws: 'Elastic Load Balancing',
        gcp: 'Cloud Load Balancing'
      },
      kubernetes: {
        azure: 'Azure Kubernetes Service (AKS)',
        aws: 'Amazon EKS',
        gcp: 'Google Kubernetes Engine'
      },
      serverless: {
        azure: 'Azure Functions',
        aws: 'AWS Lambda',
        gcp: 'Cloud Functions / Cloud Run'
      },
      queue: {
        azure: 'Azure Service Bus',
        aws: 'Amazon SQS',
        gcp: 'Pub/Sub'
      },
      monitoring: {
        azure: 'Azure Monitor / Log Analytics',
        aws: 'Amazon CloudWatch',
        gcp: 'Cloud Monitoring'
      },
      backup: {
        azure: 'Azure Backup',
        aws: 'AWS Backup',
        gcp: 'Backup and DR Service'
      },
      security: {
        azure: 'Microsoft Defender for Cloud',
        aws: 'AWS Security Hub',
        gcp: 'Security Command Center'
      },
      network: {
        azure: 'Azure Bandwidth / Virtual Network',
        aws: 'Data Transfer / VPC',
        gcp: 'Network Data Transfer / VPC'
      },
      unknown: {
        azure: null,
        aws: null,
        gcp: null
      }
    };

    return hints[component.type];
  }

  private catalogProviderServiceHint(component: NormalizedComponent): ProviderServiceHints | null {
    try {
      return this.catalog.providerHintsForServiceKey(this.serviceKeyForComponent(component));
    } catch {
      return null;
    }
  }

  private serviceKeyForComponent(component: NormalizedComponent): string {
    if (component.type === 'database' && 'engine' in component && component.engine === 'postgresql') {
      return 'database.postgresql';
    }

    if (component.type === 'cache' && 'engine' in component && component.engine === 'redis') {
      return 'cache.redis';
    }

    if (component.type === 'load_balancer' && 'scheme' in component) {
      if (component.scheme === 'http_s') {
        return 'load_balancer.http_s';
      }
      if (component.scheme === 'tcp') {
        return 'load_balancer.tcp';
      }
      return 'load_balancer.generic';
    }

    if (component.type === 'network') {
      return 'network.egress';
    }

    return component.type;
  }

  private defaultName(component: NormalizedComponent): string {
    return component.type.replace(/_/g, ' ');
  }

  private normalizeRegion(requirement: NormalizedInfrastructureRequirement): NormalizedInfrastructureRequirement['region'] {
    const raw = `${requirement.region.raw ?? ''} ${requirement.region.normalized ?? ''}`.toLowerCase();
    if (/\b(us east|east us|us-east-1|eastus)\b/.test(raw)) {
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
