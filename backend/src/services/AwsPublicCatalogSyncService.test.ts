import { describe, expect, it } from 'vitest';
import { AwsPublicCatalogSyncService } from './AwsPublicCatalogSyncService.js';
import type { AwsPriceListFile } from '../types/awsPriceList.types.js';

describe('AwsPublicCatalogSyncService', () => {
  it('normalizes AWS OnDemand price dimensions into retail meter rows', () => {
    const service = new AwsPublicCatalogSyncService();
    const priceList: AwsPriceListFile = {
      offerCode: 'AmazonEC2',
      publicationDate: '2026-06-17T17:01:45Z',
      products: {
        SKU1: {
          sku: 'SKU1',
          productFamily: 'Compute Instance',
          attributes: {
            servicecode: 'AmazonEC2',
            location: 'US East (N. Virginia)',
            regionCode: 'us-east-1',
            instanceType: 'm7i.xlarge'
          }
        }
      },
      terms: {
        OnDemand: {
          SKU1: {
            'SKU1.JRTCKXETXF': {
              sku: 'SKU1',
              effectiveDate: '2026-06-01T00:00:00Z',
              priceDimensions: {
                'SKU1.JRTCKXETXF.6YS6EN2CT7': {
                  rateCode: 'SKU1.JRTCKXETXF.6YS6EN2CT7',
                  description: '$0.2016 per On Demand Linux m7i.xlarge Instance Hour',
                  beginRange: '0',
                  endRange: 'Inf',
                  unit: 'Hrs',
                  pricePerUnit: {
                    USD: '0.2016000000'
                  }
                }
              }
            }
          }
        }
      }
    };

    const meters = service.toRetailPriceMeters(priceList, 'AmazonEC2');

    expect(meters).toHaveLength(1);
    expect(meters[0]).toMatchObject({
      priceKey: 'AmazonEC2:us-east-1:SKU1:SKU1.JRTCKXETXF:SKU1.JRTCKXETXF.6YS6EN2CT7',
      serviceName: 'AmazonEC2',
      productName: 'Compute Instance',
      skuName: 'm7i.xlarge',
      armSkuName: 'm7i.xlarge',
      armRegionName: 'us-east-1',
      location: 'US East (N. Virginia)',
      unitOfMeasure: 'Hrs',
      priceType: 'OnDemand',
      currencyCode: 'USD',
      unitPrice: 0.2016
    });
  });
});
