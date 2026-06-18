import { afterEach, describe, expect, it } from 'vitest';
import { CloudCatalogDatabase } from '../database/CloudCatalogDatabase.js';
import type { AwsRetailPriceMeterInput } from '../types/awsPriceList.types.js';
import { AwsPricingService } from './AwsPricingService.js';

const databases: CloudCatalogDatabase[] = [];

function createCatalog(): CloudCatalogDatabase {
  const catalog = new CloudCatalogDatabase({ path: ':memory:' });
  databases.push(catalog);
  return catalog;
}

afterEach(() => {
  databases.splice(0).forEach((catalog) => catalog.close());
});

describe('AwsPricingService', () => {
  it('uses synced AWS public price meters before live price-list fallback', async () => {
    const catalog = createCatalog();
    catalog.upsertAwsRetailPriceMeters([
      meter({
        productName: 'Compute Instance',
        skuName: 'm7i.xlarge',
        meterName: '$0.2016 per On Demand Linux m7i.xlarge Instance Hour',
        unitOfMeasure: 'Hrs',
        unitPrice: 0.2016
      })
    ]);
    const service = new AwsPricingService(catalog);

    const price = await service.getEc2LinuxOnDemandHourlyPrice({
      region: 'us-east-1',
      instanceType: 'm7i.xlarge'
    });

    expect(price).toMatchObject({
      skuName: 'm7i.xlarge',
      unitPrice: 0.2016,
      pricingSource: 'aws-public-price-list',
      assumption: 'Matched synced AWS public on-demand Linux EC2 price for m7i.xlarge in us-east-1.'
    });
  });

  it('matches synced AWS public EBS gp3 storage pricing', async () => {
    const catalog = createCatalog();
    catalog.upsertAwsRetailPriceMeters([
      meter({
        productName: 'Storage',
        skuName: 'General Purpose',
        meterName: '$0.08 per GB-month of General Purpose (gp3) provisioned storage - US East (N. Virginia)',
        unitOfMeasure: 'GB-Mo',
        unitPrice: 0.08
      })
    ]);
    const service = new AwsPricingService(catalog);

    const price = await service.getEbsVolumeStoragePrice({ region: 'us-east-1', diskTier: 'standard-ssd' });

    expect(price).toMatchObject({
      serviceName: 'Amazon EBS',
      skuName: 'General Purpose SSD (gp3)',
      unit: 'GB-Mo',
      unitPrice: 0.08,
      pricingSource: 'aws-public-price-list'
    });
  });

  it('matches synced AWS public application load balancer pricing', async () => {
    const catalog = createCatalog();
    catalog.upsertAwsRetailPriceMeters([
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
      })
    ]);
    const service = new AwsPricingService(catalog);

    const hourlyPrice = await service.getElasticLoadBalancerHourlyPrice({ region: 'us-east-1', scheme: 'http_s' });
    const capacityPrice = await service.getElasticLoadBalancerCapacityUnitPrice({ region: 'us-east-1', scheme: 'http_s' });

    expect(hourlyPrice).toMatchObject({ skuName: 'Application Load Balancer', unitPrice: 0.0225 });
    expect(capacityPrice).toMatchObject({ skuName: 'Application Load Balancer LCU', unitPrice: 0.008 });
  });

  it('matches synced AWS public S3 and CloudFront first-tier meters', async () => {
    const catalog = createCatalog();
    catalog.upsertAwsRetailPriceMeters([
      meter({
        serviceName: 'AmazonS3',
        productName: 'Storage',
        skuName: 'Standard',
        meterName: '$0.023 per GB - first 50 TB / month of storage used',
        unitOfMeasure: 'GB-Mo',
        unitPrice: 0.023
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
      })
    ]);
    const service = new AwsPricingService(catalog);

    await expect(service.getS3StoragePrice({ region: 'us-east-1', accessTier: 'standard' })).resolves.toMatchObject({ skuName: 'Standard', unitPrice: 0.023 });
    await expect(service.getCloudFrontDataTransferOutPrice()).resolves.toMatchObject({ skuName: 'CloudFront data transfer out', unitPrice: 0.085 });
    await expect(service.getCloudFrontHttpRequestPrice()).resolves.toMatchObject({ skuName: 'CloudFront HTTP requests', unitPrice: 0.00000075 });
  });

  it('matches synced AWS public RDS PostgreSQL compute and storage meters', async () => {
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
      })
    ]);
    const service = new AwsPricingService(catalog);

    await expect(service.getRdsPostgresInstanceHourlyPrice({ region: 'us-east-1', instanceType: 'db.m7g.xlarge', highAvailability: false })).resolves.toMatchObject({
      skuName: 'db.m7g.xlarge Single-AZ',
      unitPrice: 0.337
    });
    await expect(service.getRdsGeneralPurposeStoragePrice({ region: 'us-east-1' })).resolves.toMatchObject({
      skuName: 'General Purpose SSD storage',
      unitPrice: 0.115
    });
  });

  it('matches synced AWS public integration, monitoring, egress, cache, and Lambda meters', async () => {
    const catalog = createCatalog();
    catalog.upsertAwsRetailPriceMeters([
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
    const service = new AwsPricingService(catalog);

    await expect(service.getElastiCacheRedisHourlyPrice({ region: 'us-east-1', memoryGb: 2, tier: 'production' })).resolves.toMatchObject({ skuName: 'cache.r7g.large', unitPrice: 0.219 });
    await expect(service.getSqsStandardRequestPrice({ region: 'us-east-1' })).resolves.toMatchObject({ skuName: 'Standard requests', unitPrice: 0.0000004 });
    await expect(service.getCloudWatchCustomLogIngestionPrice({ region: 'us-east-1' })).resolves.toMatchObject({ skuName: 'Standard log ingestion', unitPrice: 0.5 });
    await expect(service.getDataTransferOutToInternetPrice({ region: 'us-east-1' })).resolves.toMatchObject({ skuName: 'Internet data transfer out', unitPrice: 0.09 });
    await expect(service.getLambdaRequestPrice({ region: 'us-east-1' })).resolves.toMatchObject({ skuName: 'Lambda requests', unitPrice: 0.0000002 });
    await expect(service.getLambdaDurationPrice({ region: 'us-east-1' })).resolves.toMatchObject({ skuName: 'Lambda duration', unitPrice: 0.0000166667 });
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
