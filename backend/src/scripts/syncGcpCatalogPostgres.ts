import { GcpCloudBillingCatalogSyncService } from '../services/GcpCloudBillingCatalogSyncService.js';

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const service = new GcpCloudBillingCatalogSyncService();

try {
  const result = await service.sync({
    serviceName: option('service') ?? 'Compute Engine',
    regionCode: option('region') ?? process.env.GCP_CATALOG_SYNC_REGION ?? 'us-east1',
    currencyCode: option('currency') ?? 'USD',
    maxSkus: option('maxSkus') ? Number(option('maxSkus')) : undefined,
    pageSize: option('pageSize') ? Number(option('pageSize')) : undefined,
    query: option('query')
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await service.close();
}
