import { roundMoney } from '../utils/money.js';
import type {
  EstimateLineItem,
  GenericComponent,
  NormalizedComponent,
  NormalizedComponentType,
  NormalizedEstimateRequest,
  NormalizedEstimateResponse,
  NotImplementedLineItem,
  Provider,
  UnpricedLineItem
} from '../types/estimate.types.js';

type PreliminaryProvider = Exclude<Provider, 'azure'>;

interface ProviderRateCard {
  providerLabel: string;
  compute: {
    smallSku: string;
    mediumSku: string;
    largeSku: string;
    vcpuHour: number;
    memoryGbHour: number;
  };
  database: {
    serviceName: string;
    computeSku: string;
    vcpuHour: number;
    storageGbMonth: number;
  };
  cache: {
    serviceName: string;
    skuName: string;
    gbHour: number;
  };
  objectStorageGbMonth: number;
  networkEgressGb: number;
  cdnTransferGb: number;
  loadBalancerHour: number;
  queueMillionMessages: number;
  logIngestionGb: number;
}

const rateCards: Record<PreliminaryProvider, ProviderRateCard> = {
  aws: {
    providerLabel: 'AWS',
    compute: {
      smallSku: 't3.medium planning size',
      mediumSku: 'm7i.xlarge planning size',
      largeSku: 'm7i.2xlarge planning size',
      vcpuHour: 0.045,
      memoryGbHour: 0.005
    },
    database: {
      serviceName: 'Amazon RDS for PostgreSQL',
      computeSku: 'RDS PostgreSQL general purpose planning size',
      vcpuHour: 0.085,
      storageGbMonth: 0.115
    },
    cache: {
      serviceName: 'Amazon ElastiCache for Redis',
      skuName: 'Redis planning node',
      gbHour: 0.018
    },
    objectStorageGbMonth: 0.023,
    networkEgressGb: 0.09,
    cdnTransferGb: 0.085,
    loadBalancerHour: 0.031,
    queueMillionMessages: 0.4,
    logIngestionGb: 0.5
  },
  gcp: {
    providerLabel: 'GCP',
    compute: {
      smallSku: 'e2-medium planning size',
      mediumSku: 'n2-standard-4 planning size',
      largeSku: 'n2-standard-8 planning size',
      vcpuHour: 0.04,
      memoryGbHour: 0.0055
    },
    database: {
      serviceName: 'Cloud SQL for PostgreSQL',
      computeSku: 'Cloud SQL PostgreSQL general purpose planning size',
      vcpuHour: 0.082,
      storageGbMonth: 0.17
    },
    cache: {
      serviceName: 'Memorystore for Redis',
      skuName: 'Redis planning instance',
      gbHour: 0.049
    },
    objectStorageGbMonth: 0.02,
    networkEgressGb: 0.12,
    cdnTransferGb: 0.08,
    loadBalancerHour: 0.025,
    queueMillionMessages: 0.4,
    logIngestionGb: 0.5
  }
};

export class PreliminaryCloudPricingService {
  estimateNormalized(request: NormalizedEstimateRequest): NormalizedEstimateResponse {
    const provider = request.provider as PreliminaryProvider;
    const rateCard = rateCards[provider];
    const region = request.requirements.region.providerRegion[provider];
    const calculatedLineItems: EstimateLineItem[] = [];
    const notImplementedLineItems: NotImplementedLineItem[] = [];
    const unsupportedLineItems: UnpricedLineItem[] = [];
    const missingRequiredFieldLineItems: UnpricedLineItem[] = [];
    const pricedComponentIds = new Set<string>();
    const assumptions = [
      ...request.requirements.globalAssumptions,
      `${rateCard.providerLabel} uses an early proposal rate card. It is not connected to live provider pricing APIs yet.`,
      'Use these numbers for early comparison only. Validate with the cloud calculator or contract pricing before sending a final client quote.'
    ];

    for (const component of request.requirements.components) {
      if (component.pricingStatus === 'unsupported' || component.pricingStatus === 'needs_review') {
        unsupportedLineItems.push(this.toUnpricedLineItem(provider, component, 'Detected service needs review before early proposal pricing.'));
        continue;
      }

      if (component.type === 'compute') {
        const vcpu = component.vcpu;
        const memoryGb = component.memoryGb;
        if (!vcpu || !memoryGb || component.pricingStatus === 'missing_required_fields') {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing compute vCPU or memory for early proposal pricing.'));
          continue;
        }

        const quantity = component.quantity ?? 1;
        const hours = component.monthlyHours ?? 730;
        const unitPrice = this.computeHourlyRate(rateCard, vcpu, memoryGb);
        const skuName = this.computeSku(rateCard, vcpu);
        calculatedLineItems.push(
          this.lineItem({
            category: 'Compute',
            serviceName: this.serviceName(provider, component, provider === 'aws' ? 'Amazon EC2' : 'Compute Engine'),
            skuName,
            meterName: 'Early proposal instance hour',
            quantity,
            hours,
            unit: '1 Hour',
            unitPrice,
            monthlyCost: roundMoney(unitPrice * quantity * hours),
            assumption: `${rateCard.providerLabel} compute uses an early proposal rate card based on requested vCPU and memory. Calculation is ${quantity} instance(s) x ${hours} hour(s) x planning hourly rate.`
          })
        );
        pricedComponentIds.add(component.id);
      } else if (component.type === 'kubernetes') {
        const nodeCount = this.numberValue(component, 'nodeCount');
        const vcpuPerNode = this.numberValue(component, 'vcpuPerNode');
        const memoryGbPerNode = this.numberValue(component, 'memoryGbPerNode');
        if (!nodeCount || !vcpuPerNode || !memoryGbPerNode) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing worker node count, vCPU, or memory for early Kubernetes pricing.'));
          continue;
        }

        const hours = this.numberValue(component, 'monthlyHours') ?? 730;
        const unitPrice = this.computeHourlyRate(rateCard, vcpuPerNode, memoryGbPerNode);
        calculatedLineItems.push(
          this.lineItem({
            category: 'Compute',
            serviceName: this.serviceName(provider, component, provider === 'aws' ? 'Amazon EKS worker nodes' : 'GKE worker nodes'),
            skuName: this.computeSku(rateCard, vcpuPerNode),
            meterName: 'Early proposal worker node hour',
            quantity: nodeCount,
            hours,
            unit: '1 Hour',
            unitPrice,
            monthlyCost: roundMoney(unitPrice * nodeCount * hours),
            assumption: `${rateCard.providerLabel} Kubernetes estimate prices worker node compute only. Control plane fees, disks, ingress, NAT, logging, and add-ons are excluded unless separately detected.`
          })
        );
        pricedComponentIds.add(component.id);
      } else if (component.type === 'database') {
        if (component.engine !== 'postgresql' || !component.vcpu || !component.storageGb || component.highAvailability === null || component.highAvailability === undefined) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing PostgreSQL engine, vCPU, storage, or high availability setting for early database pricing.'));
          continue;
        }

        const hours = this.numberValue(component as unknown as GenericComponent, 'monthlyHours') ?? 730;
        const computeQuantity = component.highAvailability ? 2 : 1;
        const computeUnitPrice = rateCard.database.vcpuHour * component.vcpu;
        calculatedLineItems.push(
          this.lineItem({
            category: 'Database',
            serviceName: this.serviceName(provider, component, rateCard.database.serviceName),
            skuName: rateCard.database.computeSku,
            meterName: 'Early proposal database compute hour',
            quantity: computeQuantity,
            hours,
            usageLabel: `${computeQuantity} server${computeQuantity > 1 ? 's' : ''} x ${hours} hours`,
            unit: '1 Hour',
            unitPrice: computeUnitPrice,
            monthlyCost: roundMoney(computeUnitPrice * computeQuantity * hours),
            assumption: `${rateCard.providerLabel} PostgreSQL compute uses a planning vCPU-hour rate. High availability doubles compute for a standby server.`
          }),
          this.lineItem({
            category: 'Database',
            serviceName: this.serviceName(provider, component, rateCard.database.serviceName),
            skuName: 'Database storage planning rate',
            meterName: 'Early proposal GB-month',
            quantity: component.storageGb,
            hours: 1,
            usageLabel: `${component.storageGb} GB-month`,
            unit: '1 GB/Month',
            unitPrice: rateCard.database.storageGbMonth,
            monthlyCost: roundMoney(rateCard.database.storageGbMonth * component.storageGb),
            assumption: `${rateCard.providerLabel} PostgreSQL storage uses a planning GB-month rate. Backup overage, IOPS, replicas, and private networking are excluded.`
          })
        );
        pricedComponentIds.add(component.id);
      } else if (component.type === 'cache') {
        if (component.engine !== 'redis' || !component.memoryGb || !component.tier) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing Redis engine, memory, or tier for early cache pricing.'));
          continue;
        }

        const hours = this.numberValue(component as unknown as GenericComponent, 'monthlyHours') ?? 730;
        const unitPrice = rateCard.cache.gbHour * component.memoryGb;
        calculatedLineItems.push(
          this.lineItem({
            category: 'Cache',
            serviceName: this.serviceName(provider, component, rateCard.cache.serviceName),
            skuName: rateCard.cache.skuName,
            meterName: 'Early proposal Redis hour',
            quantity: 1,
            hours,
            usageLabel: `1 cache x ${hours} hours`,
            unit: '1 Hour',
            unitPrice,
            monthlyCost: roundMoney(unitPrice * hours),
            assumption: `${rateCard.providerLabel} Redis uses an early proposal memory-based hourly rate. Clustering, replicas, persistence, and data transfer are excluded.`
          })
        );
        pricedComponentIds.add(component.id);
      } else if (component.type === 'object_storage') {
        const dataStoredGb = this.numberValue(component, 'dataStoredGb');
        if (!dataStoredGb) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing stored GB for early object storage pricing.'));
          continue;
        }
        calculatedLineItems.push(
          this.usageLine(provider, component, 'Storage', provider === 'aws' ? 'Amazon S3' : 'Cloud Storage', 'Standard storage planning rate', dataStoredGb, 'GB-month', rateCard.objectStorageGbMonth)
        );
        pricedComponentIds.add(component.id);
      } else if (component.type === 'network') {
        const monthlyEgressGb = this.numberValue(component, 'monthlyEgressGb');
        if (!monthlyEgressGb) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing monthly egress GB for early network pricing.'));
          continue;
        }
        calculatedLineItems.push(
          this.usageLine(provider, component, 'Networking', provider === 'aws' ? 'AWS Data Transfer' : 'Network Data Transfer', 'Internet egress planning rate', monthlyEgressGb, 'GB egress', rateCard.networkEgressGb)
        );
        pricedComponentIds.add(component.id);
      } else if (component.type === 'cdn') {
        const transferGb = this.numberValue(component, 'dataTransferGb') ?? this.numberValue(component, 'monthlyTransferGb');
        if (!transferGb) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing CDN transfer GB for early CDN pricing.'));
          continue;
        }
        calculatedLineItems.push(
          this.usageLine(provider, component, 'Networking', provider === 'aws' ? 'Amazon CloudFront' : 'Cloud CDN', 'CDN transfer planning rate', transferGb, 'GB transfer', rateCard.cdnTransferGb)
        );
        pricedComponentIds.add(component.id);
      } else if (component.type === 'load_balancer') {
        if (!component.scheme) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing load balancer scheme for early pricing.'));
          continue;
        }
        const hours = this.numberValue(component as unknown as GenericComponent, 'monthlyHours') ?? 730;
        calculatedLineItems.push(
          this.lineItem({
            category: 'Networking',
            serviceName: this.serviceName(provider, component, provider === 'aws' ? 'Elastic Load Balancing' : 'Cloud Load Balancing'),
            skuName: component.scheme === 'http_s' ? 'Application load balancer planning rate' : 'Network load balancer planning rate',
            meterName: 'Early proposal load balancer hour',
            quantity: 1,
            hours,
            unit: '1 Hour',
            unitPrice: rateCard.loadBalancerHour,
            monthlyCost: roundMoney(rateCard.loadBalancerHour * hours),
            assumption: `${rateCard.providerLabel} load balancer uses a simple hourly planning rate. Data processing units, rules, WAF, public IP, and certificates are excluded.`
          })
        );
        pricedComponentIds.add(component.id);
      } else if (component.type === 'queue') {
        const messageVolume = this.numberValue(component, 'messageVolume');
        if (!messageVolume) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing monthly message volume for early messaging pricing.'));
          continue;
        }
        const millionMessages = messageVolume / 1_000_000;
        calculatedLineItems.push(
          this.usageLine(provider, component, 'Integration', provider === 'aws' ? 'Amazon SQS' : 'Pub/Sub', 'Messaging operations planning rate', millionMessages, 'M messages', rateCard.queueMillionMessages)
        );
        pricedComponentIds.add(component.id);
      } else if (component.type === 'monitoring') {
        const logIngestionGb = this.numberValue(component, 'logIngestionGb');
        if (!logIngestionGb) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing log ingestion GB for early monitoring pricing.'));
          continue;
        }
        calculatedLineItems.push(
          this.usageLine(provider, component, 'Management', provider === 'aws' ? 'Amazon CloudWatch' : 'Cloud Logging', 'Log ingestion planning rate', logIngestionGb, 'GB ingested', rateCard.logIngestionGb)
        );
        pricedComponentIds.add(component.id);
      } else {
        notImplementedLineItems.push({
          componentId: component.id,
          type: component.type,
          serviceName: this.serviceName(provider, component, this.serviceNameFor(provider, component.type)),
          reason: `${rateCard.providerLabel} early proposal pricing is not implemented for this service type yet.`,
          assumptions: component.assumptions,
          rawText: component.rawText
        });
      }
    }

    const estimateQuality = this.estimateQuality({
      providerLabel: rateCard.providerLabel,
      totalComponentCount: request.requirements.components.length,
      pricedComponentCount: pricedComponentIds.size,
      reviewItems: [...notImplementedLineItems, ...unsupportedLineItems, ...missingRequiredFieldLineItems]
    });

    return {
      provider,
      region,
      currency: 'USD',
      totalMonthlyCost: roundMoney(calculatedLineItems.reduce((sum, item) => sum + item.monthlyCost, 0)),
      estimateQuality,
      calculatedLineItems,
      notImplementedLineItems,
      unsupportedLineItems,
      missingRequiredFieldLineItems,
      assumptions: [...new Set([...assumptions, estimateQuality.summary])],
      clarifyingQuestions: request.requirements.clarifyingQuestions
    };
  }

  private lineItem(input: Omit<EstimateLineItem, 'pricingSource' | 'confidence' | 'rawProductName' | 'rawSkuName' | 'rawMeterName' | 'rawArmRegionName'>): EstimateLineItem {
    return {
      ...input,
      pricingSource: 'early-proposal-rate-card',
      confidence: 'low',
      rawProductName: null,
      rawSkuName: null,
      rawMeterName: null,
      rawArmRegionName: null
    };
  }

  private usageLine(
    provider: PreliminaryProvider,
    component: NormalizedComponent,
    category: EstimateLineItem['category'],
    fallbackServiceName: string,
    meterName: string,
    quantity: number,
    usageUnit: string,
    unitPrice: number
  ): EstimateLineItem {
    const providerLabel = rateCards[provider].providerLabel;
    return this.lineItem({
      category,
      serviceName: this.serviceName(provider, component, fallbackServiceName),
      skuName: 'Early proposal planning rate',
      meterName,
      quantity,
      hours: 1,
      usageLabel: `${this.formatUsage(quantity)} ${usageUnit}`,
      unit: usageUnit,
      unitPrice,
      monthlyCost: roundMoney(quantity * unitPrice),
      assumption: `${providerLabel} ${fallbackServiceName} uses an early proposal usage rate. Provider-specific tiers, free allowances, operations, and discounts are excluded.`
    });
  }

  private computeHourlyRate(rateCard: ProviderRateCard, vcpu: number, memoryGb: number): number {
    return roundMoney(vcpu * rateCard.compute.vcpuHour + memoryGb * rateCard.compute.memoryGbHour);
  }

  private computeSku(rateCard: ProviderRateCard, vcpu: number): string {
    if (vcpu <= 2) {
      return rateCard.compute.smallSku;
    }
    if (vcpu <= 4) {
      return rateCard.compute.mediumSku;
    }
    return rateCard.compute.largeSku;
  }

  private numberValue(component: object, field: string): number | null {
    const value = (component as Record<string, unknown>)[field];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private formatUsage(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  private serviceName(provider: PreliminaryProvider, component: NormalizedComponent, fallback: string): string {
    return component.providerServiceHint?.[provider] || component.name || fallback;
  }

  private toUnpricedLineItem(provider: PreliminaryProvider, component: NormalizedComponent, reason: string): UnpricedLineItem {
    return {
      componentId: component.id,
      type: component.type,
      serviceName: this.serviceName(provider, component, this.serviceNameFor(provider, component.type)),
      reason,
      assumptions: component.assumptions,
      rawText: component.rawText
    };
  }

  private estimateQuality({
    providerLabel,
    totalComponentCount,
    pricedComponentCount,
    reviewItems
  }: {
    providerLabel: string;
    totalComponentCount: number;
    pricedComponentCount: number;
    reviewItems: Array<{ serviceName: string; reason: string }>;
  }): NormalizedEstimateResponse['estimateQuality'] {
    const coveragePercent = totalComponentCount === 0 ? 0 : Math.round((pricedComponentCount / totalComponentCount) * 100);
    const blockers = reviewItems.map((item) => `${item.serviceName}: ${item.reason}`);
    const status = totalComponentCount === 0 || pricedComponentCount === 0 ? 'blocked' : blockers.length > 0 ? 'partial' : 'complete';
    const summary =
      status === 'complete'
        ? `${providerLabel} early proposal estimate complete: ${pricedComponentCount}/${totalComponentCount} detected services are priced with planning rates.`
        : status === 'partial'
          ? `${providerLabel} partial early proposal estimate: ${pricedComponentCount}/${totalComponentCount} detected services are priced. Unpriced services are excluded from the total.`
          : `${providerLabel} estimate blocked: ${pricedComponentCount}/${totalComponentCount} detected services are priced. Complete missing fields before using the total.`;

    return {
      status,
      coveragePercent,
      pricedComponentCount,
      totalComponentCount,
      summary,
      blockers
    };
  }

  private serviceNameFor(provider: PreliminaryProvider, type: NormalizedComponentType): string {
    const aws: Record<NormalizedComponentType, string> = {
      compute: 'Amazon EC2',
      database: 'Amazon RDS for PostgreSQL',
      cache: 'Amazon ElastiCache for Redis',
      storage: 'Amazon S3',
      object_storage: 'Amazon S3',
      block_storage: 'Amazon EBS',
      file_storage: 'Amazon EFS',
      cdn: 'Amazon CloudFront',
      load_balancer: 'Elastic Load Balancing',
      kubernetes: 'Amazon EKS',
      serverless: 'AWS Lambda',
      queue: 'Amazon SQS',
      monitoring: 'Amazon CloudWatch',
      backup: 'AWS Backup',
      security: 'AWS Security Hub',
      network: 'Amazon VPC',
      unknown: 'Unknown AWS service'
    };
    const gcp: Record<NormalizedComponentType, string> = {
      compute: 'Compute Engine',
      database: 'Cloud SQL for PostgreSQL',
      cache: 'Memorystore for Redis',
      storage: 'Cloud Storage',
      object_storage: 'Cloud Storage',
      block_storage: 'Persistent Disk',
      file_storage: 'Filestore',
      cdn: 'Cloud CDN',
      load_balancer: 'Cloud Load Balancing',
      kubernetes: 'Google Kubernetes Engine',
      serverless: 'Cloud Functions / Cloud Run',
      queue: 'Pub/Sub',
      monitoring: 'Cloud Monitoring / Cloud Logging',
      backup: 'Backup and DR Service',
      security: 'Security Command Center',
      network: 'Virtual Private Cloud',
      unknown: 'Unknown GCP service'
    };
    return provider === 'aws' ? aws[type] : gcp[type];
  }
}
