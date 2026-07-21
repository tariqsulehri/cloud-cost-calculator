import { afterEach, describe, expect, it } from 'vitest';
import { CloudCatalogDatabase } from '../database/CloudCatalogDatabase.js';
import type { AwsRetailPriceMeterInput } from '../types/awsPriceList.types.js';
import type { NormalizedEstimateRequest } from '../types/estimate.types.js';
import { AwsPricingService } from './AwsPricingService.js';
import { PreliminaryCloudPricingService } from './PreliminaryCloudPricingService.js';

const databases: CloudCatalogDatabase[] = [];

function createCatalog(): CloudCatalogDatabase {
  const catalog = new CloudCatalogDatabase({ path: ':memory:' });
  databases.push(catalog);
  return catalog;
}

afterEach(() => {
  databases.splice(0).forEach((catalog) => catalog.close());
});

describe('PreliminaryCloudPricingService', () => {
  it('uses AWS public price meters for common AWS line items', async () => {
    const catalog = createCatalog();
    catalog.upsertAwsRetailPriceMeters([
      meter({
        serviceName: 'AmazonRDS',
        productName: 'Database Instance',
        skuName: 'db.m7g.xlarge',
        meterName: '$ 0.337 per RDS db.m7g.xlarge Single-AZ instance hour (or partial hour) running PostgreSQL',
        unitOfMeasure: 'Hrs',
        unitPrice: 0.337
      }),
      meter({
        serviceName: 'AmazonRDS',
        productName: 'Database Storage',
        skuName: 'General Purpose',
        meterName: '$0.115 per GB-month of provisioned GP2 storage',
        unitOfMeasure: 'GB-Mo',
        unitPrice: 0.115
      }),
      meter({
        serviceName: 'AmazonS3',
        productName: 'Storage',
        skuName: 'Standard',
        meterName: '$0.023 per GB - first 50 TB / month of storage used',
        unitOfMeasure: 'GB-Mo',
        unitPrice: 0.023
      }),
      meter({
        productName: 'Storage',
        skuName: 'General Purpose',
        meterName: '$0.08 per GB-month of General Purpose (gp3) provisioned storage - US East (N. Virginia)',
        unitOfMeasure: 'GB-Mo',
        unitPrice: 0.08
      }),
      meter({
        productName: 'Load Balancer-Application',
        skuName: 'ELB:Balancer',
        meterName: '$0.0225 per Application LoadBalancer-hour (or partial hour)',
        unitOfMeasure: 'Hrs',
        unitPrice: 0.0225
      }),
      meter({
        productName: 'Load Balancer-Application',
        skuName: 'ELB:Balancer',
        meterName: '$0.008 per used Application load balancer capacity unit-hour (or partial hour)',
        unitOfMeasure: 'LCU-Hrs',
        unitPrice: 0.008
      }),
      meter({
        serviceName: 'AmazonCloudFront',
        productName: 'Data Transfer',
        skuName: 'Data Transfer',
        meterName: '$0.085 per GB - first 10 TB / month data transfer out',
        unitOfMeasure: 'GB',
        unitPrice: 0.085
      }),
      meter({
        serviceName: 'AmazonCloudFront',
        productName: 'Request',
        skuName: 'Request',
        meterName: '$0.0075 per 10,000 HTTP Requests',
        unitOfMeasure: 'Requests',
        unitPrice: 0.00000075
      }),
      meter({
        serviceName: 'AmazonElastiCache',
        productName: 'Cache Instance',
        skuName: 'cache.r7g.large',
        meterName: '$0.219 per Memory optimized r7g.large node hour running Redis',
        unitOfMeasure: 'Hrs',
        unitPrice: 0.219
      }),
      meter({
        serviceName: 'AWSQueueService',
        productName: 'API Request',
        skuName: 'SQS-APIRequest-Tier1',
        meterName: '$0.40 per million Amazon SQS standard requests in Tier1 in US East (N Virginia)',
        unitOfMeasure: 'Requests',
        unitPrice: 0.0000004
      }),
      meter({
        serviceName: 'AmazonCloudWatch',
        productName: 'Data Payload',
        skuName: 'Ingested Logs',
        meterName: '$0.50 per GB custom log data ingested in Standard log class - US East (Northern Virginia)',
        unitOfMeasure: 'GB',
        unitPrice: 0.5
      }),
      meter({
        serviceName: 'AWSDataTransfer',
        productName: 'Data Transfer',
        skuName: 'Data Transfer',
        meterName: '$0.090 per GB - first 10 TB / month data transfer out beyond the global free tier',
        unitOfMeasure: 'GB',
        unitPrice: 0.09
      }),
      meter({
        serviceName: 'AWSLambda',
        productName: 'Serverless',
        skuName: 'AWS-Lambda-Requests',
        meterName: 'AWS Lambda - Total Requests - US East (Northern Virginia)',
        unitOfMeasure: 'Requests',
        unitPrice: 0.0000002
      }),
      meter({
        serviceName: 'AWSLambda',
        productName: 'Serverless',
        skuName: 'AWS-Lambda-Duration',
        meterName: 'AWS Lambda - Total Compute - US East (Northern Virginia)-Tier-1',
        unitOfMeasure: 'Lambda-GB-Second',
        unitPrice: 0.0000166667
      })
    ]);
    const service = new PreliminaryCloudPricingService(new AwsPricingService(catalog));
    const request: NormalizedEstimateRequest = {
      provider: 'aws',
      requirements: {
        region: {
          raw: 'US East',
          normalized: 'eastus',
          providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
          confidence: 'high'
        },
        components: [
          {
            id: 'db-1',
            type: 'database',
            name: 'PostgreSQL database',
            providerServiceHint: { azure: 'Azure Database for PostgreSQL', aws: 'Amazon RDS for PostgreSQL', gcp: 'Cloud SQL for PostgreSQL' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: 'Managed PostgreSQL database with 4 vCPU and 500GB SSD storage',
            engine: 'postgresql',
            managed: true,
            vcpu: 4,
            memoryGb: 16,
            storageGb: 500,
            storageType: 'ssd',
            highAvailability: false
          },
          {
            id: 's3-1',
            type: 'object_storage',
            name: 'Object storage',
            providerServiceHint: { azure: 'Azure Blob Storage', aws: 'Amazon S3', gcp: 'Cloud Storage' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: '500 GB object storage',
            dataStoredGb: 500,
            accessTier: 'standard',
            redundancy: 'regional'
          },
          {
            id: 'disk-1',
            type: 'block_storage',
            name: 'Application disks',
            providerServiceHint: { azure: 'Azure Managed Disks', aws: 'Amazon EBS', gcp: 'Persistent Disk' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: 'Two 100 GB standard SSD disks',
            diskCount: 2,
            diskSizeGb: 100,
            diskTier: 'standard-ssd'
          },
          {
            id: 'lb-1',
            type: 'load_balancer',
            name: 'Public application load balancer',
            providerServiceHint: { azure: 'Azure Application Gateway', aws: 'Application Load Balancer', gcp: 'Cloud Load Balancing' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: 'HTTP/S public load balancer',
            target: 'web tier',
            scheme: 'http_s',
            loadBalancerCount: 1,
            capacityUnits: 1,
            monthlyHours: 730
          },
          {
            id: 'cdn-1',
            type: 'cdn',
            name: 'CDN',
            providerServiceHint: { azure: 'Azure CDN', aws: 'Amazon CloudFront', gcp: 'Cloud CDN' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: '1 TB CDN transfer with one million requests',
            purpose: 'static assets',
            dataTransferGb: 1024,
            usage: 'static assets',
            requestCount: 1_000_000
          },
          {
            id: 'cache-1',
            type: 'cache',
            name: 'Redis cache',
            providerServiceHint: { azure: 'Azure Cache for Redis', aws: 'Amazon ElastiCache for Redis', gcp: 'Memorystore for Redis' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: 'Production Redis cache with 2 GB memory',
            engine: 'redis',
            memoryGb: 2,
            tier: 'production'
          },
          {
            id: 'queue-1',
            type: 'queue',
            name: 'Message queue',
            providerServiceHint: { azure: 'Azure Service Bus', aws: 'Amazon SQS', gcp: 'Pub/Sub' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: '10 million standard queue messages',
            messageVolume: 10_000_000,
            tier: 'standard'
          },
          {
            id: 'monitoring-1',
            type: 'monitoring',
            name: 'Logs',
            providerServiceHint: { azure: 'Azure Monitor / Log Analytics', aws: 'Amazon CloudWatch', gcp: 'Cloud Monitoring' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: '200 GB log ingestion',
            logIngestionGb: 200,
            retentionDays: 30
          },
          {
            id: 'network-1',
            type: 'network',
            name: 'Internet egress',
            providerServiceHint: { azure: 'Azure Bandwidth', aws: 'AWS Data Transfer', gcp: 'Network Data Transfer' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: '500 GB internet egress',
            monthlyEgressGb: 500
          },
          {
            id: 'lambda-1',
            type: 'serverless',
            name: 'Lambda functions',
            providerServiceHint: { azure: 'Azure Functions', aws: 'AWS Lambda', gcp: 'Cloud Functions' },
            pricingStatus: 'not_implemented',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: '1 million Lambda requests and 500000 GB-seconds',
            requestCount: 1_000_000,
            memoryGbSeconds: 500_000
          }
        ],
        globalAssumptions: [],
        clarifyingQuestions: [],
        extractionMethod: 'rule-based-fallback'
      }
    };

    const result = await service.estimateNormalized(request);

    expect(result.totalMonthlyCost).toBe(758.47);
    expect(result.calculatedLineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceName: 'Amazon RDS for PostgreSQL',
          unitPrice: 0.337,
          monthlyCost: 246.01,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'Amazon RDS for PostgreSQL',
          unitPrice: 0.115,
          monthlyCost: 57.5,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'Amazon S3',
          unitPrice: 0.023,
          monthlyCost: 11.5,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'Amazon EBS',
          unitPrice: 0.08,
          monthlyCost: 16,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'Application Load Balancer',
          unitPrice: 0.0225,
          monthlyCost: 16.43,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'Application Load Balancer',
          unitPrice: 0.008,
          monthlyCost: 5.84,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'Amazon CloudFront',
          unitPrice: 0.085,
          monthlyCost: 87.04,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'Amazon CloudFront',
          unitPrice: 0.00000075,
          monthlyCost: 0.75,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'Amazon ElastiCache for Redis',
          unitPrice: 0.219,
          monthlyCost: 159.87,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'Amazon SQS',
          unitPrice: 0.0000004,
          monthlyCost: 4,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'Amazon CloudWatch',
          unitPrice: 0.5,
          monthlyCost: 100,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'AWS Data Transfer',
          unitPrice: 0.09,
          monthlyCost: 45,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'AWS Lambda',
          unitPrice: 0.0000002,
          monthlyCost: 0.2,
          pricingSource: 'aws-public-price-list'
        }),
        expect.objectContaining({
          serviceName: 'AWS Lambda',
          unitPrice: 0.0000166667,
          monthlyCost: 8.33,
          pricingSource: 'aws-public-price-list'
        })
      ])
    );
  });

  it('calculates GCP Pub/Sub and Cloud Run pricing for GCP requirements', async () => {
    const service = new PreliminaryCloudPricingService();
    const request: NormalizedEstimateRequest = {
      provider: 'gcp',
      requirements: {
        region: {
          raw: 'us-central1',
          normalized: 'us-central1',
          providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-central1' },
          confidence: 'high'
        },
        components: [
          {
            id: 'pubsub-1',
            type: 'queue',
            name: 'Pub/Sub queue',
            providerServiceHint: { azure: 'Service Bus', aws: 'SQS', gcp: 'Pub/Sub' },
            pricingStatus: 'supported',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: '10 million messages',
            messageVolume: 10_000_000
          },
          {
            id: 'run-1',
            type: 'serverless',
            name: 'Cloud Run service',
            providerServiceHint: { azure: 'Functions', aws: 'Lambda', gcp: 'Cloud Run' },
            pricingStatus: 'supported',
            confidence: 'high',
            missingFields: [],
            assumptions: [],
            rawText: '1 million Cloud Run requests',
            requestCount: 1_000_000
          }
        ],
        globalAssumptions: [],
        clarifyingQuestions: [],
        extractionMethod: 'rule-based-fallback'
      }
    };

    const result = await service.estimateNormalized(request);

    expect(result.provider).toBe('gcp');
    expect(result.calculatedLineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceName: 'Pub/Sub',
          monthlyCost: 40
        }),
        expect.objectContaining({
          serviceName: 'Cloud Run'
        })
      ])
    );
  });
});

function meter(input: {
  serviceName?: string;
  productName: string;
  skuName: string;
  meterName: string;
  unitOfMeasure: string;
  unitPrice: number;
}): AwsRetailPriceMeterInput {
  const serviceName = input.serviceName ?? 'AmazonEC2';
  return {
    priceKey: `${serviceName}:us-east-1:${input.productName}:${input.skuName}:${input.meterName}`,
    serviceName,
    serviceFamily: input.productName,
    productName: input.productName,
    skuName: input.skuName,
    armSkuName: input.skuName,
    meterId: input.meterName,
    meterName: input.meterName,
    armRegionName: 'us-east-1',
    location: 'US East (N. Virginia)',
    unitOfMeasure: input.unitOfMeasure,
    priceType: 'OnDemand',
    currencyCode: 'USD',
    retailPrice: input.unitPrice,
    unitPrice: input.unitPrice,
    tierMinimumUnits: 0,
    raw: { meterName: input.meterName }
  };
}
