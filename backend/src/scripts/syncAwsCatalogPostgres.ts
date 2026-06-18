import { resolve } from 'node:path';
import { AwsPostgresCatalogSyncService } from '../services/AwsPostgresCatalogSyncService.js';

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const fileOption = option('file') ?? process.env.AWS_CATALOG_SYNC_FILE;
const filePath = fileOption ? resolve(process.cwd(), fileOption) : undefined;
const sourceUrl = option('sourceUrl') ?? process.env.AWS_CATALOG_SYNC_SOURCE_URL;
const maxMeters = option('maxMeters') ? Number(option('maxMeters')) : undefined;
const offerCode = option('offer') ?? 'AmazonEC2';
const regionCode = option('region') ?? 'us-east-1';
const service = new AwsPostgresCatalogSyncService();

try {
  const result = await service.sync({
    filePath,
    sourceUrl,
    offerCode,
    regionCode,
    maxMeters: Number.isFinite(maxMeters) ? maxMeters : undefined
  });
  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await service.close();
}
