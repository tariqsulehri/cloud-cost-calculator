import { GcpCloudBillingCatalogSyncService } from '../services/GcpCloudBillingCatalogSyncService.js';

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const maxSkus = option('maxSkus') ? Number(option('maxSkus')) : undefined;
const service = new GcpCloudBillingCatalogSyncService();

try {
  const result = await service.syncSupportedServices({
    maxSkus: Number.isFinite(maxSkus) ? maxSkus : undefined
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await service.close();
}
