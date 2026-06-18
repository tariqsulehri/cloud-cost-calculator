import { AzurePostgresCatalogSyncService } from '../services/AzurePostgresCatalogSyncService.js';

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const service = new AzurePostgresCatalogSyncService();

try {
  const result = await service.sync({
    armRegionName: option('region') ?? process.env.AZURE_CATALOG_SYNC_REGION ?? 'eastus',
    serviceName: option('service'),
    priceType: option('priceType') ?? 'Consumption',
    currencyCode: option('currency') ?? 'USD',
    maxPages: Number(option('maxPages') ?? process.env.AZURE_CATALOG_SYNC_MAX_PAGES ?? 50)
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await service.close();
}
