import { PricingCatalogService } from './PricingCatalogService.js';
import type { AzurePriceRecord } from '../types/azure.types.js';
import type { AzureVmPriceLookupInput, AzureVmPriceResult, Confidence } from '../types/estimate.types.js';

export interface AzureMeterPriceTier {
  tierMinimumUnits: number;
  unitPrice: number;
}

export interface AzureMeterPriceResult {
  serviceName: string;
  skuName: string;
  meterName: string;
  unit: string;
  unitPrice: number;
  tiers: AzureMeterPriceTier[];
  assumption: string;
  pricingSource: 'azure-retail-prices-api' | 'fallback';
  confidence: Confidence;
  rawProductName: string | null;
  rawSkuName: string | null;
  rawMeterName: string | null;
  rawArmRegionName: string | null;
}

export class AzurePricingService {
  constructor(private readonly pricingCatalog = new PricingCatalogService()) {}

  async getVirtualMachineHourlyPrice(input: AzureVmPriceLookupInput): Promise<AzureVmPriceResult> {
    const armSku = toAzureArmSku(input.instanceSku);
    const items = await this.pricingCatalog.findPrices({
      serviceName: 'Virtual Machines',
      armRegionName: input.region,
      armSkuName: armSku,
      priceType: 'Consumption',
      currencyCode: 'USD'
    });
    const candidates = items
      .filter((item) => item.currencyCode === 'USD')
      .filter((item) => item.armRegionName === input.region)
      .filter((item) => (item.serviceName ?? '').toLowerCase() === 'virtual machines')
      .filter((item) => this.itemPrice(item) > 0)
      .filter((item) => this.isHourlyConsumption(item))
      .filter((item) => !this.isExcludedVmMeter(item));

    const match = this.findBestVmMatch(candidates, input.instanceSku);

    if (!match) {
      return this.fallback(input.instanceSku, `Azure Retail Prices API did not return a matching Linux pay-as-you-go VM hourly price for ${input.instanceSku} in ${input.region}. Manual review is required.`);
    }

    const confidence: Confidence = match.kind === 'exact' ? 'high' : 'medium';
    return {
      serviceName: 'Virtual Machines',
      skuName: input.instanceSku,
      meterName: match.item.meterName ?? input.instanceSku,
      unit: match.item.unitOfMeasure ?? '1 Hour',
      unitPrice: this.itemPrice(match.item),
      assumption:
        match.kind === 'exact'
          ? `Matched Azure Retail Prices API pay-as-you-go Linux VM hourly price for ${input.instanceSku} in ${input.region}.`
          : `Used a similar Azure Retail Prices API VM meter for ${input.instanceSku} in ${input.region}; verify SKU mapping against Azure Calculator before production use.`,
      pricingSource: 'azure-retail-prices-api',
      confidence,
      rawProductName: match.item.productName ?? null,
      rawSkuName: match.item.skuName ?? match.item.armSkuName ?? null,
      rawMeterName: match.item.meterName ?? null,
      rawArmRegionName: match.item.armRegionName ?? null
    };
  }

  async getBlobStorageCapacityPrice(input: { region: string; accessTier: string; redundancy: string }): Promise<AzureMeterPriceResult> {
    const accessTier = this.titleCase(input.accessTier);
    const redundancy = this.normalizeRedundancy(input.redundancy);
    const skuName = `${accessTier} ${redundancy}`;
    const meterName = `${accessTier} ${redundancy} Data Stored`;
    const items = await this.pricingCatalog.findPrices({
      serviceName: 'Storage',
      armRegionName: input.region,
      productName: 'General Block Blob v2',
      skuName,
      meterName,
      priceType: 'Consumption',
      currencyCode: 'USD'
    });
    const candidates = items
      .filter((item) => item.currencyCode === 'USD')
      .filter((item) => item.armRegionName === input.region)
      .filter((item) => item.productName === 'General Block Blob v2')
      .filter((item) => item.skuName === skuName)
      .filter((item) => item.meterName === meterName)
      .filter((item) => item.unitOfMeasure === '1 GB/Month')
      .filter((item) => (item.type ?? '').toLowerCase() === 'consumption')
      .filter((item) => this.itemPrice(item) >= 0);

    if (candidates.length === 0) {
      return this.meterFallback(
        'Azure Blob Storage',
        skuName,
        meterName,
        '1 GB/Month',
        `Azure Retail Prices API did not return a Blob Storage capacity price for ${skuName} in ${input.region}. Manual review is required.`
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Blob Storage',
      skuName,
      meterName,
      records: candidates,
      assumption: `Matched Azure Retail Prices API Blob Storage capacity meter for ${skuName} in ${input.region}.`
    });
  }

  async getInternetEgressPrice(input: { region: string }): Promise<AzureMeterPriceResult> {
    const items = await this.pricingCatalog.findPrices({
      serviceName: 'Bandwidth',
      armRegionName: input.region,
      productName: 'Rtn Preference: MGN',
      skuName: 'Standard',
      meterName: 'Standard Data Transfer Out',
      priceType: 'Consumption',
      currencyCode: 'USD'
    });
    const candidates = items
      .filter((item) => item.currencyCode === 'USD')
      .filter((item) => item.armRegionName === input.region)
      .filter((item) => item.productName === 'Rtn Preference: MGN')
      .filter((item) => item.skuName === 'Standard')
      .filter((item) => item.meterName === 'Standard Data Transfer Out')
      .filter((item) => item.unitOfMeasure === '1 GB')
      .filter((item) => (item.type ?? '').toLowerCase() === 'consumption')
      .filter((item) => this.itemPrice(item) >= 0);

    if (candidates.length === 0) {
      return this.meterFallback(
        'Azure Bandwidth',
        'Standard',
        'Standard Data Transfer Out',
        '1 GB',
        `Azure Retail Prices API did not return an internet egress price for ${input.region}. Manual review is required.`
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Bandwidth',
      skuName: 'Standard',
      meterName: 'Standard Data Transfer Out',
      records: candidates,
      assumption: `Matched Azure Retail Prices API standard internet data transfer out meter for ${input.region}.`
    });
  }

  async getRedisCacheHourlyPrice(input: { region: string; memoryGb: number; tier: string }): Promise<AzureMeterPriceResult> {
    const skuName = this.redisSkuFor(input.memoryGb, input.tier);
    const tier = input.tier.trim().toLowerCase();
    const displayTier = tier === 'basic' ? 'Basic' : tier === 'premium' ? 'Premium' : 'Standard';
    const productName = tier === 'basic' ? 'Azure Redis Cache Basic' : tier === 'premium' ? 'Azure Redis Cache Premium' : 'Azure Redis Cache Standard';
    const meterName = tier === 'basic' ? `${skuName} Cache` : `${skuName} Cache Instance`;
    const items = await this.pricingCatalog.findPrices({
      serviceName: 'Redis Cache',
      armRegionName: input.region,
      productName,
      skuName,
      meterName,
      priceType: 'Consumption',
      currencyCode: 'USD'
    });
    const candidates = items
      .filter((item) => item.currencyCode === 'USD')
      .filter((item) => item.armRegionName === input.region)
      .filter((item) => item.productName === productName)
      .filter((item) => item.skuName === skuName)
      .filter((item) => item.meterName === meterName)
      .filter((item) => item.unitOfMeasure === '1 Hour')
      .filter((item) => (item.type ?? '').toLowerCase() === 'consumption')
      .filter((item) => this.itemPrice(item) > 0);

    if (candidates.length === 0) {
      return this.meterFallback(
        'Azure Cache for Redis',
        skuName,
        meterName,
        '1 Hour',
        `Azure Retail Prices API did not return Redis ${tier} ${skuName} hourly pricing in ${input.region}. Manual review is required.`
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Cache for Redis',
      skuName: `${displayTier} ${skuName}`,
      meterName,
      records: candidates,
      assumption: `Matched Azure Retail Prices API Redis ${tier} ${skuName} hourly meter in ${input.region}.`
    });
  }

  async getCdnStandardMicrosoftDataTransferPrice(input: { zone: string }): Promise<AzureMeterPriceResult> {
    const records = await this.findExactMeter({
      region: input.zone,
      serviceName: 'Content Delivery Network',
      productName: 'Azure CDN from Microsoft',
      skuName: 'Standard',
      meterName: 'Standard Data Transfer',
      unitOfMeasure: '1 GB'
    });

    if (records.length === 0) {
      return this.meterFallback(
        'Azure CDN',
        `Standard Microsoft ${input.zone}`,
        'Standard Data Transfer',
        '1 GB',
        `Azure Retail Prices API did not return Azure CDN Standard Microsoft data transfer pricing for ${input.zone}.`
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure CDN',
      skuName: `Standard Microsoft ${input.zone}`,
      meterName: 'Standard Data Transfer',
      records,
      assumption: `Matched Azure Retail Prices API Azure CDN Standard Microsoft data transfer meter for ${input.zone}.`
    });
  }

  async getCdnStandardMicrosoftRequestsPrice(input: { zone: string }): Promise<AzureMeterPriceResult> {
    const records = await this.findExactMeter({
      region: input.zone,
      serviceName: 'Content Delivery Network',
      productName: 'Azure CDN from Microsoft',
      skuName: 'Standard',
      meterName: 'Standard Requests',
      unitOfMeasure: '1M/Month'
    });

    if (records.length === 0) {
      return this.meterFallback(
        'Azure CDN',
        `Standard Microsoft ${input.zone}`,
        'Standard Requests',
        '1M/Month',
        `Azure Retail Prices API did not return Azure CDN Standard Microsoft request pricing for ${input.zone}.`
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure CDN',
      skuName: `Standard Microsoft ${input.zone}`,
      meterName: 'Standard Requests',
      records,
      assumption: `Matched Azure Retail Prices API Azure CDN Standard Microsoft request meter for ${input.zone}.`
    });
  }

  async getApplicationGatewayStandardV2FixedPrice(input: { region: string }): Promise<AzureMeterPriceResult> {
    const records = await this.findExactMeter({
      region: input.region,
      serviceName: 'Application Gateway',
      productName: 'Application Gateway Standard v2',
      skuName: 'Standard',
      meterName: 'Standard Fixed Cost',
      unitOfMeasure: '1/Hour'
    });

    if (records.length === 0) {
      return this.meterFallback(
        'Azure Application Gateway',
        'Standard v2',
        'Standard Fixed Cost',
        '1/Hour',
        `Azure Retail Prices API did not return Application Gateway Standard v2 fixed pricing in ${input.region}.`
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Application Gateway',
      skuName: 'Standard v2',
      meterName: 'Standard Fixed Cost',
      records,
      assumption: `Matched Azure Retail Prices API Application Gateway Standard v2 fixed meter in ${input.region}.`
    });
  }

  async getApplicationGatewayStandardV2CapacityUnitPrice(input: { region: string }): Promise<AzureMeterPriceResult> {
    const records = await this.findExactMeter({
      region: input.region,
      serviceName: 'Application Gateway',
      productName: 'Application Gateway Standard v2',
      skuName: 'Standard',
      meterName: 'Standard Capacity Units',
      unitOfMeasure: '1/Hour'
    });

    if (records.length === 0) {
      return this.meterFallback(
        'Azure Application Gateway',
        'Standard v2',
        'Standard Capacity Units',
        '1/Hour',
        `Azure Retail Prices API did not return Application Gateway Standard v2 capacity unit pricing in ${input.region}.`
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Application Gateway',
      skuName: 'Standard v2',
      meterName: 'Standard Capacity Units',
      records,
      assumption: `Matched Azure Retail Prices API Application Gateway Standard v2 capacity unit meter in ${input.region}.`
    });
  }

  async getLoadBalancerStandardIncludedRulePrice(): Promise<AzureMeterPriceResult> {
    const records = await this.findExactMeter({
      region: 'Global',
      serviceName: 'Load Balancer',
      productName: 'Load Balancer',
      skuName: 'Standard',
      meterName: 'Standard Included LB Rules and Outbound Rules',
      unitOfMeasure: '1 Hour'
    });

    if (records.length === 0) {
      return this.meterFallback(
        'Azure Load Balancer',
        'Standard',
        'Standard Included LB Rules and Outbound Rules',
        '1 Hour',
        'Azure Retail Prices API did not return Standard Load Balancer included rule hourly pricing.'
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Load Balancer',
      skuName: 'Standard',
      meterName: 'Standard Included LB Rules and Outbound Rules',
      records,
      assumption: 'Matched Azure Retail Prices API Standard Load Balancer included rule hourly meter.'
    });
  }

  async getLoadBalancerStandardDataProcessedPrice(): Promise<AzureMeterPriceResult> {
    const records = await this.findExactMeter({
      region: 'Global',
      serviceName: 'Load Balancer',
      productName: 'Load Balancer',
      skuName: 'Standard',
      meterName: 'Standard Data Processed',
      unitOfMeasure: '1 GB'
    });

    if (records.length === 0) {
      return this.meterFallback(
        'Azure Load Balancer',
        'Standard',
        'Standard Data Processed',
        '1 GB',
        'Azure Retail Prices API did not return Standard Load Balancer data processed pricing.'
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Load Balancer',
      skuName: 'Standard',
      meterName: 'Standard Data Processed',
      records,
      assumption: 'Matched Azure Retail Prices API Standard Load Balancer data processed meter.'
    });
  }

  async getManagedDiskMonthlyPrice(input: { region: string; diskTier?: string; diskSizeGb: number }): Promise<AzureMeterPriceResult> {
    const tier = (input.diskTier ?? 'premium').toLowerCase();
    const diskSizeGb = input.diskSizeGb;

    let diskSku = 'P10';
    if (diskSizeGb <= 32) diskSku = 'P4';
    else if (diskSizeGb <= 64) diskSku = 'P6';
    else if (diskSizeGb <= 128) diskSku = 'P10';
    else if (diskSizeGb <= 256) diskSku = 'P15';
    else if (diskSizeGb <= 512) diskSku = 'P20';
    else if (diskSizeGb <= 1024) diskSku = 'P30';
    else if (diskSizeGb <= 2048) diskSku = 'P40';
    else diskSku = 'P50';

    const productName = tier.includes('standard') ? 'Standard SSD Managed Disks' : 'Premium SSD Managed Disks';
    const meterName = `${diskSku} Disk`;

    const records = await this.findExactMeter({
      region: input.region,
      serviceName: 'Storage',
      productName,
      skuName: diskSku,
      meterName,
      unitOfMeasure: '1/Month'
    });

    if (records.length === 0) {
      const unitPrice = tier.includes('standard') ? 0.075 : 0.135;
      return {
        serviceName: 'Azure Managed Disks',
        skuName: `${diskSku} (${diskSizeGb} GB)`,
        meterName,
        unit: '1 GB/Month',
        unitPrice,
        tiers: [{ tierMinimumUnits: 0, unitPrice }],
        assumption: `Estimated Azure ${tier.includes('standard') ? 'Standard' : 'Premium'} SSD disk pricing for ${diskSizeGb} GB in ${input.region}.`,
        pricingSource: 'fallback',
        confidence: 'medium',
        rawProductName: productName,
        rawSkuName: diskSku,
        rawMeterName: meterName,
        rawArmRegionName: input.region
      };
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Managed Disks',
      skuName: `${diskSku} (${diskSizeGb} GB)`,
      meterName,
      records,
      assumption: `Matched Azure Retail Prices API ${productName} meter for ${diskSku} in ${input.region}.`
    });
  }

  async getServiceBusBasePrice(input: { region: string; tier: string }): Promise<AzureMeterPriceResult> {
    const tier = this.titleCase(input.tier);
    const meterName = tier === 'Premium' ? 'Premium Messaging Unit' : `${tier} Base Unit`;
    const unit = tier === 'Premium' ? '1/Hour' : '1/Month';
    const items = await this.pricingCatalog.findPrices({
      serviceName: 'Service Bus',
      armRegionName: input.region,
      productName: 'Service Bus',
      skuName: tier,
      meterName,
      priceType: 'Consumption',
      currencyCode: 'USD'
    });
    const candidates = items
      .filter((item) => item.currencyCode === 'USD')
      .filter((item) => item.armRegionName === input.region)
      .filter((item) => item.productName === 'Service Bus')
      .filter((item) => item.skuName === tier)
      .filter((item) => item.meterName === meterName)
      .filter((item) => item.unitOfMeasure === unit)
      .filter((item) => (item.type ?? '').toLowerCase() === 'consumption')
      .filter((item) => this.itemPrice(item) > 0);

    if (candidates.length === 0) {
      return this.meterFallback('Azure Service Bus', tier, meterName, unit, `Azure Retail Prices API did not return Service Bus ${tier} base pricing in ${input.region}.`);
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Service Bus',
      skuName: tier,
      meterName,
      records: candidates,
      assumption: `Matched Azure Retail Prices API Service Bus ${tier} base meter in ${input.region}.`
    });
  }

  async getServiceBusOperationsPrice(input: { region: string; tier: string }): Promise<AzureMeterPriceResult> {
    const tier = this.titleCase(input.tier);
    const meterName = `${tier} Messaging Operations`;
    const items = await this.pricingCatalog.findPrices({
      serviceName: 'Service Bus',
      armRegionName: input.region,
      productName: 'Service Bus',
      skuName: tier,
      meterName,
      priceType: 'Consumption',
      currencyCode: 'USD'
    });
    const candidates = items
      .filter((item) => item.currencyCode === 'USD')
      .filter((item) => item.armRegionName === input.region)
      .filter((item) => item.productName === 'Service Bus')
      .filter((item) => item.skuName === tier)
      .filter((item) => item.meterName === meterName)
      .filter((item) => item.unitOfMeasure === '1M')
      .filter((item) => (item.type ?? '').toLowerCase() === 'consumption')
      .filter((item) => this.itemPrice(item) >= 0);

    if (candidates.length === 0) {
      return this.meterFallback('Azure Service Bus', tier, meterName, '1M', `Azure Retail Prices API did not return Service Bus ${tier} operations pricing in ${input.region}.`);
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Service Bus',
      skuName: tier,
      meterName,
      records: candidates,
      assumption: `Matched Azure Retail Prices API Service Bus ${tier} messaging operations meter in ${input.region}.`
    });
  }

  async getLogAnalyticsIngestionPrice(input: { region: string }): Promise<AzureMeterPriceResult> {
    const records = await this.findExactMeter({
      region: input.region,
      serviceName: 'Log Analytics',
      productName: 'Log Analytics',
      skuName: 'Analytics Logs',
      meterName: 'Analytics Logs Data Ingestion',
      unitOfMeasure: '1 GB'
    });

    if (records.length === 0) {
      return this.meterFallback(
        'Azure Monitor / Log Analytics',
        'Analytics Logs',
        'Analytics Logs Data Ingestion',
        '1 GB',
        `Azure Retail Prices API did not return Log Analytics ingestion pricing in ${input.region}.`
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Monitor / Log Analytics',
      skuName: 'Analytics Logs',
      meterName: 'Analytics Logs Data Ingestion',
      records,
      assumption: `Matched Azure Retail Prices API Log Analytics ingestion meter in ${input.region}.`
    });
  }

  async getLogAnalyticsRetentionPrice(input: { region: string }): Promise<AzureMeterPriceResult> {
    const records = await this.findExactMeter({
      region: input.region,
      serviceName: 'Log Analytics',
      productName: 'Log Analytics',
      skuName: 'Analytics Logs',
      meterName: 'Analytics Logs Data Retention',
      unitOfMeasure: '1 GB/Month'
    });

    if (records.length === 0) {
      return this.meterFallback(
        'Azure Monitor / Log Analytics',
        'Analytics Logs',
        'Analytics Logs Data Retention',
        '1 GB/Month',
        `Azure Retail Prices API did not return Log Analytics retention pricing in ${input.region}.`
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Monitor / Log Analytics',
      skuName: 'Analytics Logs',
      meterName: 'Analytics Logs Data Retention',
      records,
      assumption: `Matched Azure Retail Prices API Log Analytics retention meter in ${input.region}.`
    });
  }

  async getPostgresFlexibleServerComputePrice(input: { region: string; vcpu: number }): Promise<AzureMeterPriceResult> {
    const skuName = `${input.vcpu} vCore`;
    const armSkuName = `Standard_D${input.vcpu}ds_v5`;
    const records = await this.findExactMeter({
      region: input.region,
      serviceName: 'Azure Database for PostgreSQL',
      productName: 'Azure Database for PostgreSQL Flexible Server General Purpose Ddsv5 Series Compute',
      skuName,
      meterName: 'vCore',
      unitOfMeasure: '1 Hour',
      armSkuName
    });

    if (records.length === 0) {
      return this.meterFallback(
        'Azure Database for PostgreSQL Flexible Server',
        armSkuName,
        'vCore',
        '1 Hour',
        `Azure Retail Prices API did not return PostgreSQL Flexible Server General Purpose ${armSkuName} compute pricing in ${input.region}.`
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Database for PostgreSQL Flexible Server',
      skuName: `${armSkuName} General Purpose`,
      meterName: 'vCore',
      records,
      assumption: `Matched Azure Retail Prices API PostgreSQL Flexible Server General Purpose ${armSkuName} compute meter in ${input.region}.`
    });
  }

  async getPostgresFlexibleServerStoragePrice(input: { region: string }): Promise<AzureMeterPriceResult> {
    const records = await this.findExactMeter({
      region: input.region,
      serviceName: 'Azure Database for PostgreSQL',
      productName: 'Az DB for PostgreSQL Flexible Server Storage',
      skuName: 'Storage',
      meterName: 'Storage Data Stored',
      unitOfMeasure: '1 GB/Month'
    });

    if (records.length === 0) {
      return this.meterFallback(
        'Azure Database for PostgreSQL Flexible Server',
        'Storage',
        'Storage Data Stored',
        '1 GB/Month',
        `Azure Retail Prices API did not return PostgreSQL Flexible Server storage pricing in ${input.region}.`
      );
    }

    return this.toMeterPriceResult({
      serviceName: 'Azure Database for PostgreSQL Flexible Server',
      skuName: 'Storage',
      meterName: 'Storage Data Stored',
      records,
      assumption: `Matched Azure Retail Prices API PostgreSQL Flexible Server storage meter in ${input.region}.`
    });
  }

  private findBestVmMatch(items: AzurePriceRecord[], instanceSku: string): { item: AzurePriceRecord; kind: 'exact' | 'similar' } | undefined {
    const normalizedInput = normalizeSku(instanceSku);
    const alternateSku = normalizeSku(toAzureArmSku(instanceSku));

    const exact = items.find((item) => {
      const fields = this.matchableFields(item);
      return fields.some((field) => field === normalizedInput || field === alternateSku);
    });

    if (exact) {
      return { item: exact, kind: 'exact' };
    }

    const similar = items.find((item) => {
      const fields = this.matchableFields(item);
      return fields.some((field) => field.includes(normalizedInput) || field.includes(alternateSku) || normalizedInput.includes(field));
    });

    return similar ? { item: similar, kind: 'similar' } : undefined;
  }

  private matchableFields(item: AzurePriceRecord): string[] {
    return [item.skuName, item.armSkuName, item.productName, item.meterName]
      .filter((value): value is string => Boolean(value))
      .map((value) => normalizeSku(value));
  }

  private isHourlyConsumption(item: AzurePriceRecord): boolean {
    const unit = (item.unitOfMeasure ?? '').toLowerCase();
    const type = (item.type ?? '').toLowerCase();
    return unit === '1 hour' && (!type || type === 'consumption');
  }

  private isExcludedVmMeter(item: AzurePriceRecord): boolean {
    const text = [item.productName, item.skuName, item.meterName, item.armSkuName].join(' ').toLowerCase();
    return (
      text.includes('windows') ||
      text.includes('spot') ||
      text.includes('low priority') ||
      text.includes('low-priority') ||
      text.includes('reservation') ||
      text.includes('reserved')
    );
  }

  private fallback(instanceSku: string, assumption: string): AzureVmPriceResult {
    return {
      serviceName: 'Virtual Machines',
      skuName: instanceSku,
      meterName: 'VM hourly compute',
      unit: '1 Hour',
      unitPrice: 0,
      assumption,
      pricingSource: 'fallback',
      confidence: 'low',
      rawProductName: null,
      rawSkuName: null,
      rawMeterName: null,
      rawArmRegionName: null
    };
  }

  private itemPrice(item: AzurePriceRecord): number {
    return item.retailPrice ?? item.unitPrice ?? 0;
  }

  private async findExactMeter(input: {
    region: string;
    serviceName: string;
    productName: string;
    skuName: string;
    meterName: string;
    unitOfMeasure: string;
    armSkuName?: string;
  }): Promise<AzurePriceRecord[]> {
    const items = await this.pricingCatalog.findPrices({
      serviceName: input.serviceName,
      armRegionName: input.region,
      productName: input.productName,
      skuName: input.skuName,
      meterName: input.meterName,
      priceType: 'Consumption',
      currencyCode: 'USD'
    });

    return items
      .filter((item) => item.currencyCode === 'USD')
      .filter((item) => item.armRegionName === input.region)
      .filter((item) => item.serviceName === input.serviceName)
      .filter((item) => item.productName === input.productName)
      .filter((item) => item.skuName === input.skuName)
      .filter((item) => item.meterName === input.meterName)
      .filter((item) => item.unitOfMeasure === input.unitOfMeasure)
      .filter((item) => !input.armSkuName || item.armSkuName === input.armSkuName)
      .filter((item) => (item.type ?? '').toLowerCase() === 'consumption')
      .filter((item) => this.itemPrice(item) >= 0);
  }

  private toMeterPriceResult({
    serviceName,
    skuName,
    meterName,
    records,
    assumption
  }: {
    serviceName: string;
    skuName: string;
    meterName: string;
    records: AzurePriceRecord[];
    assumption: string;
  }): AzureMeterPriceResult {
    const sorted = [...records].sort((a, b) => a.tierMinimumUnits - b.tierMinimumUnits);
    const first = sorted[0];
    const representativePrice = sorted.find((item) => this.itemPrice(item) > 0) ?? first;

    return {
      serviceName,
      skuName,
      meterName,
      unit: first.unitOfMeasure,
      unitPrice: this.itemPrice(representativePrice),
      tiers: sorted.map((item) => ({
        tierMinimumUnits: item.tierMinimumUnits,
        unitPrice: this.itemPrice(item)
      })),
      assumption,
      pricingSource: 'azure-retail-prices-api',
      confidence: 'high',
      rawProductName: first.productName ?? null,
      rawSkuName: first.skuName ?? null,
      rawMeterName: first.meterName ?? null,
      rawArmRegionName: first.armRegionName ?? null
    };
  }

  private meterFallback(serviceName: string, skuName: string, meterName: string, unit: string, assumption: string): AzureMeterPriceResult {
    return {
      serviceName,
      skuName,
      meterName,
      unit,
      unitPrice: 0,
      tiers: [],
      assumption,
      pricingSource: 'fallback',
      confidence: 'low',
      rawProductName: null,
      rawSkuName: null,
      rawMeterName: null,
      rawArmRegionName: null
    };
  }

  private titleCase(value: string): string {
    const lower = value.trim().toLowerCase();
    return lower ? lower[0].toUpperCase() + lower.slice(1) : value;
  }

  private normalizeRedundancy(value: string): string {
    return value.trim().toUpperCase().replace(/\s+/g, '-').replace(/RAGRS/g, 'RA-GRS').replace(/RAGZRS/g, 'RA-GZRS');
  }

  private redisSkuFor(memoryGb: number, tier: string): string {
    const normalizedTier = tier.trim().toLowerCase();

    if (normalizedTier === 'premium') {
      if (memoryGb <= 6) return 'P1';
      if (memoryGb <= 13) return 'P2';
      if (memoryGb <= 26) return 'P3';
      if (memoryGb <= 53) return 'P4';
      return 'P5';
    }

    if (memoryGb <= 0.25) return 'C0';
    if (memoryGb <= 1) return 'C1';
    if (memoryGb <= 2.5) return 'C2';
    if (memoryGb <= 6) return 'C3';
    if (memoryGb <= 13) return 'C4';
    if (memoryGb <= 26) return 'C5';
    return 'C6';
  }
}

export function normalizeSku(value: string): string {
  return value.toLowerCase().replace(/[\s_-]/g, '');
}

export function toAzureArmSku(instanceSku: string): string {
  return `Standard_${instanceSku.trim().replace(/\s+/g, '_')}`;
}
