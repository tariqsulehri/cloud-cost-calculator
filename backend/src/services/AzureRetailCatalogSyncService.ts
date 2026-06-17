import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { CloudCatalogDatabase } from '../database/CloudCatalogDatabase.js';
import type { AzureRetailPriceItem, AzureRetailPriceResponse } from '../types/azure.types.js';

const DEFAULT_API_URL = 'https://prices.azure.com/api/retail/prices';
const DEFAULT_API_VERSION = '2023-01-01-preview';
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_REGION = 'eastus';

export interface AzureRetailCatalogSyncOptions {
  armRegionName?: string;
  serviceName?: string;
  priceType?: string;
  currencyCode?: string;
  maxPages?: number;
}

export interface AzureRetailCatalogSyncResult {
  syncRunId: number;
  status: 'completed' | 'partial' | 'failed';
  pagesFetched: number;
  itemsFetched: number;
  rowsUpserted: number;
  nextPageLink: string | null;
}

export class AzureRetailCatalogSyncService {
  private readonly apiUrl: string;
  private readonly apiVersion: string;

  constructor(
    private readonly catalog = new CloudCatalogDatabase(),
    private readonly http: AxiosInstance = axios.create({ timeout: 15000 }),
    options: { apiUrl?: string; apiVersion?: string } = {}
  ) {
    this.apiUrl = options.apiUrl ?? process.env.AZURE_RETAIL_PRICES_API_URL ?? DEFAULT_API_URL;
    this.apiVersion = options.apiVersion ?? process.env.AZURE_RETAIL_PRICES_API_VERSION ?? DEFAULT_API_VERSION;
  }

  async sync(options: AzureRetailCatalogSyncOptions = {}): Promise<AzureRetailCatalogSyncResult> {
    const maxPages = Math.max(options.maxPages ?? Number(process.env.AZURE_CATALOG_SYNC_MAX_PAGES ?? 10), 1);
    const syncRunId = this.catalog.startSyncRun('azure', 'azure-retail-prices-api');
    let pagesFetched = 0;
    let itemsFetched = 0;
    let rowsUpserted = 0;
    let nextPageLink: string | null = this.buildUrl(options);

    try {
      while (nextPageLink && pagesFetched < maxPages) {
        const response: AxiosResponse<AzureRetailPriceResponse> = await this.http.get<AzureRetailPriceResponse>(nextPageLink);
        const items = response.data.Items ?? [];
        pagesFetched += 1;
        itemsFetched += items.length;
        rowsUpserted += this.catalog.upsertAzureRetailPriceMeters(items);
        nextPageLink = response.data.NextPageLink ?? null;
      }

      const status = nextPageLink ? 'partial' : 'completed';
      this.catalog.completeSyncRun(syncRunId, status, rowsUpserted);
      return {
        syncRunId,
        status,
        pagesFetched,
        itemsFetched,
        rowsUpserted,
        nextPageLink
      };
    } catch (error) {
      this.catalog.failSyncRun(syncRunId, error, rowsUpserted);
      return {
        syncRunId,
        status: 'failed',
        pagesFetched,
        itemsFetched,
        rowsUpserted,
        nextPageLink
      };
    }
  }

  buildUrl(options: AzureRetailCatalogSyncOptions = {}): string {
    const params = new URLSearchParams();
    params.set('api-version', this.apiVersion);
    params.set('currencyCode', `'${options.currencyCode ?? DEFAULT_CURRENCY}'`);

    const filter = this.buildFilterExpression(options);
    if (filter) {
      params.set('$filter', filter);
    }

    return `${this.apiUrl}?${params.toString()}`;
  }

  private buildFilterExpression(options: AzureRetailCatalogSyncOptions): string {
    return [
      this.equalsFilter('armRegionName', options.armRegionName ?? DEFAULT_REGION),
      this.equalsFilter('serviceName', options.serviceName),
      this.equalsFilter('priceType', options.priceType ?? 'Consumption')
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
}

export function uniqueAzureServiceNames(items: AzureRetailPriceItem[]): string[] {
  return [...new Set(items.map((item) => item.serviceName).filter((serviceName): serviceName is string => Boolean(serviceName)))].sort();
}
