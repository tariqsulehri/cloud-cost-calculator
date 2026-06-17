import nock from 'nock';
import { afterEach, describe, expect, it } from 'vitest';
import { PricingCatalogService } from './PricingCatalogService.js';

describe('PricingCatalogService', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('builds Azure Retail Prices API filters for exact meter lookup', () => {
    const catalog = new PricingCatalogService();

    expect(
      catalog.buildFilterExpression({
        serviceName: 'Virtual Machines',
        armRegionName: 'eastus',
        armSkuName: 'Standard_D8s_v5',
        priceType: 'Consumption'
      })
    ).toBe("serviceName eq 'Virtual Machines' and armRegionName eq 'eastus' and armSkuName eq 'Standard_D8s_v5' and priceType eq 'Consumption'");
  });

  it('fetches all pages and normalizes Azure retail price records', async () => {
    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            armRegionName: 'eastus',
            serviceName: 'Virtual Machines',
            serviceFamily: 'Compute',
            productName: 'Virtual Machines Dsv5 Series',
            skuName: 'D8s v5',
            armSkuName: 'Standard_D8s_v5',
            meterName: 'D8s v5',
            unitOfMeasure: '1 Hour',
            type: 'Consumption',
            retailPrice: 0.384
          }
        ],
        NextPageLink: 'https://prices.azure.com/api/retail/prices?next=page2'
      });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            armRegionName: 'eastus',
            serviceName: 'Virtual Machines',
            serviceFamily: 'Compute',
            productName: 'Virtual Machines Dsv5 Series',
            skuName: 'D4s v5',
            armSkuName: 'Standard_D4s_v5',
            meterName: 'D4s v5',
            unitOfMeasure: '1 Hour',
            type: 'Consumption',
            unitPrice: 0.192
          }
        ],
        NextPageLink: null
      });

    const catalog = new PricingCatalogService();
    const prices = await catalog.findPrices({
      serviceName: 'Virtual Machines',
      armRegionName: 'eastus',
      priceType: 'Consumption'
    });

    expect(prices).toHaveLength(2);
    expect(prices[0]).toMatchObject({
      serviceName: 'Virtual Machines',
      armRegionName: 'eastus',
      skuName: 'D8s v5',
      armSkuName: 'Standard_D8s_v5',
      meterName: 'D8s v5',
      unitOfMeasure: '1 Hour',
      retailPrice: 0.384,
      unitPrice: 0.384
    });
    expect(prices[1]).toMatchObject({
      skuName: 'D4s v5',
      retailPrice: 0.192,
      unitPrice: 0.192
    });
  });

  it('caches repeated lookups by full query URL', async () => {
    const scope = nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .once()
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            armRegionName: 'eastus',
            serviceName: 'Bandwidth',
            productName: 'Bandwidth',
            skuName: 'Standard',
            meterName: 'Standard Data Transfer Out',
            unitOfMeasure: '1 GB',
            type: 'Consumption',
            retailPrice: 0.087
          }
        ],
        NextPageLink: null
      });

    const catalog = new PricingCatalogService();
    const filters = {
      serviceName: 'Bandwidth',
      armRegionName: 'eastus',
      meterName: 'Standard Data Transfer Out',
      priceType: 'Consumption'
    };

    const first = await catalog.findPrices(filters);
    const second = await catalog.findPrices(filters);

    expect(first).toEqual(second);
    expect(scope.isDone()).toBe(true);
  });

  it('returns an empty catalog result instead of throwing when Azure pricing is unavailable', async () => {
    nock('https://prices.azure.com').get('/api/retail/prices').query(true).times(2).reply(503, { error: 'temporary unavailable' });

    const catalog = new PricingCatalogService();
    const prices = await catalog.findPrices({
      serviceName: 'Virtual Machines',
      armRegionName: 'eastus',
      armSkuName: 'Standard_D8s_v5',
      priceType: 'Consumption'
    });

    expect(prices).toEqual([]);
  });

  it('does not cache failed Azure pricing lookups as empty results', async () => {
    nock('https://prices.azure.com').get('/api/retail/prices').query(true).times(2).reply(503, { error: 'temporary unavailable' });

    nock('https://prices.azure.com')
      .get('/api/retail/prices')
      .query(true)
      .reply(200, {
        Items: [
          {
            currencyCode: 'USD',
            armRegionName: 'eastus',
            serviceName: 'Virtual Machines',
            serviceFamily: 'Compute',
            productName: 'Virtual Machines Dsv5 Series',
            skuName: 'D8s v5',
            armSkuName: 'Standard_D8s_v5',
            meterName: 'D8s v5',
            unitOfMeasure: '1 Hour',
            type: 'Consumption',
            retailPrice: 0.384
          }
        ],
        NextPageLink: null
      });

    const catalog = new PricingCatalogService();
    const filters = {
      serviceName: 'Virtual Machines',
      armRegionName: 'eastus',
      armSkuName: 'Standard_D8s_v5',
      priceType: 'Consumption'
    };

    const unavailable = await catalog.findPrices(filters);
    const recovered = await catalog.findPrices(filters);

    expect(unavailable).toEqual([]);
    expect(recovered).toHaveLength(1);
    expect(recovered[0]).toMatchObject({ skuName: 'D8s v5', retailPrice: 0.384 });
  });
});
