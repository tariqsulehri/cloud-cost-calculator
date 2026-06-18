import type { CloudProvider, ProviderServiceHints } from '../database/CloudCatalogDatabase.js';
import type { NormalizedComponent, NormalizedComponentType } from '../types/estimate.types.js';

export type PricingCoverageStatus = 'exact' | 'partial' | 'planning' | 'unsupported';

export interface ProviderServiceMapEntry {
  serviceName: string;
  pricingServiceName: string;
  pricingAdapter: string | null;
  syncTarget: string | null;
  coverage: PricingCoverageStatus;
  notes: string;
}

export interface CloudServiceMapEntry {
  serviceKey: string;
  componentType: NormalizedComponentType;
  label: string;
  requiredFields: string[];
  providers: Record<CloudProvider, ProviderServiceMapEntry>;
}

export const cloudServiceMap: CloudServiceMapEntry[] = [
  {
    serviceKey: 'compute',
    componentType: 'compute',
    label: 'Virtual machine compute',
    requiredFields: ['quantity', 'vcpu', 'memoryGb', 'operatingSystem', 'monthlyHours'],
    providers: {
      azure: provider('Azure Virtual Machines', 'Virtual Machines', 'azure.vm.linux.payg', 'Virtual Machines', 'exact', 'Linux pay-as-you-go VM hourly meter.'),
      aws: provider('Amazon EC2', 'AmazonEC2', 'aws.ec2.linux.ondemand', 'AmazonEC2', 'exact', 'Linux on-demand instance hourly meter.'),
      gcp: provider('Compute Engine', 'Compute Engine', 'gcp.compute.vcpu_ram', 'Compute Engine', 'exact', 'Core and RAM hourly meters are combined.')
    }
  },
  {
    serviceKey: 'kubernetes',
    componentType: 'kubernetes',
    label: 'Managed Kubernetes worker nodes',
    requiredFields: ['nodeCount', 'vcpuPerNode', 'memoryGbPerNode', 'monthlyHours'],
    providers: {
      azure: provider('Azure Kubernetes Service (AKS)', 'Azure Kubernetes Service', 'azure.aks.worker_vm', 'Virtual Machines', 'partial', 'Prices worker node VM compute only.'),
      aws: provider('Amazon EKS', 'AmazonEKS', 'aws.eks.worker_ec2', 'AmazonEC2', 'partial', 'Prices worker node EC2 compute only.'),
      gcp: provider('Google Kubernetes Engine', 'Kubernetes Engine', 'gcp.gke.worker_compute', 'Compute Engine', 'partial', 'Prices worker node Compute Engine meters only.')
    }
  },
  {
    serviceKey: 'database.postgresql',
    componentType: 'database',
    label: 'Managed PostgreSQL',
    requiredFields: ['engine', 'vcpu', 'memoryGb', 'storageGb', 'highAvailability'],
    providers: {
      azure: provider('Azure Database for PostgreSQL Flexible Server', 'Azure Database for PostgreSQL', 'azure.postgres.flexible.ddsv5', 'Azure Database for PostgreSQL', 'exact', 'Compute and storage priced separately.'),
      aws: provider('Amazon RDS for PostgreSQL', 'AmazonRDS', 'aws.rds.postgres.m7g', 'AmazonRDS', 'exact', 'Instance and general purpose storage priced separately.'),
      gcp: provider('Cloud SQL for PostgreSQL', 'Cloud SQL', 'gcp.cloudsql.postgres.vcpu_ram_storage', 'Cloud SQL', 'exact', 'vCPU, RAM, and storage meters are combined into line items.')
    }
  },
  {
    serviceKey: 'cache.redis',
    componentType: 'cache',
    label: 'Redis cache',
    requiredFields: ['engine', 'memoryGb', 'tier'],
    providers: {
      azure: provider('Azure Cache for Redis', 'Azure Cache for Redis', 'azure.redis.cache_sku', 'Redis Cache', 'exact', 'One Redis cache SKU selected from memory and tier.'),
      aws: provider('Amazon ElastiCache for Redis', 'AmazonElastiCache', 'aws.elasticache.redis_node', 'AmazonElastiCache', 'exact', 'One Redis node selected from memory and tier.'),
      gcp: provider('Memorystore for Redis', 'Cloud Memorystore for Redis', 'gcp.memorystore.redis_capacity', 'Cloud Memorystore for Redis', 'exact', 'GB-hour capacity meter.')
    }
  },
  {
    serviceKey: 'object_storage',
    componentType: 'object_storage',
    label: 'Object storage',
    requiredFields: ['dataStoredGb', 'accessTier', 'redundancy'],
    providers: {
      azure: provider('Azure Blob Storage', 'Storage', 'azure.blob.capacity', 'Storage', 'exact', 'Capacity only; requests and retrieval are excluded.'),
      aws: provider('Amazon S3', 'AmazonS3', 'aws.s3.storage', 'AmazonS3', 'exact', 'Capacity only; requests and retrieval are excluded.'),
      gcp: provider('Cloud Storage', 'Cloud Storage', 'gcp.cloud_storage.capacity', 'Cloud Storage', 'exact', 'Capacity only; operations and retrieval are excluded.')
    }
  },
  {
    serviceKey: 'block_storage',
    componentType: 'block_storage',
    label: 'Block storage',
    requiredFields: ['diskCount', 'diskSizeGb', 'diskTier'],
    providers: {
      azure: provider('Azure Managed Disks', 'Storage', null, 'Storage', 'planning', 'Not yet connected to a deterministic managed disk adapter.'),
      aws: provider('Amazon EBS', 'AmazonEC2', 'aws.ebs.volume_storage', 'AmazonEC2', 'exact', 'GB-month storage meter.'),
      gcp: provider('Persistent Disk', 'Compute Engine', 'gcp.persistent_disk.capacity', 'Compute Engine', 'exact', 'GB-month Persistent Disk capacity meter.')
    }
  },
  {
    serviceKey: 'cdn',
    componentType: 'cdn',
    label: 'CDN',
    requiredFields: ['dataTransferGb'],
    providers: {
      azure: provider('Azure CDN / Azure Front Door', 'Content Delivery Network', 'azure.cdn.microsoft', 'Content Delivery Network', 'exact', 'Transfer and optional request meters.'),
      aws: provider('Amazon CloudFront', 'AmazonCloudFront', 'aws.cloudfront.transfer_requests', 'AmazonCloudFront', 'exact', 'Transfer and optional request meters.'),
      gcp: provider('Cloud CDN', 'Networking', 'gcp.cloudcdn.cache_transfer', 'Networking', 'partial', 'Cache transfer priced; cache fill and requests excluded.')
    }
  },
  {
    serviceKey: 'load_balancer.http_s',
    componentType: 'load_balancer',
    label: 'HTTP/S load balancer',
    requiredFields: ['scheme'],
    providers: {
      azure: provider('Azure Application Gateway', 'Application Gateway', 'azure.application_gateway.standard_v2', 'Application Gateway', 'exact', 'Fixed and capacity unit meters.'),
      aws: provider('Application Load Balancer', 'AWSELB', 'aws.elb.application', 'AWSELB', 'exact', 'Hourly and LCU meters.'),
      gcp: provider('External Application Load Balancer', 'Networking', 'gcp.load_balancer.forwarding_rule', 'Networking', 'partial', 'Forwarding rule minimum only; data processing excluded.')
    }
  },
  {
    serviceKey: 'load_balancer.tcp',
    componentType: 'load_balancer',
    label: 'TCP/network load balancer',
    requiredFields: ['scheme'],
    providers: {
      azure: provider('Azure Load Balancer', 'Load Balancer', 'azure.load_balancer.standard', 'Load Balancer', 'exact', 'Included rule and optional data processed meters.'),
      aws: provider('Network Load Balancer', 'AWSELB', 'aws.elb.network', 'AWSELB', 'exact', 'Hourly and NCU meters.'),
      gcp: provider('Network Load Balancer', 'Networking', 'gcp.load_balancer.forwarding_rule', 'Networking', 'partial', 'Forwarding rule minimum only; data processing excluded.')
    }
  },
  {
    serviceKey: 'queue',
    componentType: 'queue',
    label: 'Messaging queue',
    requiredFields: ['messageVolume', 'tier'],
    providers: {
      azure: provider('Azure Service Bus', 'Service Bus', 'azure.service_bus', 'Service Bus', 'exact', 'Base tier and operations meters.'),
      aws: provider('Amazon SQS / Amazon EventBridge', 'AmazonSQS', 'aws.sqs.standard_requests', 'AmazonSQS', 'exact', 'Standard request meter.'),
      gcp: provider('Pub/Sub', 'Cloud Pub/Sub', null, 'Cloud Pub/Sub', 'planning', 'Needs average payload size for exact data-volume pricing.')
    }
  },
  {
    serviceKey: 'monitoring',
    componentType: 'monitoring',
    label: 'Logging and monitoring',
    requiredFields: ['logIngestionGb', 'retentionDays'],
    providers: {
      azure: provider('Azure Monitor / Log Analytics', 'Log Analytics', 'azure.log_analytics', 'Log Analytics', 'exact', 'Ingestion and optional retention meters.'),
      aws: provider('Amazon CloudWatch', 'AmazonCloudWatch', 'aws.cloudwatch.logs', 'AmazonCloudWatch', 'exact', 'Custom log ingestion meter.'),
      gcp: provider('Cloud Logging', 'Cloud Logging', 'gcp.cloud_logging.storage', 'Cloud Logging', 'partial', 'Log storage meter; routing and metrics excluded.')
    }
  },
  {
    serviceKey: 'network.egress',
    componentType: 'network',
    label: 'Internet egress',
    requiredFields: ['monthlyEgressGb'],
    providers: {
      azure: provider('Azure Bandwidth', 'Bandwidth', 'azure.bandwidth.egress', 'Bandwidth', 'exact', 'Tiered standard data transfer out meter.'),
      aws: provider('AWS Data Transfer', 'AWSDataTransfer', 'aws.data_transfer.internet', 'AWSDataTransfer', 'exact', 'First-tier internet egress meter.'),
      gcp: provider('Network Data Transfer', 'Networking', 'gcp.network.internet_egress', 'Compute Engine', 'partial', 'Destination-sensitive egress; current adapter uses available public destination meter.')
    }
  },
  {
    serviceKey: 'serverless',
    componentType: 'serverless',
    label: 'Serverless functions',
    requiredFields: ['requestCount', 'memoryGbSeconds'],
    providers: {
      azure: provider('Azure Functions', 'Functions', null, null, 'unsupported', 'Not implemented yet.'),
      aws: provider('AWS Lambda', 'AWSLambda', 'aws.lambda.requests_duration', 'AWSLambda', 'exact', 'Request and GB-second meters.'),
      gcp: provider('Cloud Functions / Cloud Run', 'Cloud Functions', null, null, 'unsupported', 'Not implemented yet.')
    }
  }
];

const entriesByServiceKey = new Map(cloudServiceMap.map((entry) => [entry.serviceKey, entry]));
const entriesByComponentType = new Map<NormalizedComponentType, CloudServiceMapEntry>();
for (const entry of cloudServiceMap) {
  if (!entriesByComponentType.has(entry.componentType)) {
    entriesByComponentType.set(entry.componentType, entry);
  }
}

export function providerHintsForServiceKey(serviceKey: string): ProviderServiceHints | null {
  const entry = entriesByServiceKey.get(serviceKey);
  if (!entry) {
    return null;
  }

  return {
    azure: entry.providers.azure.serviceName,
    aws: entry.providers.aws.serviceName,
    gcp: entry.providers.gcp.serviceName
  };
}

export function mappedServiceKeyForComponent(component: NormalizedComponent): string {
  if (component.type === 'database' && 'engine' in component && component.engine === 'postgresql') {
    return 'database.postgresql';
  }
  if (component.type === 'cache' && 'engine' in component && component.engine === 'redis') {
    return 'cache.redis';
  }
  if (component.type === 'load_balancer' && 'scheme' in component) {
    if (component.scheme === 'http_s') return 'load_balancer.http_s';
    if (component.scheme === 'tcp') return 'load_balancer.tcp';
  }
  if (component.type === 'network') {
    return 'network.egress';
  }
  return component.type;
}

export function providerHintsForComponent(component: NormalizedComponent): ProviderServiceHints {
  return providerHintsForServiceKey(mappedServiceKeyForComponent(component)) ?? providerHintsForType(component.type);
}

export function providerHintsForType(type: NormalizedComponentType): ProviderServiceHints {
  const entry = entriesByComponentType.get(type);
  if (!entry) {
    return { azure: null, aws: null, gcp: null };
  }
  return {
    azure: entry.providers.azure.serviceName,
    aws: entry.providers.aws.serviceName,
    gcp: entry.providers.gcp.serviceName
  };
}

export function pricingCoverageSummary(): Array<{
  serviceKey: string;
  label: string;
  componentType: NormalizedComponentType;
  requiredFields: string[];
  providers: Record<CloudProvider, ProviderServiceMapEntry>;
}> {
  return cloudServiceMap.map((entry) => ({
    serviceKey: entry.serviceKey,
    label: entry.label,
    componentType: entry.componentType,
    requiredFields: entry.requiredFields,
    providers: entry.providers
  }));
}

function provider(
  serviceName: string,
  pricingServiceName: string,
  pricingAdapter: string | null,
  syncTarget: string | null,
  coverage: PricingCoverageStatus,
  notes: string
): ProviderServiceMapEntry {
  return {
    serviceName,
    pricingServiceName,
    pricingAdapter,
    syncTarget,
    coverage,
    notes
  };
}
