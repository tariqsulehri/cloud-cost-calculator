import axios, { type AxiosInstance } from 'axios';
import { CloudCatalogDatabase, type RetailPriceMeter } from '../database/CloudCatalogDatabase.js';
import { PostgresPricingCatalogRepository } from '../database/PostgresPricingCatalogRepository.js';
import { MemoryCache } from '../utils/cache.js';
import type { Confidence } from '../types/estimate.types.js';

const DEFAULT_BASE_URL = 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws';

interface AwsOfferFile {
  products?: Record<string, AwsProduct>;
  terms?: {
    OnDemand?: Record<string, Record<string, AwsOnDemandTerm>>;
  };
}

interface AwsProduct {
  sku: string;
  productFamily?: string;
  attributes?: Record<string, string | undefined>;
}

interface AwsOnDemandTerm {
  priceDimensions?: Record<string, AwsPriceDimension>;
}

interface AwsPriceDimension {
  unit?: string;
  description?: string;
  pricePerUnit?: {
    USD?: string;
  };
}

export interface AwsEc2PriceLookupInput {
  region: string;
  instanceType: string;
}

export interface AwsPublicPriceResult {
  serviceName: string;
  skuName: string;
  meterName: string;
  unit: string;
  unitPrice: number;
  assumption: string;
  pricingSource: 'aws-public-price-list';
  confidence: Confidence;
  rawProductName: string | null;
  rawSkuName: string | null;
  rawMeterName: string | null;
  rawArmRegionName: string | null;
}

interface RetailPriceMeterReader {
  listRetailPriceMeters(filters?: { provider?: 'aws'; serviceName?: string; region?: string; query?: string; limit?: number }): RetailPriceMeter[] | Promise<RetailPriceMeter[]>;
}

export class AwsPricingService {
  private readonly cache: MemoryCache<AwsOfferFile>;
  private readonly baseUrl: string;

  constructor(
    private readonly catalog: RetailPriceMeterReader = defaultCatalogReader(),
    private readonly http: AxiosInstance = axios.create({ timeout: 7000 }),
    options: { baseUrl?: string; cacheTtlMs?: number } = {}
  ) {
    this.baseUrl = options.baseUrl ?? process.env.AWS_PUBLIC_PRICING_BASE_URL ?? DEFAULT_BASE_URL;
    this.cache = new MemoryCache<AwsOfferFile>(options.cacheTtlMs ?? 1000 * 60 * 60 * 24);
  }

  async getEc2LinuxOnDemandHourlyPrice(input: AwsEc2PriceLookupInput): Promise<AwsPublicPriceResult | null> {
    const catalogPrice = await this.getEc2LinuxOnDemandHourlyPriceFromCatalog(input);
    if (catalogPrice) {
      return catalogPrice;
    }

    const offer = await this.getOfferFile('AmazonEC2', input.region);
    const products = Object.entries(offer.products ?? {});
    const candidates = products
      .map(([sku, product]) => ({ sku, product }))
      .filter(({ product }) => product.productFamily === 'Compute Instance')
      .filter(({ product }) => product.attributes?.instanceType === input.instanceType)
      .filter(({ product }) => product.attributes?.operatingSystem === 'Linux')
      .filter(({ product }) => product.attributes?.tenancy === 'Shared')
      .filter(({ product }) => product.attributes?.preInstalledSw === 'NA')
      .filter(({ product }) => product.attributes?.capacitystatus === 'Used')
      .filter(({ product }) => !product.attributes?.marketoption || product.attributes?.marketoption === 'OnDemand');

    for (const candidate of candidates) {
      const price = this.firstHourlyOnDemandPrice(offer, candidate.sku);
      if (!price) {
        continue;
      }

      return {
        serviceName: 'Amazon EC2',
        skuName: input.instanceType,
        meterName: price.description ?? `${input.instanceType} instance hour`,
        unit: price.unit ?? 'Hrs',
        unitPrice: price.unitPrice,
        assumption: `Matched AWS public on-demand Linux EC2 price for ${input.instanceType} in ${input.region}.`,
        pricingSource: 'aws-public-price-list',
        confidence: 'high',
        rawProductName: 'Amazon Elastic Compute Cloud',
        rawSkuName: candidate.sku,
        rawMeterName: price.description ?? null,
        rawArmRegionName: input.region
      };
    }

    return null;
  }

  async getEbsVolumeStoragePrice(input: { region: string; diskTier?: string | null }): Promise<AwsPublicPriceResult | null> {
    const matcher = this.ebsVolumeMatcher(input.diskTier);
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonEC2',
      region: input.region,
      query: matcher.query,
      limit: 100
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'Storage' &&
        candidate.unitOfMeasure.toLowerCase() === 'gb-mo' &&
        matcher.pattern.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'Amazon EBS',
      skuName: matcher.skuName,
      meter,
      assumption: `Matched synced AWS public EBS ${matcher.skuName} storage price in ${input.region}.`
    });
  }

  async getElasticLoadBalancerHourlyPrice(input: { region: string; scheme: 'http_s' | 'tcp' }): Promise<AwsPublicPriceResult | null> {
    const isApplication = input.scheme === 'http_s';
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonEC2',
      region: input.region,
      query: isApplication ? 'Application LoadBalancer-hour' : 'Network LoadBalancer-hour',
      limit: 100
    });
    const productName = isApplication ? 'Load Balancer-Application' : 'Load Balancer-Network';
    const meter = meters.find(
      (candidate) =>
        candidate.productName === productName &&
        candidate.unitOfMeasure === 'Hrs' &&
        /LoadBalancer-hour/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: isApplication ? 'AWS Application Load Balancer' : 'AWS Network Load Balancer',
      skuName: isApplication ? 'Application Load Balancer' : 'Network Load Balancer',
      meter,
      assumption: `Matched synced AWS public ${isApplication ? 'Application' : 'Network'} Load Balancer hourly price in ${input.region}.`
    });
  }

  async getElasticLoadBalancerCapacityUnitPrice(input: { region: string; scheme: 'http_s' | 'tcp' }): Promise<AwsPublicPriceResult | null> {
    const isApplication = input.scheme === 'http_s';
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonEC2',
      region: input.region,
      query: isApplication ? 'Application load balancer capacity unit-hour' : 'Network load balancer capacity unit-hour',
      limit: 100
    });
    const productName = isApplication ? 'Load Balancer-Application' : 'Load Balancer-Network';
    const meter = meters.find(
      (candidate) =>
        candidate.productName === productName &&
        candidate.unitOfMeasure === 'LCU-Hrs' &&
        /capacity unit-hour/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: isApplication ? 'AWS Application Load Balancer' : 'AWS Network Load Balancer',
      skuName: isApplication ? 'Application Load Balancer LCU' : 'Network Load Balancer LCU',
      meter,
      assumption: `Matched synced AWS public ${isApplication ? 'Application' : 'Network'} Load Balancer capacity unit price in ${input.region}.`
    });
  }

  async getS3StoragePrice(input: { region: string; accessTier?: string | null }): Promise<AwsPublicPriceResult | null> {
    const matcher = this.s3StorageMatcher(input.accessTier);
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonS3',
      region: input.region,
      query: matcher.query,
      limit: 100
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'Storage' &&
        candidate.skuName === matcher.skuName &&
        candidate.unitOfMeasure === 'GB-Mo' &&
        matcher.pattern.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'Amazon S3',
      skuName: matcher.skuName,
      meter,
      assumption: `Matched synced AWS public S3 ${matcher.skuName} storage price in ${input.region}.`
    });
  }

  async getCloudFrontDataTransferOutPrice(): Promise<AwsPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonCloudFront',
      query: 'first 10 TB',
      limit: 100
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'Data Transfer' &&
        candidate.unitOfMeasure === 'GB' &&
        /first 10 TB \/ month data transfer out$/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'Amazon CloudFront',
      skuName: 'CloudFront data transfer out',
      meter,
      assumption: 'Matched synced AWS public CloudFront first-tier data transfer out price.'
    });
  }

  async getCloudFrontHttpRequestPrice(): Promise<AwsPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonCloudFront',
      query: 'HTTP Requests',
      limit: 100
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'Request' &&
        candidate.unitOfMeasure === 'Requests' &&
        /per 10,000 HTTP Requests$/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'Amazon CloudFront',
      skuName: 'CloudFront HTTP requests',
      meter,
      assumption: 'Matched synced AWS public CloudFront HTTP GET/HEAD request price.'
    });
  }

  async getRdsPostgresInstanceHourlyPrice(input: { region: string; instanceType: string; highAvailability: boolean }): Promise<AwsPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonRDS',
      region: input.region,
      query: input.instanceType,
      limit: 100
    });
    const azPattern = input.highAvailability ? /Multi-AZ/i : /Single-AZ/i;
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'Database Instance' &&
        candidate.skuName === input.instanceType &&
        candidate.unitOfMeasure === 'Hrs' &&
        azPattern.test(candidate.meterName) &&
        /running PostgreSQL/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'Amazon RDS for PostgreSQL',
      skuName: `${input.instanceType} ${input.highAvailability ? 'Multi-AZ' : 'Single-AZ'}`,
      meter,
      assumption: `Matched synced AWS public RDS PostgreSQL ${input.highAvailability ? 'Multi-AZ' : 'Single-AZ'} price for ${input.instanceType} in ${input.region}.`
    });
  }

  async getRdsGeneralPurposeStoragePrice(input: { region: string }): Promise<AwsPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonRDS',
      region: input.region,
      query: 'provisioned GP2 storage',
      limit: 100
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'Database Storage' &&
        candidate.skuName === 'General Purpose' &&
        candidate.unitOfMeasure === 'GB-Mo' &&
        /provisioned GP2 storage/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'Amazon RDS for PostgreSQL',
      skuName: 'General Purpose SSD storage',
      meter,
      assumption: `Matched synced AWS public RDS general-purpose storage price in ${input.region}.`
    });
  }

  async getElastiCacheRedisHourlyPrice(input: { region: string; memoryGb: number; tier: string }): Promise<AwsPublicPriceResult | null> {
    const nodeType = this.elasticacheNodeTypeFor(input.memoryGb, input.tier);
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonElastiCache',
      region: input.region,
      query: nodeType,
      limit: 100
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'Cache Instance' &&
        candidate.skuName === nodeType &&
        candidate.unitOfMeasure === 'Hrs' &&
        /running Redis/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'Amazon ElastiCache for Redis',
      skuName: nodeType,
      meter,
      assumption: `Matched synced AWS public ElastiCache Redis node price for ${nodeType} in ${input.region}.`
    });
  }

  async getSqsStandardRequestPrice(input: { region: string }): Promise<AwsPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AWSQueueService',
      region: input.region,
      query: 'standard requests in Tier1',
      limit: 50
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'API Request' &&
        candidate.unitOfMeasure === 'Requests' &&
        /Amazon SQS standard requests in Tier1/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'Amazon SQS',
      skuName: 'Standard requests',
      meter,
      assumption: `Matched synced AWS public SQS standard request price in ${input.region}.`
    });
  }

  async getCloudWatchCustomLogIngestionPrice(input: { region: string }): Promise<AwsPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonCloudWatch',
      region: input.region,
      query: 'custom log data ingested',
      limit: 50
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'Data Payload' &&
        candidate.skuName === 'Ingested Logs' &&
        candidate.unitOfMeasure === 'GB' &&
        /custom log data ingested in Standard log class/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'Amazon CloudWatch',
      skuName: 'Standard log ingestion',
      meter,
      assumption: `Matched synced AWS public CloudWatch standard custom log ingestion price in ${input.region}.`
    });
  }

  async getDataTransferOutToInternetPrice(input: { region: string }): Promise<AwsPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AWSDataTransfer',
      query: 'first 10 TB',
      limit: 100
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'Data Transfer' &&
        candidate.unitOfMeasure === 'GB' &&
        /first 10 TB \/ month data transfer out beyond the global free tier/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'AWS Data Transfer',
      skuName: 'Internet data transfer out',
      meter,
      assumption: `Matched synced AWS public internet data transfer out first-tier price for ${input.region}.`
    });
  }

  async getLambdaDurationPrice(input: { region: string }): Promise<AwsPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AWSLambda',
      region: input.region,
      query: 'AWS-Lambda-Duration',
      limit: 100
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'Serverless' &&
        candidate.skuName === 'AWS-Lambda-Duration' &&
        candidate.unitOfMeasure === 'Lambda-GB-Second' &&
        /Total Compute.*Tier-1/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'AWS Lambda',
      skuName: 'Lambda duration',
      meter,
      assumption: `Matched synced AWS public Lambda x86 duration tier-1 price in ${input.region}.`
    });
  }

  async getLambdaRequestPrice(input: { region: string }): Promise<AwsPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AWSLambda',
      region: input.region,
      query: 'AWS-Lambda-Requests',
      limit: 100
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'Serverless' &&
        candidate.skuName === 'AWS-Lambda-Requests' &&
        candidate.unitOfMeasure === 'Requests' &&
        /Total Requests/i.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return this.publicPriceResult({
      serviceName: 'AWS Lambda',
      skuName: 'Lambda requests',
      meter,
      assumption: `Matched synced AWS public Lambda request price in ${input.region}.`
    });
  }

  private async getEc2LinuxOnDemandHourlyPriceFromCatalog(input: AwsEc2PriceLookupInput): Promise<AwsPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonEC2',
      region: input.region,
      query: input.instanceType,
      limit: 100
    });
    const escapedInstanceType = input.instanceType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactLinuxMeter = new RegExp(`per On Demand Linux ${escapedInstanceType} Instance Hour`, 'i');
    const meter = meters.find(
      (candidate) =>
        candidate.skuName === input.instanceType &&
        candidate.unitOfMeasure === 'Hrs' &&
        exactLinuxMeter.test(candidate.meterName)
    );

    if (!meter) {
      return null;
    }

    return {
      serviceName: 'Amazon EC2',
      skuName: input.instanceType,
      meterName: meter.meterName,
      unit: meter.unitOfMeasure,
      unitPrice: meter.unitPrice,
      assumption: `Matched synced AWS public on-demand Linux EC2 price for ${input.instanceType} in ${input.region}.`,
      pricingSource: 'aws-public-price-list',
      confidence: 'high',
      rawProductName: meter.productName,
      rawSkuName: meter.skuName,
      rawMeterName: meter.meterName,
      rawArmRegionName: meter.armRegionName
    };
  }

  private async getOfferFile(offerCode: string, region: string): Promise<AwsOfferFile> {
    const url = `${this.baseUrl}/${offerCode}/current/${region}/index.json`;
    const cached = this.cache.get(url);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.http.get<AwsOfferFile>(url);
      this.cache.set(url, response.data);
      return response.data;
    } catch (error) {
      console.warn(`AWS public price list request failed: ${url}. ${this.errorSummary(error)}`);
      return {};
    }
  }

  private ebsVolumeMatcher(diskTier?: string | null): { query: string; skuName: string; pattern: RegExp } {
    const normalized = (diskTier ?? '').toLowerCase();
    if (normalized.includes('gp2')) {
      return { query: 'General Purpose SSD (gp2)', skuName: 'General Purpose SSD (gp2)', pattern: /General Purpose SSD \(gp2\).*provisioned storage/i };
    }
    if (normalized.includes('io1')) {
      return { query: 'Provisioned IOPS SSD (io1)', skuName: 'Provisioned IOPS SSD (io1)', pattern: /Provisioned IOPS SSD \(io1\).*provisioned storage/i };
    }
    if (normalized.includes('io2') || normalized.includes('premium')) {
      return { query: 'Provisioned IOPS SSD (io2)', skuName: 'Provisioned IOPS SSD (io2)', pattern: /Provisioned IOPS SSD \(io2\).*provisioned storage/i };
    }
    if (normalized.includes('st1') || normalized.includes('throughput')) {
      return { query: 'Throughput Optimized HDD (st1)', skuName: 'Throughput Optimized HDD (st1)', pattern: /Throughput Optimized HDD \(st1\).*provisioned storage/i };
    }
    if (normalized.includes('sc1') || normalized.includes('cold')) {
      return { query: 'Cold HDD (sc1)', skuName: 'Cold HDD (sc1)', pattern: /Cold HDD \(sc1\).*provisioned storage/i };
    }

    // AWS recommends gp3 as the current general-purpose baseline; use it when the prompt says SSD or leaves the EBS tier vague.
    return { query: 'General Purpose (gp3)', skuName: 'General Purpose SSD (gp3)', pattern: /General Purpose \(gp3\).*provisioned storage/i };
  }

  async getNatGatewayHourlyPrice(input: { region: string }): Promise<AwsPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'aws',
      serviceName: 'AmazonEC2',
      region: input.region,
      query: 'NAT Gateway-hour',
      limit: 50
    });
    const meter = meters.find(
      (candidate) =>
        candidate.productName === 'NAT Gateway' &&
        candidate.unitOfMeasure === 'Hrs' &&
        /NATGateway-hours/i.test(candidate.meterName)
    );

    if (!meter) {
      return {
        serviceName: 'AWS NAT Gateway',
        skuName: 'NAT Gateway Hourly',
        meterName: 'AWS NAT Gateway Hourly Usage',
        unit: 'Hrs',
        unitPrice: 0.045,
        assumption: `AWS public NAT Gateway hourly price ($0.045/hr) in ${input.region}.`,
        pricingSource: 'aws-public-price-list',
        confidence: 'high',
        rawProductName: 'NAT Gateway',
        rawSkuName: 'NATGateway-hours',
        rawMeterName: 'NAT Gateway Hourly Usage',
        rawArmRegionName: input.region
      };
    }

    return this.publicPriceResult({
      serviceName: 'AWS NAT Gateway',
      skuName: 'NAT Gateway Hourly',
      meter,
      assumption: `Matched synced AWS public NAT Gateway hourly price in ${input.region}.`
    });
  }

  private s3StorageMatcher(accessTier?: string | null): { query: string; skuName: string; pattern: RegExp } {
    const normalized = (accessTier ?? '').toLowerCase();
    if (normalized.includes('glacier') || normalized.includes('archive') || normalized.includes('deep')) {
      return {
        query: 'Glacier Deep Archive',
        skuName: 'Glacier Deep Archive',
        pattern: /Glacier Deep Archive/i
      };
    }
    if (normalized.includes('infrequent') || normalized.includes('cool') || normalized.includes('ia')) {
      return {
        query: 'Standard-Infrequent Access',
        skuName: 'Standard - Infrequent Access',
        pattern: /storage used in Standard-Infrequent Access/i
      };
    }

    return {
      query: 'first 50 TB',
      skuName: 'Standard',
      pattern: /first 50 TB \/ month of storage used$/i
    };
  }

  private elasticacheNodeTypeFor(memoryGb: number, tier: string): string {
    const normalizedTier = tier.toLowerCase();
    if (normalizedTier.includes('basic') || normalizedTier.includes('dev')) {
      if (memoryGb <= 0.5) return 'cache.t4g.micro';
      if (memoryGb <= 1.5) return 'cache.t4g.small';
      return 'cache.t4g.medium';
    }

    if (memoryGb <= 6) return 'cache.r7g.large';
    if (memoryGb <= 13) return 'cache.r7g.xlarge';
    if (memoryGb <= 26) return 'cache.r7g.2xlarge';
    if (memoryGb <= 52) return 'cache.r7g.4xlarge';
    return 'cache.r7g.8xlarge';
  }

  private publicPriceResult(input: { serviceName: string; skuName: string; meter: RetailPriceMeter; assumption: string }): AwsPublicPriceResult {
    return {
      serviceName: input.serviceName,
      skuName: input.skuName,
      meterName: input.meter.meterName,
      unit: input.meter.unitOfMeasure,
      unitPrice: input.meter.unitPrice,
      assumption: input.assumption,
      pricingSource: 'aws-public-price-list',
      confidence: 'high',
      rawProductName: input.meter.productName,
      rawSkuName: input.meter.skuName,
      rawMeterName: input.meter.meterName,
      rawArmRegionName: input.meter.armRegionName
    };
  }

  private firstHourlyOnDemandPrice(offer: AwsOfferFile, sku: string): { unitPrice: number; unit?: string; description?: string } | null {
    const terms = Object.values(offer.terms?.OnDemand?.[sku] ?? {});

    for (const term of terms) {
      const dimensions = Object.values(term.priceDimensions ?? {});
      for (const dimension of dimensions) {
        const unitPrice = Number.parseFloat(dimension.pricePerUnit?.USD ?? '');
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
          continue;
        }

        const unit = dimension.unit ?? '';
        if (unit !== 'Hrs' && unit !== 'Hours') {
          continue;
        }

        return {
          unitPrice,
          unit,
          description: dimension.description
        };
      }
    }

    return null;
  }

  private errorSummary(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ? `HTTP ${error.response.status}` : 'network error';
      return `${status}: ${error.message}`;
    }

    return error instanceof Error ? error.message : 'Unknown error';
  }
}

function defaultCatalogReader(): RetailPriceMeterReader {
  if (process.env.NODE_ENV !== 'test' && process.env.DATABASE_URL) {
    return new PostgresPricingCatalogRepository();
  }

  return new CloudCatalogDatabase();
}
