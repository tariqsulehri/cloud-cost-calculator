import { resolve } from 'node:path';
import { AwsPublicCatalogSyncService } from '../services/AwsPublicCatalogSyncService.js';

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const filePath = resolve(process.cwd(), option('file') ?? process.env.AWS_CATALOG_SYNC_FILE ?? '../data/aws-prices.json');
const maxMeters = option('maxMeters') ? Number(option('maxMeters')) : undefined;

const service = new AwsPublicCatalogSyncService();
const result = await service.syncFromFile({
  filePath,
  offerCode: option('offer'),
  maxMeters: Number.isFinite(maxMeters) ? maxMeters : undefined
});

console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'failed' ? 1 : 0;
