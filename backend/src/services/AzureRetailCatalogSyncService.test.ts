import nock from 'nock';
import { afterEach, describe, expect, it } from 'vitest';
import { CloudCatalogDatabase } from '../database/CloudCatalogDatabase.js';
import { AzureRetailCatalogSyncService } from './AzureRetailCatalogSyncService.js';

describe('AzureRetailCatalogSyncService', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('syncs Azure Retail Prices API meters into SQLite', async () => {
    const catalog = new CloudCatalogDatabase({ path: ':memory:' });
    const service = new AzureRetailCatalogSyncService(catalog);

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            armRegionName: 'eastus',
            location: 'US East',
            serviceName: 'Virtual Machines',
            serviceFamily: 'Compute',
            productName: 'Virtual Machines Dsv5 Series',
            skuName: 'D4s v5',
            armSkuName: 'Standard_D4s_v5',
            meterId: 'meter-1',
            meterName: 'D4s v5',
            unitOfMeasure: '1 Hour',
            priceType: 'Consumption',
            retailPrice: 0.192,
            unitPrice: 0.192,
            tierMinimumUnits: 0
          }
        ],
        NextPageLink: null
      });

    const result = await service.sync({ armRegionName: 'eastus', serviceName: 'Virtual Machines', maxPages: 1 });
    const meters = catalog.listRetailPriceMeters({ provider: 'azure', region: 'eastus', query: 'D4s' });

    expect(result).toMatchObject({
      status: 'completed',
      pagesFetched: 1,
      itemsFetched: 1,
      rowsUpserted: 1,
      nextPageLink: null
    });
    expect(meters[0]).toMatchObject({
      serviceName: 'Virtual Machines',
      skuName: 'D4s v5',
      meterName: 'D4s v5'
    });

    catalog.close();
  });

  it('marks sync partial when maxPages is reached before pagination ends', async () => {
    const catalog = new CloudCatalogDatabase({ path: ':memory:' });
    const service = new AzureRetailCatalogSyncService(catalog);

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [],
        NextPageLink: 'https://prices.azure.com/api/retail/prices?$skip=100'
      });

    const result = await service.sync({ maxPages: 1 });

    expect(result).toMatchObject({
      status: 'partial',
      pagesFetched: 1,
      rowsUpserted: 0,
      nextPageLink: 'https://prices.azure.com/api/retail/prices?$skip=100'
    });

    catalog.close();
  });
});
