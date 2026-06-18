import { roundMoney } from '../utils/money.js';
import { AwsPricingService, type AwsPublicPriceResult } from './AwsPricingService.js';
import { GcpPricingService, type GcpPublicPriceResult } from './GcpPricingService.js';
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
  constructor(
    private readonly awsPricingService = new AwsPricingService(),
    private readonly gcpPricingService = new GcpPricingService()
  ) {}

  async estimateNormalized(request: NormalizedEstimateRequest): Promise<NormalizedEstimateResponse> {
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
      provider === 'aws'
        ? 'AWS estimates use public on-demand price list data for exact EC2 Linux instance matches. Services without a public adapter still use the early proposal rate card.'
        : provider === 'gcp'
          ? 'GCP estimates use synced Google Cloud Billing public prices where matching public adapters are available. Services without a public adapter still use the early proposal rate card.'
        : `${rateCard.providerLabel} uses an early proposal rate card. It is not connected to live provider pricing APIs yet.`,
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
        const awsPrice = provider === 'aws' ? await this.awsEc2PriceForShape(region, vcpu, memoryGb) : null;
        const gcpPrice = provider === 'gcp' ? await this.gcpComputePriceForShape(region, vcpu, memoryGb) : null;
        if (awsPrice) {
          calculatedLineItems.push(
            this.publicAwsLineItem(awsPrice, {
              category: 'Compute',
              serviceName: this.serviceName(provider, component, 'Amazon EC2'),
              quantity,
              hours,
              assumption: `${awsPrice.assumption} Calculation is ${quantity} instance(s) x ${hours} hour(s) x public on-demand hourly price.`
            })
          );
        } else if (gcpPrice) {
          calculatedLineItems.push(
            this.publicGcpLineItem(gcpPrice, {
              category: 'Compute',
              serviceName: this.serviceName(provider, component, 'Compute Engine'),
              quantity,
              hours,
              assumption: `${gcpPrice.assumption} Calculation is ${quantity} instance(s) x ${hours} hour(s) x public hourly price.`
            })
          );
        } else {
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
        }
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
        const awsPrice = provider === 'aws' ? await this.awsEc2PriceForShape(region, vcpuPerNode, memoryGbPerNode) : null;
        const gcpPrice = provider === 'gcp' ? await this.gcpComputePriceForShape(region, vcpuPerNode, memoryGbPerNode) : null;
        if (awsPrice) {
          calculatedLineItems.push(
            this.publicAwsLineItem(awsPrice, {
              category: 'Compute',
              serviceName: this.serviceName(provider, component, 'Amazon EKS worker nodes'),
              quantity: nodeCount,
              hours,
              assumption: `${awsPrice.assumption} AWS Kubernetes estimate prices worker node compute only. Control plane fees, disks, ingress, NAT, logging, and add-ons are excluded unless separately detected.`
            })
          );
        } else if (gcpPrice) {
          calculatedLineItems.push(
            this.publicGcpLineItem(gcpPrice, {
              category: 'Compute',
              serviceName: this.serviceName(provider, component, 'Google Kubernetes Engine worker nodes'),
              quantity: nodeCount,
              hours,
              assumption: `${gcpPrice.assumption} GCP Kubernetes estimate prices worker node compute only. Control plane fees, disks, ingress, NAT, logging, and add-ons are excluded unless separately detected.`
            })
          );
        } else {
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
        }
        pricedComponentIds.add(component.id);
      } else if (component.type === 'database') {
        if (component.engine !== 'postgresql' || !component.vcpu || !component.storageGb || component.highAvailability === null || component.highAvailability === undefined) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing PostgreSQL engine, vCPU, storage, or high availability setting for early database pricing.'));
          continue;
        }

        const hours = this.numberValue(component as unknown as GenericComponent, 'monthlyHours') ?? 730;
        const rdsInstanceType = provider === 'aws' ? this.awsRdsInstanceTypeForShape(component.vcpu) : null;
        const awsRdsComputePrice =
          provider === 'aws' && rdsInstanceType
            ? await this.awsPricingService.getRdsPostgresInstanceHourlyPrice({ region, instanceType: rdsInstanceType, highAvailability: component.highAvailability })
            : null;
        const awsRdsStoragePrice = provider === 'aws' ? await this.awsPricingService.getRdsGeneralPurposeStoragePrice({ region }) : null;
        const gcpSqlComputePrice =
          provider === 'gcp'
            ? await this.gcpPricingService.getCloudSqlPostgresComputeHourlyPrice({
                region,
                vcpu: component.vcpu,
                memoryGb: component.memoryGb ?? component.vcpu * 4,
                highAvailability: component.highAvailability
              })
            : null;
        const gcpSqlStoragePrice = provider === 'gcp' ? await this.gcpPricingService.getCloudSqlPostgresStoragePrice({ region }) : null;
        if (awsRdsComputePrice && awsRdsStoragePrice) {
          calculatedLineItems.push(
            this.publicAwsLineItem(awsRdsComputePrice, {
              category: 'Database',
              serviceName: this.serviceName(provider, component, 'Amazon RDS for PostgreSQL'),
              quantity: 1,
              hours,
              usageLabel: `1 ${component.highAvailability ? 'Multi-AZ' : 'Single-AZ'} database x ${hours} hours`,
              assumption: `${awsRdsComputePrice.assumption} Calculation is 1 database x ${hours} hour(s) x public RDS hourly price.`
            }),
            this.publicAwsLineItem(awsRdsStoragePrice, {
              category: 'Database',
              serviceName: this.serviceName(provider, component, 'Amazon RDS for PostgreSQL'),
              quantity: component.storageGb,
              hours: 1,
              usageLabel: `${component.storageGb} GB-month`,
              assumption: `${awsRdsStoragePrice.assumption} Calculation is ${component.storageGb} GB-month x public storage price. Backup overage, IOPS, replicas, and private networking are excluded.`
            })
          );
        } else if (gcpSqlComputePrice && gcpSqlStoragePrice) {
          const computeQuantity = component.highAvailability ? 2 : 1;
          calculatedLineItems.push(
            this.publicGcpLineItem(gcpSqlComputePrice, {
              category: 'Database',
              serviceName: this.serviceName(provider, component, 'Cloud SQL for PostgreSQL'),
              quantity: computeQuantity,
              hours,
              usageLabel: `${computeQuantity} database node(s) x ${hours} hours`,
              assumption: `${gcpSqlComputePrice.assumption} Calculation is ${computeQuantity} database node(s) x ${hours} hour(s) x public Cloud SQL compute price. High availability is modeled as a second node for budget planning.`
            }),
            this.publicGcpLineItem(gcpSqlStoragePrice, {
              category: 'Database',
              serviceName: this.serviceName(provider, component, 'Cloud SQL for PostgreSQL'),
              quantity: component.storageGb,
              hours: 1,
              usageLabel: `${component.storageGb} GB-month`,
              assumption: `${gcpSqlStoragePrice.assumption} Calculation is ${component.storageGb} GB-month x public storage price.`
            })
          );
        } else {
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
        }
        pricedComponentIds.add(component.id);
      } else if (component.type === 'cache') {
        if (component.engine !== 'redis' || !component.memoryGb || !component.tier) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing Redis engine, memory, or tier for early cache pricing.'));
          continue;
        }

        const hours = this.numberValue(component as unknown as GenericComponent, 'monthlyHours') ?? 730;
        const awsRedisPrice =
          provider === 'aws' ? await this.awsPricingService.getElastiCacheRedisHourlyPrice({ region, memoryGb: component.memoryGb, tier: component.tier }) : null;
        const gcpRedisPrice =
          provider === 'gcp' ? await this.gcpPricingService.getMemorystoreRedisCapacityPrice({ region, memoryGb: component.memoryGb, tier: component.tier }) : null;
        if (awsRedisPrice) {
          calculatedLineItems.push(
            this.publicAwsLineItem(awsRedisPrice, {
              category: 'Cache',
              serviceName: this.serviceName(provider, component, 'Amazon ElastiCache for Redis'),
              quantity: 1,
              hours,
              usageLabel: `1 Redis node x ${hours} hours`,
              assumption: `${awsRedisPrice.assumption} Calculation is 1 Redis node x ${hours} hour(s) x public node hourly price. Clustering, replicas, snapshots, and data transfer are excluded unless separately specified.`
            })
          );
        } else if (gcpRedisPrice) {
          calculatedLineItems.push(
            this.publicGcpLineItem(gcpRedisPrice, {
              category: 'Cache',
              serviceName: this.serviceName(provider, component, 'Memorystore for Redis'),
              quantity: component.memoryGb,
              hours,
              usageLabel: `${component.memoryGb} GB x ${hours} hours`,
              assumption: `${gcpRedisPrice.assumption} Calculation is ${component.memoryGb} GB x ${hours} hour(s) x public capacity price.`
            })
          );
        } else {
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
        }
        pricedComponentIds.add(component.id);
      } else if (component.type === 'object_storage') {
        const dataStoredGb = this.numberValue(component, 'dataStoredGb');
        if (!dataStoredGb) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing stored GB for early object storage pricing.'));
          continue;
        }
        const awsS3Price = provider === 'aws' ? await this.awsPricingService.getS3StoragePrice({ region, accessTier: this.stringValue(component, 'accessTier') }) : null;
        const gcpStoragePrice = provider === 'gcp' ? await this.gcpPricingService.getCloudStorageCapacityPrice({ region, accessTier: this.stringValue(component, 'accessTier') }) : null;
        if (awsS3Price) {
          calculatedLineItems.push(
            this.publicAwsLineItem(awsS3Price, {
              category: 'Storage',
              serviceName: this.serviceName(provider, component, 'Amazon S3'),
              quantity: dataStoredGb,
              hours: 1,
              usageLabel: `${dataStoredGb} GB-month`,
              assumption: `${awsS3Price.assumption} Calculation is ${dataStoredGb} GB-month x public storage price. Requests, retrieval, lifecycle, replication, and transfer are excluded unless separately detected.`
            })
          );
        } else if (gcpStoragePrice) {
          calculatedLineItems.push(
            this.publicGcpLineItem(gcpStoragePrice, {
              category: 'Storage',
              serviceName: this.serviceName(provider, component, 'Cloud Storage'),
              quantity: dataStoredGb,
              hours: 1,
              usageLabel: `${dataStoredGb} GB-month`,
              assumption: `${gcpStoragePrice.assumption} Calculation is ${dataStoredGb} GB-month x public storage price.`
            })
          );
        } else {
          calculatedLineItems.push(
            this.usageLine(provider, component, 'Storage', provider === 'aws' ? 'Amazon S3' : 'Cloud Storage', 'Standard storage planning rate', dataStoredGb, 'GB-month', rateCard.objectStorageGbMonth)
          );
        }
        pricedComponentIds.add(component.id);
      } else if (component.type === 'block_storage') {
        const diskCount = this.numberValue(component, 'diskCount') ?? 1;
        const diskSizeGb = this.numberValue(component, 'diskSizeGb');
        if (!diskSizeGb) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing disk size GB for block storage pricing.'));
          continue;
        }

        const awsPrice = provider === 'aws' ? await this.awsPricingService.getEbsVolumeStoragePrice({ region, diskTier: this.stringValue(component, 'diskTier') }) : null;
        const gcpDiskPrice = provider === 'gcp' ? await this.gcpPricingService.getPersistentDiskStoragePrice({ region, diskTier: this.stringValue(component, 'diskTier') }) : null;
        if (awsPrice) {
          const totalGbMonth = diskCount * diskSizeGb;
          calculatedLineItems.push(
            this.publicAwsLineItem(awsPrice, {
              category: 'Storage',
              serviceName: this.serviceName(provider, component, 'Amazon EBS'),
              quantity: totalGbMonth,
              hours: 1,
              usageLabel: `${diskCount} disk(s) x ${diskSizeGb} GB`,
              assumption: `${awsPrice.assumption} Calculation is ${diskCount} disk(s) x ${diskSizeGb} GB x public GB-month price. IOPS, throughput add-ons, snapshots, and API requests are excluded unless separately specified.`
            })
          );
        } else if (gcpDiskPrice) {
          const totalGbMonth = diskCount * diskSizeGb;
          calculatedLineItems.push(
            this.publicGcpLineItem(gcpDiskPrice, {
              category: 'Storage',
              serviceName: this.serviceName(provider, component, 'Persistent Disk'),
              quantity: totalGbMonth,
              hours: 1,
              usageLabel: `${diskCount} disk(s) x ${diskSizeGb} GB`,
              assumption: `${gcpDiskPrice.assumption} Calculation is ${diskCount} disk(s) x ${diskSizeGb} GB x public GB-month price.`
            })
          );
        } else {
          const totalGbMonth = diskCount * diskSizeGb;
          const unitPrice = provider === 'aws' ? 0.08 : 0.04;
          calculatedLineItems.push(
            this.lineItem({
              category: 'Storage',
              serviceName: this.serviceName(provider, component, provider === 'aws' ? 'Amazon EBS' : 'Persistent Disk'),
              skuName: 'Block storage planning rate',
              meterName: 'Early proposal GB-month',
              quantity: totalGbMonth,
              hours: 1,
              usageLabel: `${diskCount} disk(s) x ${diskSizeGb} GB`,
              unit: 'GB-month',
              unitPrice,
              monthlyCost: roundMoney(totalGbMonth * unitPrice),
              assumption: `${rateCard.providerLabel} block storage uses a planning GB-month rate. Performance add-ons, snapshots, and operations are excluded.`
            })
          );
        }
        pricedComponentIds.add(component.id);
      } else if (component.type === 'network') {
        const monthlyEgressGb = this.numberValue(component, 'monthlyEgressGb');
        if (!monthlyEgressGb) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing monthly egress GB for early network pricing.'));
          continue;
        }
        const awsDataTransferPrice = provider === 'aws' ? await this.awsPricingService.getDataTransferOutToInternetPrice({ region }) : null;
        const gcpDataTransferPrice = provider === 'gcp' ? await this.gcpPricingService.getNetworkInternetEgressPrice({ region }) : null;
        if (awsDataTransferPrice) {
          calculatedLineItems.push(
            this.publicAwsLineItem(awsDataTransferPrice, {
              category: 'Networking',
              serviceName: this.serviceName(provider, component, 'AWS Data Transfer'),
              quantity: monthlyEgressGb,
              hours: 1,
              usageLabel: `${monthlyEgressGb} GB egress`,
              assumption: `${awsDataTransferPrice.assumption} Calculation is ${monthlyEgressGb} GB x public first-tier internet egress price. The global 100 GB free tier, CDN transfer, NAT processing, and inter-region transfer are excluded.`
            })
          );
        } else if (gcpDataTransferPrice) {
          calculatedLineItems.push(
            this.publicGcpLineItem(gcpDataTransferPrice, {
              category: 'Networking',
              serviceName: this.serviceName(provider, component, 'Network Data Transfer'),
              quantity: monthlyEgressGb,
              hours: 1,
              usageLabel: `${monthlyEgressGb} GB egress`,
              assumption: `${gcpDataTransferPrice.assumption} Calculation is ${monthlyEgressGb} GB x public first-tier internet egress price.`
            })
          );
        } else {
          calculatedLineItems.push(
            this.usageLine(provider, component, 'Networking', provider === 'aws' ? 'AWS Data Transfer' : 'Network Data Transfer', 'Internet egress planning rate', monthlyEgressGb, 'GB egress', rateCard.networkEgressGb)
          );
        }
        pricedComponentIds.add(component.id);
      } else if (component.type === 'cdn') {
        const transferGb = this.numberValue(component, 'dataTransferGb') ?? this.numberValue(component, 'monthlyTransferGb');
        if (!transferGb) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing CDN transfer GB for early CDN pricing.'));
          continue;
        }
        const awsCloudFrontTransferPrice = provider === 'aws' ? await this.awsPricingService.getCloudFrontDataTransferOutPrice() : null;
        const requestCount = this.numberValue(component as unknown as GenericComponent, 'requestCount');
        const awsCloudFrontRequestPrice = provider === 'aws' && requestCount ? await this.awsPricingService.getCloudFrontHttpRequestPrice() : null;
        const gcpCdnTransferPrice = provider === 'gcp' ? await this.gcpPricingService.getCloudCdnCacheDataTransferPrice({ region }) : null;
        if (awsCloudFrontTransferPrice) {
          calculatedLineItems.push(
            this.publicAwsLineItem(awsCloudFrontTransferPrice, {
              category: 'Networking',
              serviceName: this.serviceName(provider, component, 'Amazon CloudFront'),
              quantity: transferGb,
              hours: 1,
              usageLabel: `${transferGb} GB transfer`,
              assumption: `${awsCloudFrontTransferPrice.assumption} Calculation is ${transferGb} GB x public first-tier transfer price. Origin transfer, invalidations, functions, and origin shield are excluded unless separately detected.`
            })
          );
          if (awsCloudFrontRequestPrice && requestCount) {
            calculatedLineItems.push(
              this.publicAwsLineItem(awsCloudFrontRequestPrice, {
                category: 'Networking',
                serviceName: this.serviceName(provider, component, 'Amazon CloudFront'),
                quantity: requestCount,
                hours: 1,
                usageLabel: `${requestCount} HTTP request(s)`,
                assumption: `${awsCloudFrontRequestPrice.assumption} Calculation is ${requestCount} request(s) x public request unit price.`
              })
            );
          }
        } else if (gcpCdnTransferPrice) {
          calculatedLineItems.push(
            this.publicGcpLineItem(gcpCdnTransferPrice, {
              category: 'Networking',
              serviceName: this.serviceName(provider, component, 'Cloud CDN'),
              quantity: transferGb,
              hours: 1,
              usageLabel: `${transferGb} GB transfer`,
              assumption: `${gcpCdnTransferPrice.assumption} Calculation is ${transferGb} GB x public cache data transfer price.`
            })
          );
        } else {
          calculatedLineItems.push(
            this.usageLine(provider, component, 'Networking', provider === 'aws' ? 'Amazon CloudFront' : 'Cloud CDN', 'CDN transfer planning rate', transferGb, 'GB transfer', rateCard.cdnTransferGb)
          );
        }
        pricedComponentIds.add(component.id);
      } else if (component.type === 'load_balancer') {
        if (!component.scheme) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing load balancer scheme for early pricing.'));
          continue;
        }
        const hours = this.numberValue(component as unknown as GenericComponent, 'monthlyHours') ?? 730;
        const awsHourlyPrice = provider === 'aws' ? await this.awsPricingService.getElasticLoadBalancerHourlyPrice({ region, scheme: component.scheme }) : null;
        const awsCapacityUnitPrice = provider === 'aws' ? await this.awsPricingService.getElasticLoadBalancerCapacityUnitPrice({ region, scheme: component.scheme }) : null;
        const gcpLoadBalancerPrice = provider === 'gcp' ? await this.gcpPricingService.getCloudLoadBalancerForwardingRulePrice({ region, scheme: component.scheme }) : null;
        if (awsHourlyPrice && awsCapacityUnitPrice) {
          const loadBalancerCount = this.numberValue(component as unknown as GenericComponent, 'loadBalancerCount') ?? 1;
          const capacityUnits = this.numberValue(component as unknown as GenericComponent, 'capacityUnits') ?? 1;
          const serviceName = this.serviceName(provider, component, component.scheme === 'http_s' ? 'AWS Application Load Balancer' : 'AWS Network Load Balancer');
          calculatedLineItems.push(
            this.publicAwsLineItem(awsHourlyPrice, {
              category: 'Networking',
              serviceName,
              quantity: loadBalancerCount,
              hours,
              usageLabel: `${loadBalancerCount} load balancer(s) x ${hours} hours`,
              assumption: `${awsHourlyPrice.assumption} Calculation is ${loadBalancerCount} load balancer(s) x ${hours} hour(s) x public hourly price.`
            }),
            this.publicAwsLineItem(awsCapacityUnitPrice, {
              category: 'Networking',
              serviceName,
              quantity: capacityUnits,
              hours,
              usageLabel: `${capacityUnits} capacity unit(s) x ${hours} hours`,
              assumption: `${awsCapacityUnitPrice.assumption} Calculation is ${capacityUnits} capacity unit(s) x ${hours} hour(s) x public capacity-unit price. Rules, WAF, certificates, and data transfer are excluded unless separately detected.`
            })
          );
        } else if (gcpLoadBalancerPrice) {
          const loadBalancerCount = this.numberValue(component as unknown as GenericComponent, 'loadBalancerCount') ?? 1;
          calculatedLineItems.push(
            this.publicGcpLineItem(gcpLoadBalancerPrice, {
              category: 'Networking',
              serviceName: this.serviceName(provider, component, 'Cloud Load Balancing'),
              quantity: loadBalancerCount,
              hours,
              usageLabel: `${loadBalancerCount} forwarding rule(s) x ${hours} hours`,
              assumption: `${gcpLoadBalancerPrice.assumption} Calculation is ${loadBalancerCount} forwarding rule(s) x ${hours} hour(s) x public forwarding-rule price.`
            })
          );
        } else {
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
        }
        pricedComponentIds.add(component.id);
      } else if (component.type === 'queue') {
        const messageVolume = this.numberValue(component, 'messageVolume');
        if (!messageVolume) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing monthly message volume for early messaging pricing.'));
          continue;
        }
        const awsSqsPrice = provider === 'aws' ? await this.awsPricingService.getSqsStandardRequestPrice({ region }) : null;
        if (awsSqsPrice) {
          calculatedLineItems.push(
            this.publicAwsLineItem(awsSqsPrice, {
              category: 'Integration',
              serviceName: this.serviceName(provider, component, 'Amazon SQS'),
              quantity: messageVolume,
              hours: 1,
              usageLabel: `${messageVolume} request(s)`,
              assumption: `${awsSqsPrice.assumption} Calculation is ${messageVolume} request(s) x public standard request price. FIFO, payload size effects, data transfer, and extended client storage are excluded.`
            })
          );
        } else {
          const millionMessages = messageVolume / 1_000_000;
          calculatedLineItems.push(
            this.usageLine(provider, component, 'Integration', provider === 'aws' ? 'Amazon SQS' : 'Pub/Sub', 'Messaging operations planning rate', millionMessages, 'M messages', rateCard.queueMillionMessages)
          );
        }
        pricedComponentIds.add(component.id);
      } else if (component.type === 'monitoring') {
        const logIngestionGb = this.numberValue(component, 'logIngestionGb');
        if (!logIngestionGb) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing log ingestion GB for early monitoring pricing.'));
          continue;
        }
        const awsCloudWatchPrice = provider === 'aws' ? await this.awsPricingService.getCloudWatchCustomLogIngestionPrice({ region }) : null;
        const gcpLoggingPrice = provider === 'gcp' ? await this.gcpPricingService.getCloudLoggingStoragePrice() : null;
        if (awsCloudWatchPrice) {
          calculatedLineItems.push(
            this.publicAwsLineItem(awsCloudWatchPrice, {
              category: 'Management',
              serviceName: this.serviceName(provider, component, 'Amazon CloudWatch'),
              quantity: logIngestionGb,
              hours: 1,
              usageLabel: `${logIngestionGb} GB ingested`,
              assumption: `${awsCloudWatchPrice.assumption} Calculation is ${logIngestionGb} GB x public standard custom log ingestion price. Retention, metrics, alarms, dashboards, vended logs, and data protection scans are excluded unless separately detected.`
            })
          );
        } else if (gcpLoggingPrice) {
          calculatedLineItems.push(
            this.publicGcpLineItem(gcpLoggingPrice, {
              category: 'Management',
              serviceName: this.serviceName(provider, component, 'Cloud Logging'),
              quantity: logIngestionGb,
              hours: 1,
              usageLabel: `${logIngestionGb} GB stored`,
              assumption: `${gcpLoggingPrice.assumption} Calculation is ${logIngestionGb} GB x public log storage price.`
            })
          );
        } else {
          calculatedLineItems.push(
            this.usageLine(provider, component, 'Management', provider === 'aws' ? 'Amazon CloudWatch' : 'Cloud Logging', 'Log ingestion planning rate', logIngestionGb, 'GB ingested', rateCard.logIngestionGb)
          );
        }
        pricedComponentIds.add(component.id);
      } else if (component.type === 'serverless') {
        const requestCount = this.numberValue(component, 'requestCount');
        const memoryGbSeconds = this.numberValue(component, 'memoryGbSeconds');
        if (!requestCount && !memoryGbSeconds) {
          missingRequiredFieldLineItems.push(this.toUnpricedLineItem(provider, component, 'Missing request count or GB-seconds for serverless pricing.'));
          continue;
        }

        const awsLambdaRequestPrice = provider === 'aws' && requestCount ? await this.awsPricingService.getLambdaRequestPrice({ region }) : null;
        const awsLambdaDurationPrice = provider === 'aws' && memoryGbSeconds ? await this.awsPricingService.getLambdaDurationPrice({ region }) : null;
        if (awsLambdaRequestPrice || awsLambdaDurationPrice) {
          if (awsLambdaRequestPrice && requestCount) {
            calculatedLineItems.push(
              this.publicAwsLineItem(awsLambdaRequestPrice, {
                category: 'Compute',
                serviceName: this.serviceName(provider, component, 'AWS Lambda'),
                quantity: requestCount,
                hours: 1,
                usageLabel: `${requestCount} request(s)`,
                assumption: `${awsLambdaRequestPrice.assumption} Calculation is ${requestCount} request(s) x public request price. Free tier is excluded.`
              })
            );
          }
          if (awsLambdaDurationPrice && memoryGbSeconds) {
            calculatedLineItems.push(
              this.publicAwsLineItem(awsLambdaDurationPrice, {
                category: 'Compute',
                serviceName: this.serviceName(provider, component, 'AWS Lambda'),
                quantity: memoryGbSeconds,
                hours: 1,
                usageLabel: `${memoryGbSeconds} GB-second(s)`,
                assumption: `${awsLambdaDurationPrice.assumption} Calculation is ${memoryGbSeconds} GB-second(s) x public duration price. Free tier, provisioned concurrency, response streaming, and ephemeral storage are excluded.`
              })
            );
          }
        } else {
          notImplementedLineItems.push({
            componentId: component.id,
            type: component.type,
            serviceName: this.serviceName(provider, component, this.serviceNameFor(provider, component.type)),
            reason: `${rateCard.providerLabel} serverless pricing requires public request and/or duration meters.`,
            assumptions: component.assumptions,
            rawText: component.rawText
          });
          continue;
        }
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
      usesPublicPriceList: provider === 'aws' || provider === 'gcp',
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

  private async awsEc2PriceForShape(region: string, vcpu: number, memoryGb: number): Promise<AwsPublicPriceResult | null> {
    const instanceType = this.awsInstanceTypeForShape(vcpu, memoryGb);
    if (!instanceType) {
      return null;
    }

    return await this.awsPricingService.getEc2LinuxOnDemandHourlyPrice({ region, instanceType });
  }

  private async gcpComputePriceForShape(region: string, vcpu: number, memoryGb: number): Promise<GcpPublicPriceResult | null> {
    return await this.gcpPricingService.getComputeEngineShapeHourlyPrice({ region, vcpu, memoryGb });
  }

  private awsInstanceTypeForShape(vcpu: number, memoryGb: number): string | null {
    if (vcpu === 2 && memoryGb === 4) {
      return 't3.medium';
    }
    if (vcpu === 4 && memoryGb === 16) {
      return 'm7i.xlarge';
    }
    if (vcpu === 8 && memoryGb === 32) {
      return 'm7i.2xlarge';
    }
    return null;
  }

  private awsRdsInstanceTypeForShape(vcpu: number): string | null {
    if (vcpu === 2) {
      return 'db.m7g.large';
    }
    if (vcpu === 4) {
      return 'db.m7g.xlarge';
    }
    if (vcpu === 8) {
      return 'db.m7g.2xlarge';
    }
    return null;
  }

  private publicAwsLineItem(
    price: AwsPublicPriceResult,
    input: {
      category: EstimateLineItem['category'];
      serviceName: string;
      quantity: number;
      hours: number;
      usageLabel?: string;
      assumption: string;
    }
  ): EstimateLineItem {
    return {
      category: input.category,
      serviceName: input.serviceName,
      skuName: price.skuName,
      meterName: price.meterName,
      quantity: input.quantity,
      hours: input.hours,
      usageLabel: input.usageLabel,
      unit: price.unit,
      unitPrice: price.unitPrice,
      monthlyCost: roundMoney(price.unitPrice * input.quantity * input.hours),
      assumption: input.assumption,
      pricingSource: price.pricingSource,
      confidence: price.confidence,
      rawProductName: price.rawProductName,
      rawSkuName: price.rawSkuName,
      rawMeterName: price.rawMeterName,
      rawArmRegionName: price.rawArmRegionName
    };
  }

  private publicGcpLineItem(
    price: GcpPublicPriceResult,
    input: {
      category: EstimateLineItem['category'];
      serviceName: string;
      quantity: number;
      hours: number;
      usageLabel?: string;
      assumption: string;
    }
  ): EstimateLineItem {
    return {
      category: input.category,
      serviceName: input.serviceName,
      skuName: price.skuName,
      meterName: price.meterName,
      quantity: input.quantity,
      hours: input.hours,
      usageLabel: input.usageLabel,
      unit: price.unit,
      unitPrice: price.unitPrice,
      monthlyCost: roundMoney(price.unitPrice * input.quantity * input.hours),
      assumption: input.assumption,
      pricingSource: price.pricingSource,
      confidence: price.confidence,
      rawProductName: price.rawProductName,
      rawSkuName: price.rawSkuName,
      rawMeterName: price.rawMeterName,
      rawArmRegionName: price.rawArmRegionName
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

  private stringValue(component: object, field: string): string | null {
    const value = (component as Record<string, unknown>)[field];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
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
    usesPublicPriceList,
    totalComponentCount,
    pricedComponentCount,
    reviewItems
  }: {
    providerLabel: string;
    usesPublicPriceList: boolean;
    totalComponentCount: number;
    pricedComponentCount: number;
    reviewItems: Array<{ serviceName: string; reason: string }>;
  }): NormalizedEstimateResponse['estimateQuality'] {
    const coveragePercent = totalComponentCount === 0 ? 0 : Math.round((pricedComponentCount / totalComponentCount) * 100);
    const blockers = reviewItems.map((item) => `${item.serviceName}: ${item.reason}`);
    const status = totalComponentCount === 0 || pricedComponentCount === 0 ? 'blocked' : blockers.length > 0 ? 'partial' : 'complete';
    const mode = usesPublicPriceList ? 'public/planning estimate' : 'early proposal estimate';
    const completeSuffix = usesPublicPriceList ? 'with public provider prices where available and planning rates for unsupported adapters.' : 'with planning rates.';
    const summary =
      status === 'complete'
        ? `${providerLabel} ${mode} complete: ${pricedComponentCount}/${totalComponentCount} detected services are priced ${completeSuffix}`
        : status === 'partial'
          ? `${providerLabel} partial ${mode}: ${pricedComponentCount}/${totalComponentCount} detected services are priced. Unpriced services are excluded from the total.`
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
