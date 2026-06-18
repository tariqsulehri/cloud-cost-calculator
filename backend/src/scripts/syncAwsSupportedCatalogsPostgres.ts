import { AwsPostgresCatalogSyncService } from '../services/AwsPostgresCatalogSyncService.js';

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const maxMeters = option('maxMeters') ? Number(option('maxMeters')) : undefined;
const service = new AwsPostgresCatalogSyncService();

try {
  const result = await service.syncSupportedOffers({
    maxMeters: Number.isFinite(maxMeters) ? maxMeters : undefined
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await service.close();
}
