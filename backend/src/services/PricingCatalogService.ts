import axios, { type AxiosInstance } from 'axios';
import { MemoryCache } from '../utils/cache.js';
import type { AzurePriceRecord, AzureRetailPriceFilters, AzureRetailPriceItem, AzureRetailPriceResponse } from '../types/azure.types.js';

const DEFAULT_API_URL = 'https://prices.azure.com/api/retail/prices';
const DEFAULT_API_VERSION = '2023-01-01-preview';
const DEFAULT_CURRENCY = 'USD';

export class PricingCatalogService {
  private readonly cache: MemoryCache<AzurePriceRecord[]>;
  private readonly apiUrl: string;
  private readonly apiVersion: string;

  constructor(
    private readonly http: AxiosInstance = axios.create({ timeout: 4500 }),
    options: { apiUrl?: string; apiVersion?: string; cacheTtlMs?: number } = {}
  ) {
    this.apiUrl = options.apiUrl ?? process.env.AZURE_RETAIL_PRICES_API_URL ?? DEFAULT_API_URL;
    this.apiVersion = options.apiVersion ?? process.env.AZURE_RETAIL_PRICES_API_VERSION ?? DEFAULT_API_VERSION;
    this.cache = new MemoryCache<AzurePriceRecord[]>(options.cacheTtlMs ?? 1000 * 60 * 60 * 24);
  }

  async findPrices(filters: AzureRetailPriceFilters): Promise<AzurePriceRecord[]> {
    const url = this.buildUrl(filters);
    const cached = this.cache.get(url);
    if (cached) {
      return cached;
    }

    const items: AzureRetailPriceItem[] = [];
    let nextUrl: string | null | undefined = url;
    let hadRequestFailure = false;

    while (nextUrl) {
      const response = await this.requestWithRetry(nextUrl, 2);
      hadRequestFailure = hadRequestFailure || response.failed === true;
      items.push(...(response.Items ?? []));
      nextUrl = response.NextPageLink;
    }

    const records = items.map((item) => this.normalizePriceRecord(item));
    if (!hadRequestFailure) {
      this.cache.set(url, records);
    }
    return records;
  }

  buildUrl(filters: AzureRetailPriceFilters): string {
    const params = new URLSearchParams();
    params.set('api-version', this.apiVersion);
    params.set('currencyCode', `'${filters.currencyCode ?? DEFAULT_CURRENCY}'`);

    const filterExpression = this.buildFilterExpression(filters);
    if (filterExpression) {
      params.set('$filter', filterExpression);
    }

    return `${this.apiUrl}?${params.toString()}`;
  }

  buildFilterExpression(filters: AzureRetailPriceFilters): string {
    return [
      this.equalsFilter('serviceName', filters.serviceName),
      this.equalsFilter('serviceFamily', filters.serviceFamily),
      this.equalsFilter('armRegionName', filters.armRegionName),
      this.equalsFilter('productName', filters.productName),
      this.equalsFilter('skuName', filters.skuName),
      this.equalsFilter('armSkuName', filters.armSkuName),
      this.equalsFilter('meterName', filters.meterName),
      this.equalsFilter('priceType', filters.priceType)
    ]
      .filter((filter): filter is string => Boolean(filter))
      .join(' and ');
  }

  private equalsFilter(field: string, value?: string): string | null {
    if (!value) {
      return null;
    }

    return `${field} eq '${this.escapeFilterValue(value)}'`;
  }

  private escapeFilterValue(value: string): string {
    return value.replace(/'/g, "''");
  }

  private normalizePriceRecord(item: AzureRetailPriceItem): AzurePriceRecord {
    const price = item.retailPrice ?? item.unitPrice ?? 0;

    return {
      currencyCode: item.currencyCode ?? DEFAULT_CURRENCY,
      tierMinimumUnits: item.tierMinimumUnits ?? 0,
      armRegionName: item.armRegionName ?? null,
      location: item.location ?? null,
      meterId: item.meterId ?? null,
      meterName: item.meterName ?? '',
      productName: item.productName ?? '',
      skuName: item.skuName ?? '',
      serviceName: item.serviceName ?? '',
      serviceFamily: item.serviceFamily ?? null,
      unitOfMeasure: item.unitOfMeasure ?? '',
      type: item.type ?? null,
      priceType: item.priceType ?? null,
      armSkuName: item.armSkuName ?? null,
      retailPrice: price,
      unitPrice: item.unitPrice ?? price,
      raw: item
    };
  }

  private async requestWithRetry(url: string, attempts: number): Promise<AzureRetailPriceResponse & { failed?: boolean }> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await this.http.get<AzureRetailPriceResponse>(url);
        return response.data;
      } catch (error) {
        lastError = error;
        if (attempt < attempts) {
          await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
        }
      }
    }

    console.warn(`Azure Retail Prices API request failed after ${attempts} attempts: ${url}. ${this.errorSummary(lastError)}`);
    return { Items: [], NextPageLink: null, failed: true };
  }

  private errorSummary(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ? `HTTP ${error.response.status}` : 'network error';
      return `${status}: ${error.message}`;
    }

    return error instanceof Error ? error.message : 'Unknown error';
  }
}
