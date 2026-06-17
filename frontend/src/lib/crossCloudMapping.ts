import type { Confidence, NormalizedComponent, NormalizedComponentType, NormalizedInfrastructureRequirement, Provider } from '../types/estimate';

export type MappingStatus = 'mapped' | 'needs_review' | 'missing';
export type CostImpact = 'low' | 'medium' | 'high';

export interface PricingQuestion {
  key: string;
  label: string;
  impact: CostImpact;
  required: boolean;
  help: string;
}

export interface ServiceQuestionCatalogEntry {
  type: NormalizedComponentType;
  label: string;
  commonQuestions: PricingQuestion[];
}

export interface ProviderMappedValue {
  value: string;
  confidence: Confidence;
  status: MappingStatus;
  reason: string;
}

export interface CrossCloudMappingRow {
  componentId: string;
  serviceName: string;
  serviceType: NormalizedComponentType;
  fieldKey: string;
  question: string;
  impact: CostImpact;
  baseValue: string;
  commonValue: string;
  providerValues: Record<Provider, ProviderMappedValue>;
}

export interface CrossCloudMappingSummary {
  baseProvider: Provider;
  rows: CrossCloudMappingRow[];
  automaticCount: number;
  needsReviewCount: number;
  missingCount: number;
  highImpactCount: number;
}

const providerLabels: Record<Provider, string> = {
  azure: 'Azure',
  aws: 'AWS',
  gcp: 'GCP'
};

export const serviceQuestionCatalog: Partial<Record<NormalizedComponentType, ServiceQuestionCatalogEntry>> = {
  compute: {
    type: 'compute',
    label: 'Virtual machine',
    commonQuestions: [
      question('quantity', 'How many servers?', 'high', true, 'Server count multiplies compute cost.'),
      question('vcpu', 'How many vCPU per server?', 'high', true, 'vCPU drives VM or instance size.'),
      question('memoryGb', 'How much memory per server?', 'high', true, 'Memory drives VM or instance size.'),
      question('operatingSystem', 'Which operating system?', 'medium', true, 'Windows and Linux can have different pricing.'),
      question('monthlyHours', 'How many hours per month?', 'high', true, 'Full month is usually 730 hours.')
    ]
  },
  kubernetes: {
    type: 'kubernetes',
    label: 'Kubernetes',
    commonQuestions: [
      question('nodeCount', 'How many worker nodes?', 'high', true, 'Node count multiplies worker compute cost.'),
      question('vcpuPerNode', 'How many vCPU per node?', 'high', true, 'Node vCPU maps to instance size.'),
      question('memoryGbPerNode', 'How much memory per node?', 'high', true, 'Node memory maps to instance size.'),
      question('operatingSystem', 'Which node operating system?', 'medium', true, 'Linux is the normal baseline for managed Kubernetes.'),
      question('monthlyHours', 'How many hours per month?', 'high', false, 'Full month is usually 730 hours.')
    ]
  },
  database: {
    type: 'database',
    label: 'Database',
    commonQuestions: [
      question('engine', 'Which database engine?', 'high', true, 'Engine decides the managed database service and SKU family.'),
      question('vcpu', 'How many database vCPU?', 'high', true, 'Database vCPU drives compute cost.'),
      question('memoryGb', 'How much database memory?', 'medium', false, 'Memory helps select the closest provider SKU.'),
      question('storageGb', 'How much database storage?', 'high', true, 'Storage size is billed separately for most managed databases.'),
      question('storageType', 'Which storage type?', 'medium', true, 'SSD, HDD, and premium tiers have different pricing.'),
      question('highAvailability', 'Should database be highly available?', 'high', true, 'HA usually doubles or increases compute and storage cost.')
    ]
  },
  cache: {
    type: 'cache',
    label: 'Cache',
    commonQuestions: [
      question('engine', 'Which cache engine?', 'medium', true, 'Redis and Memcached map to different services.'),
      question('memoryGb', 'How much cache memory?', 'high', true, 'Cache memory is the main cost driver.'),
      question('tier', 'Is it dev/basic or production?', 'high', true, 'Production tiers add SLA, replicas, or clustering.'),
      question('highAvailability', 'Should cache be highly available?', 'medium', false, 'HA can add replica and zone cost.')
    ]
  },
  object_storage: {
    type: 'object_storage',
    label: 'Object storage',
    commonQuestions: [
      question('dataStoredGb', 'How much data is stored?', 'high', true, 'Stored GB is the main object storage cost.'),
      question('accessTier', 'How often is data accessed?', 'medium', true, 'Hot, cool, and archive classes price storage and reads differently.'),
      question('redundancy', 'What resilience level is needed?', 'medium', true, 'Zone or geo redundancy costs more than local storage.')
    ]
  },
  cdn: {
    type: 'cdn',
    label: 'CDN',
    commonQuestions: [
      question('dataTransferGb', 'How much data transfer?', 'high', true, 'Transfer volume is usually the main CDN cost.'),
      question('requestCount', 'How many monthly requests?', 'medium', false, 'Requests can add cost for CDN and edge services.')
    ]
  },
  load_balancer: {
    type: 'load_balancer',
    label: 'Load balancer',
    commonQuestions: [
      question('scheme', 'Is it HTTP/S or TCP?', 'high', true, 'Layer 7 and network load balancers map to different products.'),
      question('target', 'What service receives traffic?', 'low', false, 'Target helps select ingress, app gateway, or network balancer.')
    ]
  },
  queue: {
    type: 'queue',
    label: 'Queue',
    commonQuestions: [
      question('messageVolume', 'How many messages per month?', 'high', true, 'Message volume is the main queue cost.'),
      question('tier', 'Which message tier?', 'medium', true, 'Standard and premium tiers have different billing models.')
    ]
  },
  monitoring: {
    type: 'monitoring',
    label: 'Monitoring',
    commonQuestions: [
      question('logIngestionGb', 'How many GB logs per month?', 'high', true, 'Log ingestion is usually the main observability cost.'),
      question('retentionDays', 'How many retention days?', 'medium', false, 'Longer retention can add storage cost.')
    ]
  },
  network: {
    type: 'network',
    label: 'Network',
    commonQuestions: [
      question('monthlyEgressGb', 'How much internet egress?', 'high', true, 'Outbound traffic can materially affect total cost.'),
      question('monthlyDataProcessedGb', 'How much data is processed?', 'high', false, 'Gateways and firewalls often bill processed GB.')
    ]
  },
  backup: {
    type: 'backup',
    label: 'Backup',
    commonQuestions: [
      question('protectedDataGb', 'How much data is protected?', 'high', true, 'Protected GB is the main backup cost.'),
      question('retentionDays', 'How many retention days?', 'medium', true, 'Retention changes stored backup volume.')
    ]
  },
  block_storage: {
    type: 'block_storage',
    label: 'Disk storage',
    commonQuestions: [
      question('diskCount', 'How many disks?', 'high', true, 'Disk count multiplies disk cost.'),
      question('diskSizeGb', 'How large is each disk?', 'high', true, 'Disk size is a main cost driver.'),
      question('diskTier', 'Which disk tier?', 'high', true, 'Premium SSD, standard SSD, and HDD have different prices.')
    ]
  },
  serverless: {
    type: 'serverless',
    label: 'Serverless',
    commonQuestions: [
      question('requestCount', 'How many requests?', 'high', true, 'Requests drive serverless cost.'),
      question('vcpuSeconds', 'How many vCPU seconds?', 'high', false, 'CPU seconds are needed for container-style serverless pricing.'),
      question('memoryGbSeconds', 'How many memory GB seconds?', 'high', false, 'Memory duration is a main serverless cost driver.')
    ]
  }
};

export function buildCrossCloudMappingSummary(requirements: NormalizedInfrastructureRequirement, baseProvider: Provider): CrossCloudMappingSummary {
  const rows = requirements.components
    .filter((component) => !component.optionalAddon)
    .flatMap((component) => buildComponentMappingRows(component, baseProvider));

  return {
    baseProvider,
    rows,
    automaticCount: rows.filter((row) => allProviderStatuses(row, 'mapped')).length,
    needsReviewCount: rows.filter((row) => Object.values(row.providerValues).some((value) => value.status === 'needs_review')).length,
    missingCount: rows.filter((row) => Object.values(row.providerValues).some((value) => value.status === 'missing')).length,
    highImpactCount: rows.filter((row) => row.impact === 'high').length
  };
}

export function withCrossCloudMappingAssumption(
  requirements: NormalizedInfrastructureRequirement,
  baseProvider: Provider,
  targetProvider: Provider
): NormalizedInfrastructureRequirement {
  const summary = buildCrossCloudMappingSummary(requirements, baseProvider);
  const assumption = `Base cloud: ${providerLabels[baseProvider]}. Values are mapped automatically to ${providerLabels[targetProvider]} using the common pricing model. Review low-confidence or missing fields before a final client quote.`;

  return {
    ...requirements,
    globalAssumptions: [...requirements.globalAssumptions.filter((item) => !item.startsWith('Base cloud: ')), assumption],
    components: requirements.components.map((component) => ({
      ...component,
      mappingSummary: {
        baseProvider,
        targetProvider,
        automaticCount: summary.automaticCount,
        needsReviewCount: summary.needsReviewCount,
        missingCount: summary.missingCount
      }
    }))
  };
}

function buildComponentMappingRows(component: NormalizedComponent, baseProvider: Provider): CrossCloudMappingRow[] {
  const catalogEntry = serviceQuestionCatalog[component.type];
  if (!catalogEntry) {
    return [serviceMatchRow(component, baseProvider)];
  }

  return [
    serviceMatchRow(component, baseProvider),
    ...catalogEntry.commonQuestions
      .filter((field) => field.required || hasComponentValue(component, field.key) || component.missingFields.includes(field.key))
      .map((field) => fieldMappingRow(component, field, baseProvider))
  ];
}

function serviceMatchRow(component: NormalizedComponent, baseProvider: Provider): CrossCloudMappingRow {
  const providers: Provider[] = ['azure', 'aws', 'gcp'];
  const providerValues = Object.fromEntries(
    providers.map((provider) => {
      const value = component.providerServiceHint[provider] ?? 'No direct service selected';
      return [
        provider,
        {
          value,
          confidence: component.providerServiceHint[provider] ? component.confidence : 'low',
          status: component.providerServiceHint[provider] ? 'mapped' : 'needs_review',
          reason: component.providerServiceHint[provider]
            ? `${providerLabels[provider]} service matched from the service catalog.`
            : `${providerLabels[provider]} service needs manual selection.`
        } satisfies ProviderMappedValue
      ];
    })
  ) as Record<Provider, ProviderMappedValue>;

  return {
    componentId: component.id,
    serviceName: component.name,
    serviceType: component.type,
    fieldKey: 'providerService',
    question: 'Equivalent service',
    impact: 'high',
    baseValue: providerValues[baseProvider].value,
    commonValue: component.type.replace(/_/g, ' '),
    providerValues
  };
}

function fieldMappingRow(component: NormalizedComponent, field: PricingQuestion, baseProvider: Provider): CrossCloudMappingRow {
  const providers: Provider[] = ['azure', 'aws', 'gcp'];
  const rawValue = getComponentValue(component, field.key);
  const commonValue = formatCommonValue(field.key, rawValue, component);
  const hasValue = commonValue !== 'Not provided';
  const baseValue = hasValue ? providerDisplayValue(field.key, rawValue, baseProvider, component) : 'Not provided';
  const providerValues = Object.fromEntries(
    providers.map((provider) => [
      provider,
      {
        value: hasValue ? providerDisplayValue(field.key, rawValue, provider, component) : 'Need input',
        confidence: mappingConfidence(field.key, rawValue, component, field),
        status: hasValue ? fieldStatus(field, rawValue, component, provider, baseProvider) : 'missing',
        reason: mappingReason(field, rawValue, provider, baseProvider, hasValue)
      } satisfies ProviderMappedValue
    ])
  ) as Record<Provider, ProviderMappedValue>;

  return {
    componentId: component.id,
    serviceName: component.name,
    serviceType: component.type,
    fieldKey: field.key,
    question: field.label,
    impact: field.impact,
    baseValue,
    commonValue,
    providerValues
  };
}

function fieldStatus(field: PricingQuestion, rawValue: unknown, component: NormalizedComponent, provider: Provider, baseProvider: Provider): MappingStatus {
  if (!hasFieldValue(rawValue)) {
    return 'missing';
  }

  if (field.impact === 'high' && provider !== baseProvider && ['providerService', 'highAvailability', 'scheme', 'tier'].includes(field.key)) {
    return 'needs_review';
  }

  if (component.missingFields.includes(field.key)) {
    return 'missing';
  }

  return 'mapped';
}

function mappingConfidence(fieldKey: string, rawValue: unknown, component: NormalizedComponent, field: PricingQuestion): Confidence {
  if (!hasFieldValue(rawValue) || component.missingFields.includes(fieldKey)) {
    return 'low';
  }
  if (field.impact === 'high' && ['providerService', 'highAvailability', 'scheme', 'tier'].includes(fieldKey)) {
    return 'medium';
  }
  return component.confidence;
}

function mappingReason(field: PricingQuestion, rawValue: unknown, provider: Provider, baseProvider: Provider, hasValue: boolean): string {
  if (!hasValue) {
    return `${field.label} is required before ${providerLabels[provider]} can be estimated with confidence.`;
  }

  if (field.impact === 'high' && provider !== baseProvider && ['highAvailability', 'scheme', 'tier'].includes(field.key)) {
    return `${providerLabels[provider]} has provider-specific behavior. Confirm before final quote.`;
  }

  return `${field.label} was converted through the common pricing model.`;
}

function providerDisplayValue(fieldKey: string, rawValue: unknown, provider: Provider, component: NormalizedComponent): string {
  if (!hasFieldValue(rawValue)) {
    return 'Need input';
  }

  if (fieldKey === 'storageType') {
    const value = String(rawValue).toLowerCase();
    if (value.includes('ssd')) {
      return {
        azure: 'Premium/Standard SSD',
        aws: 'gp3 SSD',
        gcp: 'SSD persistent disk'
      }[provider];
    }
    return {
      azure: 'Standard HDD',
      aws: 'Magnetic/HDD',
      gcp: 'Standard persistent disk'
    }[provider];
  }

  if (fieldKey === 'highAvailability') {
    if (rawValue === true) {
      return {
        azure: 'Zone redundant / HA',
        aws: 'Multi-AZ',
        gcp: 'Regional availability'
      }[provider];
    }
    return {
      azure: 'Single zone',
      aws: 'Single-AZ',
      gcp: 'Zonal availability'
    }[provider];
  }

  if (fieldKey === 'tier') {
    const value = String(rawValue).toLowerCase();
    if (component.type === 'cache') {
      if (value.includes('prod') || value.includes('premium') || value.includes('standard')) {
        return {
          azure: 'Production tier',
          aws: 'Replication group',
          gcp: 'Standard tier'
        }[provider];
      }
      return {
        azure: 'Basic/dev tier',
        aws: 'Single node',
        gcp: 'Basic tier'
      }[provider];
    }
  }

  if (fieldKey === 'scheme') {
    const value = String(rawValue);
    if (value === 'http_s') {
      return {
        azure: 'Application Gateway / Front Door',
        aws: 'Application Load Balancer',
        gcp: 'External HTTP(S) Load Balancer'
      }[provider];
    }
    return {
      azure: 'Azure Load Balancer',
      aws: 'Network Load Balancer',
      gcp: 'TCP/UDP Load Balancer'
    }[provider];
  }

  if (fieldKey === 'accessTier') {
    const value = String(rawValue).toLowerCase();
    if (value.includes('hot') || value.includes('standard')) {
      return {
        azure: 'Hot tier',
        aws: 'S3 Standard',
        gcp: 'Standard storage'
      }[provider];
    }
    if (value.includes('archive')) {
      return {
        azure: 'Archive tier',
        aws: 'S3 Glacier',
        gcp: 'Archive storage'
      }[provider];
    }
    return {
      azure: 'Cool tier',
      aws: 'S3 Infrequent Access',
      gcp: 'Nearline storage'
    }[provider];
  }

  if (fieldKey === 'redundancy') {
    const value = String(rawValue).toUpperCase();
    if (value.includes('GRS') || value.includes('GEO')) {
      return {
        azure: 'GRS',
        aws: 'Cross-region replication',
        gcp: 'Dual-region / multi-region'
      }[provider];
    }
    if (value.includes('ZRS') || value.includes('ZONE')) {
      return {
        azure: 'ZRS',
        aws: 'Multi-AZ',
        gcp: 'Regional storage'
      }[provider];
    }
    return {
      azure: 'LRS',
      aws: 'Single-region standard',
      gcp: 'Regional standard'
    }[provider];
  }

  return formatCommonValue(fieldKey, rawValue, component);
}

function formatCommonValue(fieldKey: string, rawValue: unknown, component: NormalizedComponent): string {
  if (!hasFieldValue(rawValue)) {
    return 'Not provided';
  }

  if (typeof rawValue === 'boolean') {
    return rawValue ? 'Yes' : 'No';
  }

  if (typeof rawValue === 'number') {
    if (fieldKey.toLowerCase().includes('gb')) {
      return `${rawValue.toLocaleString()} GB`;
    }
    if (fieldKey.toLowerCase().includes('hours')) {
      return `${rawValue.toLocaleString()} hours/mo`;
    }
    if (fieldKey.toLowerCase().includes('count') || fieldKey.toLowerCase().includes('volume') || fieldKey.toLowerCase().includes('request')) {
      return rawValue.toLocaleString();
    }
  }

  if (fieldKey === 'scheme' && rawValue === 'http_s') {
    return 'HTTP/S';
  }

  if (fieldKey === 'providerService') {
    return component.providerServiceHint.azure ?? component.name;
  }

  return String(rawValue);
}

function getComponentValue(component: NormalizedComponent, key: string): unknown {
  if (key === 'dataTransferGb') {
    return component.dataTransferGb ?? component.monthlyTransferGb;
  }
  return component[key];
}

function hasComponentValue(component: NormalizedComponent, key: string): boolean {
  return hasFieldValue(getComponentValue(component, key));
}

function hasFieldValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

function allProviderStatuses(row: CrossCloudMappingRow, status: MappingStatus): boolean {
  return Object.values(row.providerValues).every((value) => value.status === status);
}

function question(key: string, label: string, impact: CostImpact, required: boolean, help: string): PricingQuestion {
  return { key, label, impact, required, help };
}
