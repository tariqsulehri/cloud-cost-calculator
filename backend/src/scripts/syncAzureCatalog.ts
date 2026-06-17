import { AzureRetailCatalogSyncService } from '../services/AzureRetailCatalogSyncService.js';

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const service = new AzureRetailCatalogSyncService();
const result = await service.sync({
  armRegionName: option('region') ?? process.env.AZURE_CATALOG_SYNC_REGION ?? 'eastus',
  serviceName: option('service'),
  priceType: option('priceType') ?? 'Consumption',
  maxPages: Number(option('maxPages') ?? process.env.AZURE_CATALOG_SYNC_MAX_PAGES ?? 10)
});

console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'failed' ? 1 : 0;
