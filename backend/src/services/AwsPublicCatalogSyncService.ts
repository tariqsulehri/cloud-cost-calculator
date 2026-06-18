import { readFile } from 'node:fs/promises';
import { CloudCatalogDatabase } from '../database/CloudCatalogDatabase.js';
import type { AwsPriceListFile, AwsPriceListPriceDimension, AwsPriceListProduct, AwsPriceListTerm, AwsRetailPriceMeterInput } from '../types/awsPriceList.types.js';

export interface AwsPublicCatalogSyncOptions {
  filePath: string;
  offerCode?: string;
  maxMeters?: number;
}

export interface AwsPublicCatalogSyncResult {
  syncRunId: number;
  status: 'completed' | 'partial' | 'failed';
  offerCode: string | null;
  publicationDate: string | null;
  productsRead: number;
  metersRead: number;
  rowsUpserted: number;
}

export class AwsPublicCatalogSyncService {
  constructor(private readonly catalog = new CloudCatalogDatabase()) {}

  async syncFromFile(options: AwsPublicCatalogSyncOptions): Promise<AwsPublicCatalogSyncResult> {
    const syncRunId = this.catalog.startSyncRun('aws', 'aws-public-price-list');
    let rowsUpserted = 0;
    let offerCode: string | null = null;
    let publicationDate: string | null = null;
    let productsRead = 0;
    let metersRead = 0;

    try {
      const priceList = JSON.parse(await readFile(options.filePath, 'utf8')) as AwsPriceListFile;
      offerCode = options.offerCode ?? priceList.offerCode ?? null;
      publicationDate = priceList.publicationDate ?? null;
      productsRead = Object.keys(priceList.products ?? {}).length;

      const meters = this.toRetailPriceMeters(priceList, offerCode ?? 'AWS', options.maxMeters);
      metersRead = meters.length;
      rowsUpserted = this.catalog.upsertAwsRetailPriceMeters(meters);

      const status = options.maxMeters && metersRead >= options.maxMeters ? 'partial' : 'completed';
      this.catalog.completeSyncRun(syncRunId, status, rowsUpserted);

      return {
        syncRunId,
        status,
        offerCode,
        publicationDate,
        productsRead,
        metersRead,
        rowsUpserted
      };
    } catch (error) {
      this.catalog.failSyncRun(syncRunId, error, rowsUpserted);
      return {
        syncRunId,
        status: 'failed',
        offerCode,
        publicationDate,
        productsRead,
        metersRead,
        rowsUpserted
      };
    }
  }

  toRetailPriceMeters(priceList: AwsPriceListFile, offerCode: string, maxMeters?: number): AwsRetailPriceMeterInput[] {
    const products = priceList.products ?? {};
    const onDemandTerms = priceList.terms?.OnDemand ?? {};
    const meters: AwsRetailPriceMeterInput[] = [];

    for (const [sku, termsByCode] of Object.entries(onDemandTerms)) {
      const product = products[sku];
      if (!product) {
        continue;
      }

      for (const [termCode, term] of Object.entries(termsByCode)) {
        for (const [rateCode, dimension] of Object.entries(term.priceDimensions ?? {})) {
          const meter = this.toRetailPriceMeter({
            offerCode,
            sku,
            termCode,
            rateCode,
            product,
            term,
            dimension
          });

          if (meter) {
            meters.push(meter);
          }

          if (maxMeters && meters.length >= maxMeters) {
            return meters;
          }
        }
      }
    }

    return meters;
  }

  private toRetailPriceMeter(input: {
    offerCode: string;
    sku: string;
    termCode: string;
    rateCode: string;
    product: AwsPriceListProduct;
    term: AwsPriceListTerm;
    dimension: AwsPriceListPriceDimension;
  }): AwsRetailPriceMeterInput | null {
    const currencyCode = Object.keys(input.dimension.pricePerUnit ?? {}).find((currency) => currency === 'USD') ?? Object.keys(input.dimension.pricePerUnit ?? {})[0];
    const unitPrice = Number.parseFloat(currencyCode ? (input.dimension.pricePerUnit?.[currencyCode] ?? '') : '');

    if (!currencyCode || !Number.isFinite(unitPrice)) {
      return null;
    }

    const attributes = input.product.attributes ?? {};
    const regionCode = attributes.regionCode ?? null;
    const skuName = attributes.instanceType ?? attributes.volumeType ?? attributes.group ?? input.product.productFamily ?? input.sku;

    return {
      priceKey: `${input.offerCode}:${regionCode ?? 'global'}:${input.sku}:${input.termCode}:${input.rateCode}`,
      serviceName: input.offerCode,
      serviceFamily: attributes.serviceFamily ?? input.product.productFamily ?? null,
      productName: input.product.productFamily ?? input.offerCode,
      skuName,
      armSkuName: attributes.instanceType ?? null,
      meterId: input.dimension.rateCode ?? input.rateCode,
      meterName: input.dimension.description ?? input.dimension.rateCode ?? input.rateCode,
      armRegionName: regionCode,
      location: attributes.location ?? null,
      unitOfMeasure: input.dimension.unit ?? '',
      priceType: 'OnDemand',
      currencyCode,
      retailPrice: unitPrice,
      unitPrice,
      tierMinimumUnits: Number.parseFloat(input.dimension.beginRange ?? '0') || 0,
      raw: {
        offerCode: input.offerCode,
        sku: input.sku,
        termCode: input.termCode,
        rateCode: input.rateCode,
        effectiveDate: input.term.effectiveDate ?? null,
        product: input.product,
        dimension: input.dimension
      }
    };
  }
}
