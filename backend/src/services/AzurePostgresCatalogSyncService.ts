import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { PostgresPricingCatalogRepository, type RetailPriceMeterInput } from '../database/PostgresPricingCatalogRepository.js';
import type { AzureRetailPriceItem, AzureRetailPriceResponse } from '../types/azure.types.js';

const DEFAULT_API_URL = 'https://prices.azure.com/api/retail/prices';
const DEFAULT_API_VERSION = '2023-01-01-preview';
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_REGION = 'eastus';
const DEFAULT_PRICE_TYPE = 'Consumption';

export interface AzurePostgresCatalogSyncOptions {
  armRegionName?: string;
  serviceName?: string;
  priceType?: string;
  currencyCode?: string;
  maxPages?: number;
}

export interface AzurePostgresCatalogSyncResult {
  syncRunId: number;
  status: 'completed' | 'partial';
  serviceName: string | null;
  armRegionName: string;
  pagesFetched: number;
  itemsFetched: number;
  rowsUpserted: number;
  nextPageLink: string | null;
}

export interface AzureRetailServiceSyncTarget {
  serviceName: string;
  armRegionName: string;
}

export const AZURE_RETAIL_SYNC_TARGETS: AzureRetailServiceSyncTarget[] = [
  { serviceName: 'Virtual Machines', armRegionName: DEFAULT_REGION },
  { serviceName: 'Storage', armRegionName: DEFAULT_REGION },
  { serviceName: 'Bandwidth', armRegionName: DEFAULT_REGION },
  { serviceName: 'Load Balancer', armRegionName: 'Global' },
  { serviceName: 'Content Delivery Network', armRegionName: 'Zone 1' },
  { serviceName: 'Application Gateway', armRegionName: DEFAULT_REGION },
  { serviceName: 'Redis Cache', armRegionName: DEFAULT_REGION },
  { serviceName: 'Service Bus', armRegionName: DEFAULT_REGION },
  { serviceName: 'Log Analytics', armRegionName: DEFAULT_REGION },
  { serviceName: 'Azure Database for PostgreSQL', armRegionName: DEFAULT_REGION }
];

interface AzurePriceRepository {
  startSyncRun(input: { providerId: 'azure'; source: string; serviceCode?: string | null; regionCode?: string | null; metadata?: unknown }): Promise<number>;
  completeSyncRun(id: number, input: { status: 'completed' | 'partial'; rowsRead: number; rowsUpserted: number; metadata?: unknown }): Promise<void>;
  failSyncRun(id: number, error: unknown, input: { rowsRead?: number; rowsUpserted?: number; metadata?: unknown }): Promise<void>;
  upsertRetailPriceMeters(items: RetailPriceMeterInput[]): Promise<number>;
  close?(): Promise<void>;
}

export class AzurePostgresCatalogSyncService {
  private readonly apiUrl: string;
  private readonly apiVersion: string;

  constructor(
    private readonly repository: AzurePriceRepository = new PostgresPricingCatalogRepository(),
    private readonly http: AxiosInstance = axios.create({ timeout: 30_000 }),
    options: { apiUrl?: string; apiVersion?: string } = {}
  ) {
    this.apiUrl = options.apiUrl ?? process.env.AZURE_RETAIL_PRICES_API_URL ?? DEFAULT_API_URL;
    this.apiVersion = options.apiVersion ?? process.env.AZURE_RETAIL_PRICES_API_VERSION ?? DEFAULT_API_VERSION;
  }

  async sync(options: AzurePostgresCatalogSyncOptions = {}): Promise<AzurePostgresCatalogSyncResult> {
    const armRegionName = options.armRegionName ?? DEFAULT_REGION;
    const priceType = options.priceType ?? DEFAULT_PRICE_TYPE;
    const currencyCode = options.currencyCode ?? DEFAULT_CURRENCY;
    const maxPages = Math.max(options.maxPages ?? Number(process.env.AZURE_CATALOG_SYNC_MAX_PAGES ?? 50), 1);
    let syncRunId = 0;
    let pagesFetched = 0;
    let itemsFetched = 0;
    let rowsUpserted = 0;
    let nextPageLink: string | null = this.buildUrl({ ...options, armRegionName, priceType, currencyCode });

    try {
      syncRunId = await this.repository.startSyncRun({
        providerId: 'azure',
        source: 'azure-retail-prices-api',
        serviceCode: options.serviceName ?? null,
        regionCode: armRegionName,
        metadata: {
          apiUrl: this.apiUrl,
          apiVersion: this.apiVersion,
          serviceName: options.serviceName ?? null,
          armRegionName,
          priceType,
          currencyCode,
          maxPages
        }
      });

      while (nextPageLink && pagesFetched < maxPages) {
        const response: AxiosResponse<AzureRetailPriceResponse> = await this.http.get<AzureRetailPriceResponse>(nextPageLink);
        const items = response.data.Items ?? [];
        pagesFetched += 1;
        itemsFetched += items.length;
        rowsUpserted += await this.repository.upsertRetailPriceMeters(items.map((item) => this.toRetailPriceMeter(item, { armRegionName, currencyCode, priceType })));
        nextPageLink = response.data.NextPageLink ?? null;
      }

      const status = nextPageLink ? 'partial' : 'completed';
      await this.repository.completeSyncRun(syncRunId, {
        status,
        rowsRead: itemsFetched,
        rowsUpserted,
        metadata: {
          pagesFetched,
          nextPageLink
        }
      });

      return {
        syncRunId,
        status,
        serviceName: options.serviceName ?? null,
        armRegionName,
        pagesFetched,
        itemsFetched,
        rowsUpserted,
        nextPageLink
      };
    } catch (error) {
      if (syncRunId) {
        await this.repository.failSyncRun(syncRunId, error, {
          rowsRead: itemsFetched,
          rowsUpserted,
          metadata: { pagesFetched, nextPageLink }
        });
      }
      throw error;
    }
  }

  async syncSupportedServices(options: { maxPages?: number } = {}): Promise<{ status: 'completed' | 'partial'; results: AzurePostgresCatalogSyncResult[] }> {
    const results: AzurePostgresCatalogSyncResult[] = [];

    for (const target of AZURE_RETAIL_SYNC_TARGETS) {
      results.push(
        await this.sync({
          ...target,
          maxPages: options.maxPages
        })
      );
    }

    return {
      status: results.some((result) => result.status === 'partial') ? 'partial' : 'completed',
      results
    };
  }

  async close(): Promise<void> {
    await this.repository.close?.();
  }

  buildUrl(options: AzurePostgresCatalogSyncOptions = {}): string {
    const params = new URLSearchParams();
    params.set('api-version', this.apiVersion);
    params.set('currencyCode', `'${options.currencyCode ?? DEFAULT_CURRENCY}'`);

    const filter = this.buildFilterExpression(options);
    if (filter) {
      params.set('$filter', filter);
    }

    return `${this.apiUrl}?${params.toString()}`;
  }

  private buildFilterExpression(options: AzurePostgresCatalogSyncOptions): string {
    return [
      this.equalsFilter('armRegionName', options.armRegionName ?? DEFAULT_REGION),
      this.equalsFilter('serviceName', options.serviceName),
      this.equalsFilter('priceType', options.priceType ?? DEFAULT_PRICE_TYPE)
    ]
      .filter((filter): filter is string => Boolean(filter))
      .join(' and ');
  }

  private equalsFilter(field: string, value?: string): string | null {
    if (!value) {
      return null;
    }

    return `${field} eq '${value.replace(/'/g, "''")}'`;
  }

  private toRetailPriceMeter(
    item: AzureRetailPriceItem,
    defaults: { armRegionName: string; currencyCode: string; priceType: string }
  ): RetailPriceMeterInput {
    const serviceName = item.serviceName ?? 'Azure';
    const productName = item.productName ?? serviceName;
    const skuName = item.skuName ?? item.armSkuName ?? item.meterName ?? 'Azure meter';
    const meterName = item.meterName ?? item.meterId ?? skuName;
    const armRegionName = item.armRegionName ?? defaults.armRegionName;
    const priceType = item.priceType ?? item.type ?? defaults.priceType;
    const currencyCode = item.currencyCode ?? defaults.currencyCode;
    const price = item.retailPrice ?? item.unitPrice ?? 0;
    const tierMinimumUnits = item.tierMinimumUnits ?? 0;

    return {
      providerId: 'azure',
      priceKey: this.priceKey(item, { serviceName, skuName, meterName, armRegionName, priceType, currencyCode, tierMinimumUnits }),
      serviceCode: serviceName,
      serviceName,
      serviceFamily: item.serviceFamily ?? null,
      productName,
      skuId: item.armSkuName ?? item.skuName ?? null,
      skuName,
      armSkuName: item.armSkuName ?? null,
      meterId: item.meterId ?? null,
      meterName,
      regionCode: armRegionName,
      armRegionName,
      location: item.location ?? null,
      unitOfMeasure: item.unitOfMeasure ?? '',
      priceType,
      currencyCode,
      retailPrice: price,
      unitPrice: item.unitPrice ?? price,
      tierMinimumUnits,
      raw: item
    };
  }

  private priceKey(
    item: AzureRetailPriceItem,
    fallback: {
      serviceName: string;
      skuName: string;
      meterName: string;
      armRegionName: string;
      priceType: string;
      currencyCode: string;
      tierMinimumUnits: number;
    }
  ): string {
    return [
      'azure',
      item.meterId ?? fallback.serviceName,
      item.armSkuName ?? fallback.skuName,
      fallback.meterName,
      fallback.armRegionName,
      fallback.priceType,
      fallback.currencyCode,
      String(fallback.tierMinimumUnits)
    ].join(':');
  }
}
