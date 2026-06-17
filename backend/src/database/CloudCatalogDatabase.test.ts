import { afterEach, describe, expect, it } from 'vitest';
import { CloudCatalogDatabase } from './CloudCatalogDatabase.js';

const databases: CloudCatalogDatabase[] = [];

function createCatalog(): CloudCatalogDatabase {
  const catalog = new CloudCatalogDatabase({ path: ':memory:' });
  databases.push(catalog);
  return catalog;
}

afterEach(() => {
  databases.splice(0).forEach((catalog) => catalog.close());
});

describe('CloudCatalogDatabase', () => {
  it('seeds cross-cloud service hints for common services', () => {
    const catalog = createCatalog();

    expect(catalog.providerHintsForServiceKey('kubernetes')).toEqual({
      azure: 'Azure Kubernetes Service (AKS)',
      aws: 'Amazon EKS',
      gcp: 'Google Kubernetes Engine'
    });
    expect(catalog.providerHintsForServiceKey('database.postgresql')).toEqual({
      azure: 'Azure Database for PostgreSQL Flexible Server',
      aws: 'Amazon RDS for PostgreSQL',
      gcp: 'Cloud SQL for PostgreSQL'
    });
  });

  it('lists provider services with aliases and required pricing fields', () => {
    const catalog = createCatalog();
    const services = catalog.listServices({ provider: 'azure', query: 'redis' });

    expect(services).toHaveLength(1);
    expect(services[0]).toMatchObject({
      serviceKey: 'cache.redis',
      providerId: 'azure',
      canonicalName: 'Azure Cache for Redis',
      componentType: 'cache',
      pricingServiceName: 'Azure Cache for Redis'
    });
    expect(services[0].aliases).toContain('redis');
    expect(services[0].requiredFields).toEqual(['engine', 'memoryGb', 'tier']);
  });

  it('upserts Azure retail price meters for later catalog lookup', () => {
    const catalog = createCatalog();

    const rowsUpserted = catalog.upsertAzureRetailPriceMeters([
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
    ]);

    const meters = catalog.listRetailPriceMeters({ provider: 'azure', region: 'eastus', query: 'D4s' });

    expect(rowsUpserted).toBe(1);
    expect(meters).toHaveLength(1);
    expect(meters[0]).toMatchObject({
      providerId: 'azure',
      serviceName: 'Virtual Machines',
      productName: 'Virtual Machines Dsv5 Series',
      skuName: 'D4s v5',
      armSkuName: 'Standard_D4s_v5',
      retailPrice: 0.192
    });
  });
});
