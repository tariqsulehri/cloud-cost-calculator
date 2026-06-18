import { PostgresPricingCatalogRepository } from '../database/PostgresPricingCatalogRepository.js';
import type { RetailPriceMeter } from '../database/CloudCatalogDatabase.js';
import type { Confidence } from '../types/estimate.types.js';

export interface GcpPublicPriceResult {
  serviceName: string;
  skuName: string;
  meterName: string;
  unit: string;
  unitPrice: number;
  assumption: string;
  pricingSource: 'gcp-cloud-billing-pricing-api';
  confidence: Confidence;
  rawProductName: string | null;
  rawSkuName: string | null;
  rawMeterName: string | null;
  rawArmRegionName: string | null;
}

interface GcpPriceCatalog {
  listRetailPriceMeters(filters?: {
    provider?: 'gcp';
    serviceName?: string;
    serviceCode?: string;
    region?: string;
    query?: string;
    limit?: number;
  }): Promise<RetailPriceMeter[]>;
}

export class GcpPricingService {
  constructor(private readonly catalog: GcpPriceCatalog = new PostgresPricingCatalogRepository()) {}

  async getComputeEngineShapeHourlyPrice(input: { region: string; vcpu: number; memoryGb: number; family?: string }): Promise<GcpPublicPriceResult | null> {
    const family = input.family ?? this.familyForShape(input.vcpu);
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'gcp',
      serviceName: 'Compute Engine',
      region: input.region,
      limit: 5000
    });

    const candidates = meters
      .filter((meter) => meter.currencyCode === 'USD')
      .filter((meter) => meter.unitPrice > 0)
      .filter((meter) => this.isDefaultConsumption(meter))
      .filter((meter) => this.isHourly(meter))
      .filter((meter) => !this.excludedCloudSqlPostgresMeter(meter));

    const core = this.findComputeMeter(candidates, family, 'core');
    const ram = this.findComputeMeter(candidates, family, 'ram');
    if (!core || !ram) {
      return null;
    }

    const unitPrice = core.meter.unitPrice * input.vcpu + ram.meter.unitPrice * input.memoryGb;
    return {
      serviceName: 'Compute Engine',
      skuName: `${family.toUpperCase()} ${input.vcpu} vCPU / ${input.memoryGb} GB planning shape`,
      meterName: 'Instance core and RAM hour',
      unit: '1 Hour',
      unitPrice,
      assumption: `Matched GCP Cloud Billing public Compute Engine ${family.toUpperCase()} core and RAM hourly meters in ${input.region}. Calculation combines ${input.vcpu} vCPU and ${input.memoryGb} GB RAM.`,
      pricingSource: 'gcp-cloud-billing-pricing-api',
      confidence: core.confidence === 'high' && ram.confidence === 'high' ? 'high' : 'medium',
      rawProductName: [core.meter.productName, ram.meter.productName].filter(Boolean).join(' / ') || null,
      rawSkuName: [core.meter.skuName, ram.meter.skuName].filter(Boolean).join(' / ') || null,
      rawMeterName: [core.meter.meterName, ram.meter.meterName].filter(Boolean).join(' / ') || null,
      rawArmRegionName: input.region
    };
  }

  async getCloudStorageCapacityPrice(input: { region: string; accessTier?: string | null }): Promise<GcpPublicPriceResult | null> {
    const accessTier = (input.accessTier ?? 'standard').toLowerCase();
    const tierName = accessTier.includes('archive') ? 'Archive' : accessTier.includes('coldline') ? 'Coldline' : accessTier.includes('nearline') ? 'Nearline' : 'Standard';
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'gcp',
      serviceName: 'Cloud Storage',
      region: input.region,
      limit: 5000
    });
    const match = this.bestUsageMeter(
      meters.filter((meter) => {
        const text = this.searchText(meter);
        const skuText = [meter.skuName, meter.meterName].join(' ').toLowerCase();
        return (
          meter.currencyCode === 'USD' &&
          meter.unitPrice >= 0 &&
          text.includes(`${tierName.toLowerCase()} storage`) &&
          !skuText.includes('autoclass') &&
          !skuText.includes('dual-region') &&
          !skuText.includes('multi-region') &&
          !skuText.includes('early delete') &&
          !skuText.includes('operations') &&
          this.unitMatches(meter, ['gibibyte month', 'giby.mo', 'gb-month'])
        );
      })
    );

    if (!match) {
      return null;
    }

    return this.toResult(match, {
      serviceName: 'Cloud Storage',
      skuName: `${tierName} storage`,
      meterName: `${tierName} storage capacity`,
      unit: '1 GB/Month',
      assumption: `Matched GCP Cloud Billing public Cloud Storage ${tierName} capacity meter in ${input.region}. Requests, retrieval, early delete, replication, and transfer are excluded unless separately detected.`
    });
  }

  async getPersistentDiskStoragePrice(input: { region: string; diskTier?: string | null }): Promise<GcpPublicPriceResult | null> {
    const desired = this.persistentDiskMatcher(input.diskTier);
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'gcp',
      serviceName: 'Compute Engine',
      region: input.region,
      limit: 5000
    });
    const match = this.bestScoredMeter(
      meters.filter((meter) => {
        const text = this.searchText(meter);
        return (
          meter.currencyCode === 'USD' &&
          meter.unitPrice >= 0 &&
          this.isDefaultConsumption(meter) &&
          this.unitMatches(meter, ['gibibyte month', 'giby.mo', 'gb-month']) &&
          (text.includes('pd capacity') || (text.includes('persistent disk') && text.includes('capacity'))) &&
          !text.includes('snapshot') &&
          !text.includes('image storage') &&
          !text.includes('commitment') &&
          !text.includes('regional')
        );
      }),
      (meter) => {
        const text = this.searchText(meter);
        let score = 0;
        if (desired.some((needle) => text.includes(needle))) score += 20;
        if (text.includes('balanced')) score += 4;
        if (text.includes('ssd')) score += 2;
        return score;
      }
    );

    if (!match) {
      return null;
    }

    return this.toResult(match, {
      serviceName: 'Persistent Disk',
      skuName: input.diskTier?.trim() || 'Persistent Disk capacity',
      meterName: 'Persistent Disk capacity',
      unit: '1 GB/Month',
      assumption: `Matched GCP Cloud Billing public Persistent Disk capacity meter in ${input.region}. IOPS, throughput add-ons, regional replication, snapshots, and operations are excluded unless separately specified.`
    });
  }

  async getCloudSqlPostgresComputeHourlyPrice(input: { region: string; vcpu: number; memoryGb: number; highAvailability?: boolean | null }): Promise<GcpPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'gcp',
      serviceName: 'Cloud SQL',
      region: input.region,
      limit: 5000
    });
    const candidates = meters
      .filter((meter) => meter.currencyCode === 'USD')
      .filter((meter) => meter.unitPrice > 0)
      .filter((meter) => this.isDefaultConsumption(meter))
      .filter((meter) => this.isHourly(meter));

    const vcpu = this.bestUsageMeter(candidates.filter((meter) => this.isCloudSqlPostgresMeter(meter, ['zonal - vcpu', 'vcpu'])));
    const ram = this.bestUsageMeter(candidates.filter((meter) => this.isCloudSqlPostgresMeter(meter, ['zonal - ram', 'ram'])));
    if (!vcpu || !ram) {
      return null;
    }

    const unitPrice = vcpu.unitPrice * input.vcpu + ram.unitPrice * input.memoryGb;
    return this.compositeResult([vcpu, ram], {
      serviceName: 'Cloud SQL for PostgreSQL',
      skuName: `PostgreSQL ${input.vcpu} vCPU / ${input.memoryGb} GB zonal compute`,
      meterName: 'Cloud SQL PostgreSQL vCPU and RAM hour',
      unit: '1 Hour',
      unitPrice,
      assumption: `Matched GCP Cloud Billing public Cloud SQL for PostgreSQL zonal vCPU and RAM hourly meters in ${input.region}. Calculation combines ${input.vcpu} vCPU and ${input.memoryGb} GB RAM per database node.`
    });
  }

  async getCloudSqlPostgresStoragePrice(input: { region: string }): Promise<GcpPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'gcp',
      serviceName: 'Cloud SQL',
      region: input.region,
      limit: 5000
    });
    const match = this.bestUsageMeter(
      meters.filter((meter) => {
        const text = this.searchText(meter);
        return (
          meter.currencyCode === 'USD' &&
          meter.unitPrice >= 0 &&
          this.isDefaultConsumption(meter) &&
          this.unitMatches(meter, ['gibibyte month', 'giby.mo', 'gb-month']) &&
          text.includes('cloud sql for postgresql') &&
          text.includes('zonal - standard storage') &&
          !this.excludedCloudSqlPostgresMeter(meter)
        );
      })
    );

    if (!match) {
      return null;
    }

    return this.toResult(match, {
      serviceName: 'Cloud SQL for PostgreSQL',
      skuName: 'PostgreSQL standard storage',
      meterName: 'Cloud SQL PostgreSQL standard storage',
      unit: '1 GB/Month',
      assumption: `Matched GCP Cloud Billing public Cloud SQL for PostgreSQL standard storage meter in ${input.region}. Backup overage, HA regional storage, IOPS, replicas, and private networking are excluded.`
    });
  }

  async getMemorystoreRedisCapacityPrice(input: { region: string; memoryGb: number; tier?: string | null }): Promise<GcpPublicPriceResult | null> {
    const production = /production|standard|premium|ha|high availability/i.test(input.tier ?? '');
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'gcp',
      serviceName: 'Cloud Memorystore for Redis',
      region: input.region,
      limit: 5000
    });
    const match = this.bestScoredMeter(
      meters.filter((meter) => {
        const text = this.searchText(meter);
        return (
          meter.currencyCode === 'USD' &&
          meter.unitPrice > 0 &&
          this.isDefaultConsumption(meter) &&
          this.isHourly(meter) &&
          text.includes('redis') &&
          text.includes('capacity') &&
          !text.includes('commitment')
        );
      }),
      (meter) => {
        const text = this.searchText(meter);
        if (production && text.includes('standard node capacity')) return 20;
        if (!production && !text.includes('standard node capacity')) return 20;
        return 0;
      }
    );

    if (!match) {
      return null;
    }

    return this.toResult(match, {
      serviceName: 'Memorystore for Redis',
      skuName: production ? 'Redis standard capacity' : 'Redis basic capacity',
      meterName: 'Redis capacity hour',
      unit: '1 GB Hour',
      assumption: `Matched GCP Cloud Billing public Memorystore for Redis capacity meter in ${input.region}. Calculation uses requested memory as GB-hours. Replicas, persistence, network transfer, and maintenance add-ons are excluded unless separately specified.`
    });
  }

  async getNetworkInternetEgressPrice(input: { region: string }): Promise<GcpPublicPriceResult | null> {
    const meters = [
      ...(await this.catalog.listRetailPriceMeters({
        provider: 'gcp',
        serviceName: 'Networking',
        region: input.region,
        limit: 5000
      })),
      ...(await this.catalog.listRetailPriceMeters({
        provider: 'gcp',
        serviceName: 'Compute Engine',
        region: input.region,
        limit: 5000
      }))
    ];
    const match = this.bestUsageMeter(
      meters.filter((meter) => {
        const text = this.searchText(meter);
        return (
          meter.currencyCode === 'USD' &&
          meter.unitPrice >= 0 &&
          this.isDefaultConsumption(meter) &&
          this.unitMatches(meter, ['gibibyte', 'giby', 'gb']) &&
          text.includes('network internet data transfer out') &&
          text.includes('gce') &&
          !text.includes('inter-region') &&
          !text.includes('inter zone') &&
          !text.includes('vpn') &&
          !text.includes('interconnect')
        );
      })
    );

    if (!match) {
      return null;
    }

    return this.toResult(match, {
      serviceName: 'Network Data Transfer',
      skuName: 'Internet data transfer out',
      meterName: 'Network internet data transfer out',
      unit: '1 GB',
      assumption: `Matched GCP Cloud Billing public internet data transfer out meter for ${input.region}. Free tiers, CDN transfer, inter-region transfer, Cloud NAT processing, and destination-specific tiers are excluded unless separately detected.`
    });
  }

  async getCloudCdnCacheDataTransferPrice(input: { region: string }): Promise<GcpPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'gcp',
      serviceName: 'Networking',
      region: input.region,
      limit: 5000
    });
    const match = this.bestScoredMeter(
      meters.filter((meter) => {
        const text = this.searchText(meter);
        return (
          meter.currencyCode === 'USD' &&
          meter.unitPrice >= 0 &&
          this.isDefaultConsumption(meter) &&
          this.unitMatches(meter, ['gibibyte', 'giby', 'gb']) &&
          text.includes('cloud cdn traffic cache data transfer')
        );
      }),
      (meter) => {
        const text = this.searchText(meter);
        let score = 0;
        if (text.includes('north america')) score += 30;
        if (text.includes('americas')) score += 20;
        if (text.includes('china')) score -= 50;
        if (text.includes('other')) score -= 10;
        return score;
      }
    );

    if (!match) {
      return null;
    }

    return this.toResult(match, {
      serviceName: 'Cloud CDN',
      skuName: 'Cache data transfer',
      meterName: 'Cloud CDN cache data transfer',
      unit: '1 GB',
      assumption: `Matched GCP Cloud Billing public Cloud CDN cache data transfer meter for ${input.region}. Cache fill, requests, invalidations, origin egress, and security add-ons are excluded unless separately detected.`
    });
  }

  async getCloudLoadBalancerForwardingRulePrice(input: { region: string; scheme: 'http_s' | 'tcp' }): Promise<GcpPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'gcp',
      serviceName: 'Networking',
      region: input.region,
      limit: 5000
    });
    const match = this.bestUsageMeter(
      meters.filter((meter) => {
        const text = this.searchText(meter);
        return meter.currencyCode === 'USD' && meter.unitPrice >= 0 && this.isDefaultConsumption(meter) && this.isHourly(meter) && text.includes('forwarding rule minimum');
      })
    );

    if (!match) {
      return null;
    }

    return this.toResult(match, {
      serviceName: 'Cloud Load Balancing',
      skuName: input.scheme === 'http_s' ? 'External Application Load Balancer' : 'Network Load Balancer',
      meterName: 'Forwarding rule minimum',
      unit: '1 Hour',
      assumption: `Matched GCP Cloud Billing public Cloud Load Balancing forwarding-rule hourly meter in ${input.region}. Data processing, proxy instance capacity, SSL policies, certificates, and internet egress are excluded unless separately detected.`
    });
  }

  async getCloudLoggingStoragePrice(): Promise<GcpPublicPriceResult | null> {
    const meters = await this.catalog.listRetailPriceMeters({
      provider: 'gcp',
      serviceName: 'Cloud Logging',
      limit: 5000
    });
    const match = this.bestUsageMeter(
      meters.filter((meter) => {
        const text = this.searchText(meter);
        return meter.currencyCode === 'USD' && meter.unitPrice >= 0 && text.includes('log storage cost') && this.unitMatches(meter, ['gibibyte', 'giby', 'gb']);
      })
    );

    if (!match) {
      return null;
    }

    return this.toResult(match, {
      serviceName: 'Cloud Logging',
      skuName: 'Log storage',
      meterName: 'Log storage cost',
      unit: '1 GB',
      assumption: 'Matched GCP Cloud Billing public Cloud Logging log storage meter. Retention, routing, metrics, and included allowances are excluded unless separately detected.'
    });
  }

  private findComputeMeter(
    meters: RetailPriceMeter[],
    family: string,
    kind: 'core' | 'ram'
  ): { meter: RetailPriceMeter; confidence: Confidence } | null {
    const normalizedFamily = family.toLowerCase();
    const kindMatchers =
      kind === 'core'
        ? [(text: string) => /\bcore\b/.test(text), (text: string) => /\bcpu\b/.test(text)]
        : [(text: string) => /\bram\b/.test(text), (text: string) => /\bmemory\b/.test(text)];

    const exact = this.bestMeter(
      meters.filter((meter) => {
        const text = this.searchText(meter);
        return text.includes(normalizedFamily) && kindMatchers.some((matches) => matches(text)) && !this.excludedComputeMeter(text);
      })
    );
    if (exact) {
      return { meter: exact, confidence: 'high' };
    }

    const generic = this.bestMeter(
      meters.filter((meter) => {
        const text = this.searchText(meter);
        return kindMatchers.some((matches) => matches(text)) && !this.excludedComputeMeter(text);
      })
    );
    return generic ? { meter: generic, confidence: 'medium' } : null;
  }

  private toResult(
    meter: RetailPriceMeter,
    input: {
      serviceName: string;
      skuName: string;
      meterName: string;
      unit: string;
      assumption: string;
    }
  ): GcpPublicPriceResult {
    return {
      serviceName: input.serviceName,
      skuName: input.skuName,
      meterName: input.meterName,
      unit: input.unit,
      unitPrice: meter.unitPrice,
      assumption: input.assumption,
      pricingSource: 'gcp-cloud-billing-pricing-api',
      confidence: 'high',
      rawProductName: meter.productName,
      rawSkuName: meter.skuName,
      rawMeterName: meter.meterName,
      rawArmRegionName: meter.armRegionName
    };
  }

  private compositeResult(
    meters: RetailPriceMeter[],
    input: {
      serviceName: string;
      skuName: string;
      meterName: string;
      unit: string;
      unitPrice: number;
      assumption: string;
    }
  ): GcpPublicPriceResult {
    return {
      serviceName: input.serviceName,
      skuName: input.skuName,
      meterName: input.meterName,
      unit: input.unit,
      unitPrice: input.unitPrice,
      assumption: input.assumption,
      pricingSource: 'gcp-cloud-billing-pricing-api',
      confidence: 'high',
      rawProductName: meters.map((meter) => meter.productName).filter(Boolean).join(' / ') || null,
      rawSkuName: meters.map((meter) => meter.skuName).filter(Boolean).join(' / ') || null,
      rawMeterName: meters.map((meter) => meter.meterName).filter(Boolean).join(' / ') || null,
      rawArmRegionName: meters.map((meter) => meter.armRegionName).filter(Boolean).join(' / ') || null
    };
  }

  private bestUsageMeter(meters: RetailPriceMeter[]): RetailPriceMeter | null {
    return [...meters].sort((a, b) => b.unitPrice - a.unitPrice)[0] ?? null;
  }

  private bestScoredMeter(meters: RetailPriceMeter[], score: (meter: RetailPriceMeter) => number): RetailPriceMeter | null {
    return [...meters].sort((a, b) => score(b) - score(a) || b.unitPrice - a.unitPrice)[0] ?? null;
  }

  private bestMeter(meters: RetailPriceMeter[]): RetailPriceMeter | null {
    return [...meters].sort((a, b) => this.computeMeterScore(b) - this.computeMeterScore(a))[0] ?? null;
  }

  private computeMeterScore(meter: RetailPriceMeter): number {
    const text = this.searchText(meter);
    let score = 0;
    if (/\bn2 instance\b|\be2 instance\b/.test(text)) score += 20;
    if (text.includes('custom')) score -= 5;
    if (text.includes('extended')) score -= 10;
    if (meter.unitPrice > 0) score += 2;
    return score;
  }

  private isDefaultConsumption(meter: RetailPriceMeter): boolean {
    const priceType = (meter.priceType ?? '').toLowerCase();
    return !priceType || priceType === 'default';
  }

  private isHourly(meter: RetailPriceMeter): boolean {
    const unit = meter.unitOfMeasure.toLowerCase();
    return unit.includes('hour') || unit === 'h' || unit.endsWith('.h');
  }

  private unitMatches(meter: RetailPriceMeter, needles: string[]): boolean {
    const unit = meter.unitOfMeasure.toLowerCase();
    return needles.some((needle) => unit.includes(needle));
  }

  private isCloudSqlPostgresMeter(meter: RetailPriceMeter, needles: string[]): boolean {
    const text = this.searchText(meter);
    return text.includes('cloud sql for postgresql') && needles.some((needle) => text.includes(needle));
  }

  private excludedCloudSqlPostgresMeter(meter: RetailPriceMeter): boolean {
    const text = this.searchText(meter);
    return text.includes('fdc trial') || text.includes('free instance') || text.includes('cud') || text.includes('commitment');
  }

  private persistentDiskMatcher(diskTier?: string | null): string[] {
    const normalized = (diskTier ?? '').toLowerCase();
    if (normalized.includes('premium') || normalized.includes('pd-ssd')) {
      return ['ssd backed pd capacity', 'ssd pd capacity'];
    }
    if (normalized.includes('standard') && !normalized.includes('ssd')) {
      return ['storage pd capacity', 'standard pd capacity'];
    }
    return ['balanced pd capacity', 'balanced persistent disk'];
  }

  private excludedComputeMeter(text: string): boolean {
    return (
      text.includes('spot') ||
      text.includes('preemptible') ||
      text.includes('commitment') ||
      text.includes('sole tenancy') ||
      text.includes('premium') ||
      text.includes('licensing') ||
      text.includes('license') ||
      text.includes('ubuntu pro') ||
      text.includes('windows') ||
      text.includes('suspended') ||
      text.includes('vm state')
    );
  }

  private searchText(meter: RetailPriceMeter): string {
    return [meter.productName, meter.skuName, meter.meterName, meter.unitOfMeasure].join(' ').toLowerCase();
  }

  private familyForShape(vcpu: number): string {
    return vcpu <= 2 ? 'e2' : 'n2';
  }
}
