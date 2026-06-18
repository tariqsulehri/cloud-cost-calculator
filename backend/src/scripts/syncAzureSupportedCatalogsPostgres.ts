import { AzurePostgresCatalogSyncService } from '../services/AzurePostgresCatalogSyncService.js';

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const maxPages = option('maxPages') ? Number(option('maxPages')) : undefined;
const service = new AzurePostgresCatalogSyncService();

try {
  const result = await service.syncSupportedServices({
    maxPages: Number.isFinite(maxPages) ? maxPages : undefined
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await service.close();
}
