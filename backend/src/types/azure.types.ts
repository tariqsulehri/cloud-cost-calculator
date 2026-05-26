export interface AzureRegion {
  name: string;
  value: string;
}

export interface AzureRetailPriceItem {
  currencyCode?: string;
  tierMinimumUnits?: number;
  armRegionName?: string;
  location?: string;
  meterId?: string;
  meterName?: string;
  productName?: string;
  skuName?: string;
  serviceName?: string;
  serviceFamily?: string;
  unitOfMeasure?: string;
  type?: string;
  priceType?: string;
  armSkuName?: string;
  retailPrice?: number;
  unitPrice?: number;
}

export interface AzureRetailPriceResponse {
  BillingCurrency?: string;
  Items?: AzureRetailPriceItem[];
  NextPageLink?: string | null;
  Count?: number;
}

export interface AzureRetailPriceFilters {
  serviceName?: string;
  serviceFamily?: string;
  armRegionName?: string;
  productName?: string;
  skuName?: string;
  armSkuName?: string;
  meterName?: string;
  priceType?: string;
  currencyCode?: string;
}

export interface AzurePriceRecord {
  currencyCode: string;
  tierMinimumUnits: number;
  armRegionName: string | null;
  location: string | null;
  meterId: string | null;
  meterName: string;
  productName: string;
  skuName: string;
  serviceName: string;
  serviceFamily: string | null;
  unitOfMeasure: string;
  type: string | null;
  priceType: string | null;
  armSkuName: string | null;
  retailPrice: number;
  unitPrice: number;
  raw: AzureRetailPriceItem;
}
