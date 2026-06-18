import type { Pool, PoolClient } from 'pg';
import { createPool, withTransaction } from './postgres.js';
import type { CloudProvider, RetailPriceMeter } from './CloudCatalogDatabase.js';
import type { AwsRetailPriceMeterInput } from '../types/awsPriceList.types.js';

export interface RetailPriceMeterInput extends AwsRetailPriceMeterInput {
  providerId: CloudProvider;
  serviceCode?: string | null;
  skuId?: string | null;
  regionCode?: string | null;
  effectiveDate?: string | null;
  publicationDate?: string | null;
}

interface RetailPriceMeterDbRow {
  id: string;
  provider_id: CloudProvider;
  service_name: string;
  service_family: string | null;
  product_name: string;
  sku_name: string;
  arm_sku_name: string | null;
  meter_id: string | null;
  meter_name: string;
  arm_region_name: string | null;
  location: string | null;
  unit_of_measure: string;
  price_type: string | null;
  currency_code: string;
  retail_price: string;
  unit_price: string;
  tier_minimum_units: string;
  updated_at: Date;
}

export interface CatalogSyncRunSummary {
  id: number;
  providerId: CloudProvider;
  source: string;
  serviceCode: string | null;
  regionCode: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  rowsRead: number;
  rowsUpserted: number;
  errorMessage: string | null;
  metadata: unknown;
}

export interface RetailPriceMeterListFilters {
  provider?: CloudProvider;
  serviceName?: string;
  serviceCode?: string;
  region?: string;
  productName?: string;
  skuName?: string;
  armSkuName?: string;
  meterName?: string;
  priceType?: string;
  currencyCode?: string;
  query?: string;
  limit?: number;
}

interface CatalogSyncRunDbRow {
  id: string;
  provider_id: CloudProvider;
  source: string;
  service_code: string | null;
  region_code: string | null;
  status: string;
  started_at: Date;
  completed_at: Date | null;
  rows_read: number;
  rows_upserted: number;
  error_message: string | null;
  metadata: unknown;
}

export class PostgresPricingCatalogRepository {
  constructor(private readonly pool: Pool = createPool()) {}

  async close(): Promise<void> {
    await this.pool.end();
  }

  async startSyncRun(input: { providerId: CloudProvider; source: string; serviceCode?: string | null; regionCode?: string | null; metadata?: unknown }): Promise<number> {
    const result = await this.pool.query<{ id: string }>(
      `insert into catalog_sync_runs (provider_id, source, service_code, region_code, status, metadata)
       values ($1, $2, $3, $4, 'running', $5::jsonb)
       returning id`,
      [input.providerId, input.source, input.serviceCode ?? null, input.regionCode ?? null, JSON.stringify(input.metadata ?? {})]
    );
    return Number(result.rows[0].id);
  }

  async completeSyncRun(id: number, input: { status: 'completed' | 'partial'; rowsRead: number; rowsUpserted: number; metadata?: unknown }): Promise<void> {
    await this.pool.query(
      `update catalog_sync_runs
       set status = $1,
           completed_at = now(),
           rows_read = $2,
           rows_upserted = $3,
           metadata = metadata || $4::jsonb
       where id = $5`,
      [input.status, input.rowsRead, input.rowsUpserted, JSON.stringify(input.metadata ?? {}), id]
    );
  }

  async failSyncRun(id: number, error: unknown, input: { rowsRead?: number; rowsUpserted?: number; metadata?: unknown } = {}): Promise<void> {
    await this.pool.query(
      `update catalog_sync_runs
       set status = 'failed',
           completed_at = now(),
           rows_read = $1,
           rows_upserted = $2,
           error_message = $3,
           metadata = metadata || $4::jsonb
       where id = $5`,
      [input.rowsRead ?? 0, input.rowsUpserted ?? 0, error instanceof Error ? error.message : String(error), JSON.stringify(input.metadata ?? {}), id]
    );
  }

  async upsertRetailPriceMeters(items: RetailPriceMeterInput[]): Promise<number> {
    if (items.length === 0) {
      return 0;
    }

    const client = await this.pool.connect();
    try {
      await withTransaction(client, async () => {
        for (const item of items) {
          await this.upsertRetailPriceMeter(client, item);
        }
      });
    } finally {
      client.release();
    }

    return items.length;
  }

  async listRetailPriceMeters(filters: RetailPriceMeterListFilters = {}): Promise<RetailPriceMeter[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.provider) {
      values.push(filters.provider);
      conditions.push(`provider_id = $${values.length}`);
    }

    if (filters.serviceCode) {
      values.push(filters.serviceCode);
      conditions.push(`service_code = $${values.length}`);
    }

    if (filters.serviceName) {
      values.push(filters.serviceName);
      conditions.push(`service_name = $${values.length}`);
    }

    if (filters.region) {
      values.push(filters.region);
      conditions.push(`region_code = $${values.length}`);
    }

    if (filters.productName) {
      values.push(filters.productName);
      conditions.push(`product_name = $${values.length}`);
    }

    if (filters.skuName) {
      values.push(filters.skuName);
      conditions.push(`sku_name = $${values.length}`);
    }

    if (filters.armSkuName) {
      values.push(filters.armSkuName);
      conditions.push(`arm_sku_name = $${values.length}`);
    }

    if (filters.meterName) {
      values.push(filters.meterName);
      conditions.push(`meter_name = $${values.length}`);
    }

    if (filters.priceType) {
      values.push(filters.priceType);
      conditions.push(`price_type = $${values.length}`);
    }

    if (filters.currencyCode) {
      values.push(filters.currencyCode);
      conditions.push(`currency_code = $${values.length}`);
    }

    if (filters.query) {
      values.push(`%${filters.query.toLowerCase()}%`);
      const index = values.length;
      conditions.push(`(lower(service_name) like $${index} or lower(product_name) like $${index} or lower(sku_name) like $${index} or lower(meter_name) like $${index})`);
    }

    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 5000);
    values.push(limit);

    const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
    const result = await this.pool.query<RetailPriceMeterDbRow>(
      `select id, provider_id, service_name, service_family, product_name, sku_name,
              arm_sku_name, meter_id, meter_name, arm_region_name, location, unit_of_measure,
              price_type, currency_code, retail_price, unit_price, tier_minimum_units, updated_at
       from retail_price_meters
       ${where}
       order by service_name, product_name, sku_name, meter_name
       limit $${values.length}`,
      values
    );

    return result.rows.map((row) => this.toRetailPriceMeter(row));
  }

  async countRetailPriceMeters(filters: { provider?: CloudProvider; serviceName?: string; region?: string } = {}): Promise<number> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.provider) {
      values.push(filters.provider);
      conditions.push(`provider_id = $${values.length}`);
    }
    if (filters.serviceName) {
      values.push(filters.serviceName);
      conditions.push(`service_name = $${values.length}`);
    }
    if (filters.region) {
      values.push(filters.region);
      conditions.push(`region_code = $${values.length}`);
    }

    const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
    const result = await this.pool.query<{ count: string }>(`select count(*)::text as count from retail_price_meters ${where}`, values);
    return Number(result.rows[0]?.count ?? 0);
  }

  async listSyncRuns(filters: { provider?: CloudProvider; serviceCode?: string; limit?: number } = {}): Promise<CatalogSyncRunSummary[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.provider) {
      values.push(filters.provider);
      conditions.push(`provider_id = $${values.length}`);
    }
    if (filters.serviceCode) {
      values.push(filters.serviceCode);
      conditions.push(`service_code = $${values.length}`);
    }

    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
    values.push(limit);
    const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
    const result = await this.pool.query<CatalogSyncRunDbRow>(
      `select id, provider_id, source, service_code, region_code, status, started_at,
              completed_at, rows_read, rows_upserted, error_message, metadata
       from catalog_sync_runs
       ${where}
       order by started_at desc
       limit $${values.length}`,
      values
    );

    return result.rows.map((row) => ({
      id: Number(row.id),
      providerId: row.provider_id,
      source: row.source,
      serviceCode: row.service_code,
      regionCode: row.region_code,
      status: row.status,
      startedAt: row.started_at.toISOString(),
      completedAt: row.completed_at?.toISOString() ?? null,
      rowsRead: row.rows_read,
      rowsUpserted: row.rows_upserted,
      errorMessage: row.error_message,
      metadata: row.metadata
    }));
  }

  private async upsertRetailPriceMeter(client: PoolClient, item: RetailPriceMeterInput): Promise<void> {
    await client.query(
      `insert into retail_price_meters (
         provider_id, price_key, service_code, service_name, service_family, product_name,
         sku_id, sku_name, arm_sku_name, meter_id, meter_name, region_code, arm_region_name,
         location, unit_of_measure, price_type, currency_code, retail_price, unit_price,
         tier_minimum_units, effective_date, publication_date, raw_json, updated_at
       )
       values (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, $12, $13,
         $14, $15, $16, $17, $18, $19,
         $20, $21, $22, $23::jsonb, now()
       )
       on conflict(provider_id, price_key) do update set
         service_code = excluded.service_code,
         service_name = excluded.service_name,
         service_family = excluded.service_family,
         product_name = excluded.product_name,
         sku_id = excluded.sku_id,
         sku_name = excluded.sku_name,
         arm_sku_name = excluded.arm_sku_name,
         meter_id = excluded.meter_id,
         meter_name = excluded.meter_name,
         region_code = excluded.region_code,
         arm_region_name = excluded.arm_region_name,
         location = excluded.location,
         unit_of_measure = excluded.unit_of_measure,
         price_type = excluded.price_type,
         currency_code = excluded.currency_code,
         retail_price = excluded.retail_price,
         unit_price = excluded.unit_price,
         tier_minimum_units = excluded.tier_minimum_units,
         effective_date = excluded.effective_date,
         publication_date = excluded.publication_date,
         raw_json = excluded.raw_json,
         updated_at = now()`,
      [
        item.providerId,
        item.priceKey,
        item.serviceCode ?? item.serviceName,
        item.serviceName,
        item.serviceFamily,
        item.productName,
        item.skuId ?? null,
        item.skuName,
        item.armSkuName,
        item.meterId,
        item.meterName,
        item.regionCode ?? item.armRegionName,
        item.armRegionName,
        item.location,
        item.unitOfMeasure,
        item.priceType,
        item.currencyCode,
        item.retailPrice,
        item.unitPrice,
        item.tierMinimumUnits,
        item.effectiveDate ?? null,
        item.publicationDate ?? null,
        JSON.stringify(item.raw)
      ]
    );
  }

  private toRetailPriceMeter(row: RetailPriceMeterDbRow): RetailPriceMeter {
    return {
      id: Number(row.id),
      providerId: row.provider_id,
      serviceName: row.service_name,
      serviceFamily: row.service_family,
      productName: row.product_name,
      skuName: row.sku_name,
      armSkuName: row.arm_sku_name,
      meterId: row.meter_id,
      meterName: row.meter_name,
      armRegionName: row.arm_region_name,
      location: row.location,
      unitOfMeasure: row.unit_of_measure,
      priceType: row.price_type,
      currencyCode: row.currency_code,
      retailPrice: Number(row.retail_price),
      unitPrice: Number(row.unit_price),
      tierMinimumUnits: Number(row.tier_minimum_units),
      updatedAt: row.updated_at.toISOString()
    };
  }
}
