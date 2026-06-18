import axios, { type AxiosInstance } from 'axios';
import { PostgresPricingCatalogRepository, type RetailPriceMeterInput } from '../database/PostgresPricingCatalogRepository.js';
import type { GcpBillingPrice, GcpBillingService, GcpBillingServiceListResponse, GcpBillingSku, GcpBillingSkuListResponse } from '../types/gcpBilling.types.js';

const DEFAULT_API_URL = 'https://cloudbilling.googleapis.com/v2beta';
const DEFAULT_REGION = 'us-east1';
const DEFAULT_CURRENCY = 'USD';

export interface GcpCatalogSyncOptions {
  serviceName?: string;
  regionCode?: string;
  currencyCode?: string;
  maxSkus?: number;
  pageSize?: number;
  query?: string;
}

export interface GcpCatalogSyncResult {
  syncRunId: number;
  status: 'completed' | 'partial';
  serviceName: string;
  serviceId: string;
  regionCode: string;
  skusRead: number;
  rowsUpserted: number;
}

export interface GcpServiceSyncTarget {
  serviceName: string;
  regionCode: string;
}

export const GCP_PUBLIC_PRICE_SYNC_TARGETS: GcpServiceSyncTarget[] = [
  { serviceName: 'Compute Engine', regionCode: DEFAULT_REGION },
  { serviceName: 'Cloud SQL', regionCode: DEFAULT_REGION },
  { serviceName: 'Cloud Storage', regionCode: DEFAULT_REGION },
  { serviceName: 'Networking', regionCode: DEFAULT_REGION },
  { serviceName: 'Cloud Memorystore for Redis', regionCode: DEFAULT_REGION },
  { serviceName: 'Cloud Pub/Sub', regionCode: DEFAULT_REGION },
  { serviceName: 'Cloud Logging', regionCode: DEFAULT_REGION },
  { serviceName: 'Kubernetes Engine', regionCode: DEFAULT_REGION }
];

interface GcpPriceRepository {
  startSyncRun(input: { providerId: 'gcp'; source: string; serviceCode?: string | null; regionCode?: string | null; metadata?: unknown }): Promise<number>;
  completeSyncRun(id: number, input: { status: 'completed' | 'partial'; rowsRead: number; rowsUpserted: number; metadata?: unknown }): Promise<void>;
  failSyncRun(id: number, error: unknown, input: { rowsRead?: number; rowsUpserted?: number; metadata?: unknown }): Promise<void>;
  upsertRetailPriceMeters(items: RetailPriceMeterInput[]): Promise<number>;
  close?(): Promise<void>;
}

export class GcpCloudBillingCatalogSyncService {
  private readonly apiUrl: string;
  private readonly apiKey: string | null;
  private readonly accessToken: string | null;

  constructor(
    private readonly repository: GcpPriceRepository = new PostgresPricingCatalogRepository(),
    private readonly http: AxiosInstance = axios.create({ timeout: 30_000 }),
    options: { apiUrl?: string; apiKey?: string | null; accessToken?: string | null } = {}
  ) {
    this.apiUrl = options.apiUrl ?? process.env.GCP_BILLING_API_URL ?? DEFAULT_API_URL;
    this.apiKey = options.apiKey ?? process.env.GCP_BILLING_API_KEY ?? null;
    this.accessToken = options.accessToken ?? process.env.GCP_BILLING_ACCESS_TOKEN ?? null;
  }

  async sync(options: GcpCatalogSyncOptions = {}): Promise<GcpCatalogSyncResult> {
    this.assertConfigured();

    const serviceName = options.serviceName ?? 'Compute Engine';
    const regionCode = options.regionCode ?? DEFAULT_REGION;
    const currencyCode = options.currencyCode ?? DEFAULT_CURRENCY;
    const pageSize = Math.min(Math.max(options.pageSize ?? 500, 1), 5000);
    let syncRunId = 0;
    let skusRead = 0;
    let rowsUpserted = 0;

    try {
      const service = await this.findService(serviceName);
      if (!service) {
        throw new Error(`GCP public billing service not found: ${serviceName}`);
      }

      syncRunId = await this.repository.startSyncRun({
        providerId: 'gcp',
        source: 'gcp-cloud-billing-pricing-api',
        serviceCode: service.displayName,
        regionCode,
        metadata: {
          serviceName,
          serviceId: service.serviceId,
          serviceResourceName: service.name,
          regionCode,
          currencyCode,
          pageSize,
          maxSkus: options.maxSkus ?? null
        }
      });

      let pageToken: string | undefined;
      let reachedLimit = false;
      do {
        const response = await this.get<GcpBillingSkuListResponse>('/skus', {
          pageSize,
          pageToken,
          filter: `service = "${service.name}"`
        });
        const skus = response.data.skus ?? [];
        for (const sku of skus) {
          if (!this.shouldSyncSku(sku, { serviceName: service.displayName, regionCode, query: options.query })) {
            continue;
          }
          if (options.maxSkus && skusRead >= options.maxSkus) {
            reachedLimit = true;
            break;
          }
          skusRead += 1;
          const price = await this.priceForSku(sku, currencyCode);
          if (!price || !this.skuAppliesToRegion(sku, regionCode)) {
            continue;
          }
          rowsUpserted += await this.repository.upsertRetailPriceMeters(this.toRetailPriceMeters({ service, sku, price, regionCode }));
        }
        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken && !reachedLimit);

      const status = reachedLimit || Boolean(pageToken) ? 'partial' : 'completed';
      await this.repository.completeSyncRun(syncRunId, {
        status,
        rowsRead: skusRead,
        rowsUpserted,
        metadata: { serviceName: service.displayName, serviceId: service.serviceId }
      });

      return {
        syncRunId,
        status,
        serviceName: service.displayName,
        serviceId: service.serviceId,
        regionCode,
        skusRead,
        rowsUpserted
      };
    } catch (error) {
      if (syncRunId) {
        await this.repository.failSyncRun(syncRunId, error, { rowsRead: skusRead, rowsUpserted });
      }
      throw error;
    }
  }

  async syncSupportedServices(options: { maxSkus?: number } = {}): Promise<{ status: 'completed' | 'partial'; results: GcpCatalogSyncResult[] }> {
    const results: GcpCatalogSyncResult[] = [];
    for (const target of GCP_PUBLIC_PRICE_SYNC_TARGETS) {
      results.push(await this.sync({ ...target, maxSkus: options.maxSkus }));
    }
    return {
      status: results.some((result) => result.status === 'partial') ? 'partial' : 'completed',
      results
    };
  }

  async close(): Promise<void> {
    await this.repository.close?.();
  }

  private async findService(serviceName: string): Promise<GcpBillingService | null> {
    let pageToken: string | undefined;
    do {
      const response = await this.get<GcpBillingServiceListResponse>('/services', { pageSize: 5000, pageToken });
      const exact = (response.data.services ?? []).find((service) => service.displayName.toLowerCase() === serviceName.toLowerCase());
      if (exact) {
        return exact;
      }
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);
    return null;
  }

  private async priceForSku(sku: GcpBillingSku, currencyCode: string): Promise<GcpBillingPrice | null> {
    const response = await this.get<GcpBillingPrice>(`/${sku.name}/price`, { currencyCode });
    return response.data;
  }

  private async get<T>(path: string, params: Record<string, string | number | undefined>): Promise<{ data: T }> {
    try {
      return await this.http.get<T>(`${this.apiUrl}${path}`, {
        headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : undefined,
        params: this.params(params)
      });
    } catch (error) {
      throw new Error(this.gcpErrorSummary(error));
    }
  }

  private shouldSyncSku(sku: GcpBillingSku, input: { serviceName: string; regionCode: string; query?: string }): boolean {
    if (!this.skuAppliesToRegion(sku, input.regionCode)) {
      return false;
    }
    const query = input.query?.trim().toLowerCase();
    if (query && !sku.displayName.toLowerCase().includes(query)) {
      return false;
    }
    const text = sku.displayName.toLowerCase();
    if (input.serviceName !== 'Compute Engine') {
      return this.shouldSyncNonComputeSku(text, input.serviceName);
    }

    const isComputeMeter = (/\b(e2|n2)\b/.test(text) || text.includes('n2d amd')) && (text.includes('core') || text.includes('ram') || text.includes('memory'));
    const isPersistentDiskMeter =
      (text.includes('pd capacity') || (text.includes('persistent disk') && text.includes('capacity'))) &&
      !text.includes('snapshot') &&
      !text.includes('image storage') &&
      !text.includes('regional');
    const isNetworkEgressMeter =
      text.includes('network internet data transfer out') &&
      text.includes('gce') &&
      !text.includes('inter-region') &&
      !text.includes('inter zone') &&
      !text.includes('vpn') &&
      !text.includes('interconnect');
    const excluded =
      text.includes('spot') ||
      text.includes('preemptible') ||
      text.includes('commitment') ||
      text.includes('reserved') ||
      text.includes('sole tenancy') ||
      text.includes('license') ||
      text.includes('licensing') ||
      text.includes('suspended') ||
      text.includes('vm state') ||
      text.includes('premium') ||
      text.includes('windows') ||
      text.includes('ubuntu pro');

    return (isComputeMeter || isPersistentDiskMeter || isNetworkEgressMeter) && !excluded;
  }

  private shouldSyncNonComputeSku(text: string, serviceName: string): boolean {
    if (serviceName === 'Cloud Storage') {
      return (
        (text.includes('standard storage') || text.includes('nearline storage') || text.includes('coldline storage') || text.includes('archive storage')) &&
        !text.includes('autoclass') &&
        !text.includes('dual-region') &&
        !text.includes('multi-region') &&
        !text.includes('early delete') &&
        !text.includes('operations')
      );
    }
    if (serviceName === 'Cloud Logging') {
      return text.includes('log storage cost') || text.includes('log retention cost');
    }
    if (serviceName === 'Cloud Pub/Sub') {
      return text.includes('message delivery basic');
    }
    if (serviceName === 'Networking') {
      return text.includes('network internet data transfer out') || text.includes('cloud cdn traffic cache data transfer') || text.includes('forwarding rule minimum');
    }
    if (serviceName === 'Cloud SQL') {
      return text.includes('cloud sql for postgresql') && (text.includes('zonal - vcpu') || text.includes('zonal - ram') || text.includes('zonal - standard storage'));
    }
    if (serviceName === 'Cloud Memorystore for Redis') {
      return text.includes('redis capacity') || text.includes('redis standard node capacity');
    }
    return true;
  }

  private toRetailPriceMeters(input: { service: GcpBillingService; sku: GcpBillingSku; price: GcpBillingPrice; regionCode: string }): RetailPriceMeterInput[] {
    const currencyCode = input.price.currencyCode ?? DEFAULT_CURRENCY;
    const serviceFamily = this.productCategories(input.sku).at(0) ?? null;
    const productName = this.productCategories(input.sku).join(' / ') || input.service.displayName;
    const location = this.locationLabel(input.sku);
    const meters: RetailPriceMeterInput[] = [];

    for (const skuPrice of input.price.skuPrices ?? []) {
      const rate = skuPrice.rate;
      if (!rate) {
        continue;
      }
      const unit = rate.unitInfo?.unit ?? rate.unitInfo?.unitDescription ?? '';
      const unitDescription = rate.unitInfo?.unitDescription ?? unit;
      const consumptionModel = skuPrice.consumptionModelDescription ?? skuPrice.consumptionModel ?? 'Default';

      for (const tier of rate.tiers ?? []) {
        const tierMinimumUnits = this.decimal(tier.startAmount);
        const listPrice = this.money(tier.listPrice);
        meters.push({
          providerId: 'gcp',
          priceKey: ['gcp', input.sku.skuId, input.regionCode, consumptionModel, unit, String(tierMinimumUnits)].join(':'),
          serviceCode: input.service.displayName,
          serviceName: input.service.displayName,
          serviceFamily,
          productName,
          skuId: input.sku.skuId,
          skuName: input.sku.displayName,
          armSkuName: null,
          meterId: input.price.name,
          meterName: consumptionModel === 'Default' ? input.sku.displayName : `${input.sku.displayName} - ${consumptionModel}`,
          regionCode: input.regionCode,
          armRegionName: input.regionCode,
          location,
          unitOfMeasure: unitDescription || unit,
          priceType: consumptionModel,
          currencyCode,
          retailPrice: listPrice,
          unitPrice: listPrice,
          tierMinimumUnits,
          raw: {
            service: input.service,
            sku: input.sku,
            skuPrice,
            tier,
            unitInfo: rate.unitInfo
          }
        });
      }
    }

    return meters;
  }

  private skuAppliesToRegion(sku: GcpBillingSku, regionCode: string): boolean {
    const taxonomy = sku.geoTaxonomy;
    if (!taxonomy || taxonomy.type === 'TYPE_GLOBAL') {
      return true;
    }
    const regional = taxonomy.regionalMetadata?.region?.region;
    if (regional) {
      return regional === regionCode;
    }
    const multi = taxonomy.multiRegionalMetadata?.regions?.map((region) => region.region).filter(Boolean) ?? [];
    return multi.length === 0 || multi.includes(regionCode);
  }

  private locationLabel(sku: GcpBillingSku): string | null {
    const regional = sku.geoTaxonomy?.regionalMetadata?.region?.region;
    if (regional) {
      return regional;
    }
    const regions = sku.geoTaxonomy?.multiRegionalMetadata?.regions?.map((region) => region.region).filter(Boolean) ?? [];
    return regions.length > 0 ? regions.join(', ') : sku.geoTaxonomy?.type ?? null;
  }

  private productCategories(sku: GcpBillingSku): string[] {
    return (sku.productTaxonomy?.taxonomyCategories ?? []).map((item) => item.category).filter((category): category is string => Boolean(category));
  }

  private money(value: { units?: string; nanos?: number } | undefined): number {
    if (!value) {
      return 0;
    }
    return Number(value.units ?? 0) + (value.nanos ?? 0) / 1_000_000_000;
  }

  private decimal(value: { value?: string } | undefined): number {
    return Number(value?.value ?? 0);
  }

  private params(input: Record<string, string | number | undefined>): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    const apiKey = this.accessToken ? undefined : (this.apiKey ?? undefined);
    for (const [key, value] of Object.entries({ ...input, key: apiKey })) {
      if (value !== undefined && value !== '') {
        params[key] = value;
      }
    }
    return params;
  }

  private assertConfigured(): void {
    if (!this.apiKey && !this.accessToken) {
      throw new Error('GCP_BILLING_API_KEY or GCP_BILLING_ACCESS_TOKEN is required to call Google Cloud Billing Pricing API public endpoints.');
    }
  }

  private gcpErrorSummary(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ? `HTTP ${error.response.status}` : 'network error';
      const apiError = error.response?.data as { error?: { message?: string; status?: string } } | undefined;
      const message = apiError?.error?.message ?? error.message;
      return `GCP Cloud Billing Pricing API request failed (${status}): ${message}`;
    }

    return error instanceof Error ? error.message : 'GCP Cloud Billing Pricing API request failed.';
  }
}
