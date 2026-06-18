export interface GcpMoney {
  currencyCode?: string;
  units?: string;
  nanos?: number;
}

export interface GcpDecimal {
  value?: string;
}

export interface GcpBillingService {
  name: string;
  serviceId: string;
  displayName: string;
}

export interface GcpBillingServiceListResponse {
  services?: GcpBillingService[];
  nextPageToken?: string;
}

export interface GcpBillingSku {
  name: string;
  skuId: string;
  displayName: string;
  service: string;
  productTaxonomy?: {
    taxonomyCategories?: Array<{ category?: string }>;
  };
  geoTaxonomy?: {
    type?: string;
    regionalMetadata?: {
      region?: {
        region?: string;
      };
    };
    multiRegionalMetadata?: {
      regions?: Array<{ region?: string }>;
    };
  };
}

export interface GcpBillingSkuListResponse {
  skus?: GcpBillingSku[];
  nextPageToken?: string;
}

export interface GcpBillingPrice {
  name: string;
  currencyCode?: string;
  skuPrices?: GcpBillingSkuPrice[];
}

export interface GcpBillingSkuPrice {
  consumptionModel?: string;
  consumptionModelDescription?: string;
  valueType?: string;
  rate?: {
    unitInfo?: {
      unit?: string;
      unitDescription?: string;
      unitQuantity?: GcpDecimal;
    };
    tiers?: Array<{
      startAmount?: GcpDecimal;
      listPrice?: GcpMoney;
    }>;
    aggregationInfo?: {
      level?: string;
      interval?: string;
    };
  };
}
