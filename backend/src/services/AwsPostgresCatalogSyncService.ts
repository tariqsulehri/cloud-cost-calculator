import { readFile } from 'node:fs/promises';
import axios from 'axios';
import { PostgresPricingCatalogRepository, type RetailPriceMeterInput } from '../database/PostgresPricingCatalogRepository.js';
import type { AwsPriceListFile } from '../types/awsPriceList.types.js';
import { AwsPublicCatalogSyncService } from './AwsPublicCatalogSyncService.js';

export interface AwsPostgresCatalogSyncOptions {
  filePath?: string;
  sourceUrl?: string;
  offerCode?: string;
  regionCode?: string;
  maxMeters?: number;
}

export interface AwsPostgresCatalogSyncResult {
  syncRunId: number;
  status: 'completed' | 'partial';
  offerCode: string;
  regionCode: string;
  publicationDate: string | null;
  rowsRead: number;
  rowsUpserted: number;
}

export interface AwsPublicOfferSyncTarget {
  offerCode: string;
  regionCode: string;
  sourceUrl?: string;
}

export const AWS_PUBLIC_OFFER_SYNC_TARGETS: AwsPublicOfferSyncTarget[] = [
  { offerCode: 'AmazonEC2', regionCode: 'us-east-1' },
  { offerCode: 'AmazonRDS', regionCode: 'us-east-1' },
  { offerCode: 'AmazonS3', regionCode: 'us-east-1' },
  {
    offerCode: 'AmazonCloudFront',
    regionCode: 'us-east-1',
    sourceUrl: 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonCloudFront/current/index.json'
  },
  { offerCode: 'AmazonElastiCache', regionCode: 'us-east-1' },
  { offerCode: 'AmazonCloudWatch', regionCode: 'us-east-1' },
  { offerCode: 'AWSQueueService', regionCode: 'us-east-1' },
  { offerCode: 'AWSDataTransfer', regionCode: 'us-east-1' },
  { offerCode: 'AWSLambda', regionCode: 'us-east-1' }
];

interface AwsPriceRepository {
  startSyncRun(input: { providerId: 'aws'; source: string; serviceCode?: string | null; regionCode?: string | null; metadata?: unknown }): Promise<number>;
  completeSyncRun(id: number, input: { status: 'completed' | 'partial'; rowsRead: number; rowsUpserted: number; metadata?: unknown }): Promise<void>;
  failSyncRun(id: number, error: unknown, input: { rowsRead?: number; rowsUpserted?: number; metadata?: unknown }): Promise<void>;
  upsertRetailPriceMeters(items: RetailPriceMeterInput[]): Promise<number>;
  close?(): Promise<void>;
}

export class AwsPostgresCatalogSyncService {
  constructor(
    private readonly repository: AwsPriceRepository = new PostgresPricingCatalogRepository(),
    private readonly parser = new AwsPublicCatalogSyncService()
  ) {}

  async sync(options: AwsPostgresCatalogSyncOptions = {}): Promise<AwsPostgresCatalogSyncResult> {
    const offerCode = options.offerCode ?? 'AmazonEC2';
    const regionCode = options.regionCode ?? 'us-east-1';
    const sourceUrl = options.sourceUrl ?? this.defaultRegionalOfferUrl(offerCode, regionCode);
    const source = options.filePath ? 'aws-public-price-list-file' : 'aws-public-price-list';
    let syncRunId = 0;
    let rowsRead = 0;
    let rowsUpserted = 0;

    try {
      syncRunId = await this.repository.startSyncRun({
        providerId: 'aws',
        source,
        serviceCode: offerCode,
        regionCode,
        metadata: {
          filePath: options.filePath ?? null,
          sourceUrl: options.filePath ? null : sourceUrl
        }
      });

      const priceList = await this.loadPriceList({ filePath: options.filePath, sourceUrl });
      const publicationDate = priceList.publicationDate ?? null;
      const parsedOfferCode = priceList.offerCode ?? offerCode;
      const meters = this.parser.toRetailPriceMeters(priceList, parsedOfferCode, options.maxMeters);
      rowsRead = meters.length;
      rowsUpserted = await this.repository.upsertRetailPriceMeters(
        meters.map(
          (meter): RetailPriceMeterInput => ({
            ...meter,
            providerId: 'aws',
            serviceCode: parsedOfferCode,
            skuId: meter.raw && typeof meter.raw === 'object' && 'sku' in meter.raw ? String(meter.raw.sku) : null,
            regionCode: meter.armRegionName ?? regionCode,
            publicationDate
          })
        )
      );

      const status = options.maxMeters && rowsRead >= options.maxMeters ? 'partial' : 'completed';
      await this.repository.completeSyncRun(syncRunId, {
        status,
        rowsRead,
        rowsUpserted,
        metadata: {
          offerCode: parsedOfferCode,
          publicationDate
        }
      });

      return {
        syncRunId,
        status,
        offerCode: parsedOfferCode,
        regionCode,
        publicationDate,
        rowsRead,
        rowsUpserted
      };
    } catch (error) {
      if (syncRunId) {
        await this.repository.failSyncRun(syncRunId, error, { rowsRead, rowsUpserted });
      }
      throw error;
    }
  }

  async syncSupportedOffers(options: { maxMeters?: number } = {}): Promise<{ status: 'completed' | 'partial'; results: AwsPostgresCatalogSyncResult[] }> {
    const results: AwsPostgresCatalogSyncResult[] = [];

    for (const target of AWS_PUBLIC_OFFER_SYNC_TARGETS) {
      results.push(
        await this.sync({
          offerCode: target.offerCode,
          regionCode: target.regionCode,
          sourceUrl: target.sourceUrl,
          maxMeters: options.maxMeters
        })
      );
    }

    return {
      status: results.some((result) => result.status === 'partial') ? 'partial' : 'completed',
      results
    };
  }

  async close(): Promise<void> {
    await this.repository.close?.();
  }

  private async loadPriceList(input: { filePath?: string; sourceUrl: string }): Promise<AwsPriceListFile> {
    if (input.filePath) {
      return JSON.parse(await readFile(input.filePath, 'utf8')) as AwsPriceListFile;
    }

    const response = await axios.get<AwsPriceListFile>(input.sourceUrl, {
      responseType: 'json',
      timeout: 120_000
    });
    return response.data;
  }

  private defaultRegionalOfferUrl(offerCode: string, regionCode: string): string {
    // AWS publishes unauthenticated bulk offer files by service and region; this is the cron/admin-button path.
    return `https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/${encodeURIComponent(offerCode)}/current/${encodeURIComponent(regionCode)}/index.json`;
  }
}
