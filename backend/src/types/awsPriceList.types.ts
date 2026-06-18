export interface AwsPriceListFile {
  formatVersion?: string;
  offerCode?: string;
  version?: string;
  publicationDate?: string;
  products?: Record<string, AwsPriceListProduct>;
  terms?: {
    OnDemand?: Record<string, Record<string, AwsPriceListTerm>>;
  };
}

export interface AwsPriceListProduct {
  sku: string;
  productFamily?: string;
  attributes?: Record<string, string | undefined>;
}

export interface AwsPriceListTerm {
  offerTermCode?: string;
  sku?: string;
  effectiveDate?: string;
  priceDimensions?: Record<string, AwsPriceListPriceDimension>;
  termAttributes?: Record<string, string | undefined>;
}

export interface AwsPriceListPriceDimension {
  rateCode?: string;
  description?: string;
  beginRange?: string;
  endRange?: string;
  unit?: string;
  pricePerUnit?: Record<string, string | undefined>;
  appliesTo?: string[];
}

export interface AwsRetailPriceMeterInput {
  priceKey: string;
  serviceName: string;
  serviceFamily: string | null;
  productName: string;
  skuName: string;
  armSkuName: string | null;
  meterId: string | null;
  meterName: string;
  armRegionName: string | null;
  location: string | null;
  unitOfMeasure: string;
  priceType: string;
  currencyCode: string;
  retailPrice: number;
  unitPrice: number;
  tierMinimumUnits: number;
  raw: unknown;
}
