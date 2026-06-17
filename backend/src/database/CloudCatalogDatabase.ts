import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';
import type { AzureRetailPriceItem } from '../types/azure.types.js';
import type { NormalizedComponentType } from '../types/estimate.types.js';

type BetterSqliteDatabase = Database.Database;
type SqlInputValue = null | number | bigint | string | Buffer | Uint8Array;

export type CloudProvider = 'azure' | 'aws' | 'gcp';

export interface CatalogServiceRow {
  id: number;
  serviceKey: string;
  providerId: CloudProvider;
  componentType: NormalizedComponentType;
  canonicalName: string;
  providerNamespace: string | null;
  pricingServiceName: string | null;
  serviceFamily: string | null;
  defaultPricingStatus: string;
}

export interface CatalogServiceListItem extends CatalogServiceRow {
  aliases: string[];
  requiredFields: string[];
}

export interface ProviderServiceHints {
  azure: string | null;
  aws: string | null;
  gcp: string | null;
}

export interface RetailPriceMeter {
  id: number;
  providerId: CloudProvider;
  serviceName: string;
  serviceFamily: string | null;
  productName: string;
  skuName: string;
  armSkuName: string | null;
  meterId: string | null;
  meterName: string;
  armRegionName: string | null;
  location: string | null;
  unitOfMeasure: string;
  priceType: string | null;
  currencyCode: string;
  retailPrice: number;
  unitPrice: number;
  tierMinimumUnits: number;
  updatedAt: string;
}

interface RetailPriceMeterDbRow {
  id: number;
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
  retail_price: number;
  unit_price: number;
  tier_minimum_units: number;
  updated_at: string;
}

interface SeedService {
  serviceKey: string;
  componentType: NormalizedComponentType;
  aliases: string[];
  providers: Record<
    CloudProvider,
    {
      canonicalName: string;
      providerNamespace?: string | null;
      pricingServiceName?: string | null;
      serviceFamily?: string | null;
    }
  >;
}

interface CatalogServiceDbRow {
  id: number;
  service_key: string;
  provider_id: CloudProvider;
  component_type: NormalizedComponentType;
  canonical_name: string;
  provider_namespace: string | null;
  pricing_service_name: string | null;
  service_family: string | null;
  default_pricing_status: string;
}

const providers: Array<{ id: CloudProvider; name: string }> = [
  { id: 'azure', name: 'Microsoft Azure' },
  { id: 'aws', name: 'Amazon Web Services' },
  { id: 'gcp', name: 'Google Cloud Platform' }
];

const seedServices: SeedService[] = [
  {
    serviceKey: 'compute',
    componentType: 'compute',
    aliases: ['virtual machine', 'virtual machines', 'vm', 'vms', 'server', 'web server', 'compute', 'ec2', 'compute engine'],
    providers: {
      azure: { canonicalName: 'Azure Virtual Machines', providerNamespace: 'Microsoft.Compute', pricingServiceName: 'Virtual Machines', serviceFamily: 'Compute' },
      aws: { canonicalName: 'Amazon EC2', pricingServiceName: 'AmazonEC2', serviceFamily: 'Compute' },
      gcp: { canonicalName: 'Compute Engine', pricingServiceName: 'Compute Engine', serviceFamily: 'Compute' }
    }
  },
  {
    serviceKey: 'kubernetes',
    componentType: 'kubernetes',
    aliases: ['kubernetes', 'k8s', 'aks', 'eks', 'gke', 'container orchestration', 'worker nodes'],
    providers: {
      azure: {
        canonicalName: 'Azure Kubernetes Service (AKS)',
        providerNamespace: 'Microsoft.ContainerService',
        pricingServiceName: 'Azure Kubernetes Service',
        serviceFamily: 'Compute'
      },
      aws: { canonicalName: 'Amazon EKS', pricingServiceName: 'AmazonEKS', serviceFamily: 'Compute' },
      gcp: { canonicalName: 'Google Kubernetes Engine', pricingServiceName: 'Kubernetes Engine', serviceFamily: 'Compute' }
    }
  },
  {
    serviceKey: 'database.postgresql',
    componentType: 'database',
    aliases: ['postgres', 'postgresql', 'managed postgresql', 'postgres database', 'relational database', 'rds postgres', 'cloud sql postgresql'],
    providers: {
      azure: {
        canonicalName: 'Azure Database for PostgreSQL Flexible Server',
        providerNamespace: 'Microsoft.DBforPostgreSQL',
        pricingServiceName: 'Azure Database for PostgreSQL',
        serviceFamily: 'Databases'
      },
      aws: { canonicalName: 'Amazon RDS for PostgreSQL', pricingServiceName: 'AmazonRDS', serviceFamily: 'Databases' },
      gcp: { canonicalName: 'Cloud SQL for PostgreSQL', pricingServiceName: 'Cloud SQL', serviceFamily: 'Databases' }
    }
  },
  {
    serviceKey: 'cache.redis',
    componentType: 'cache',
    aliases: ['redis', 'redis cache', 'cache', 'session cache', 'elasticache redis', 'memorystore redis'],
    providers: {
      azure: { canonicalName: 'Azure Cache for Redis', providerNamespace: 'Microsoft.Cache', pricingServiceName: 'Azure Cache for Redis', serviceFamily: 'Databases' },
      aws: { canonicalName: 'Amazon ElastiCache for Redis', pricingServiceName: 'AmazonElastiCache', serviceFamily: 'Databases' },
      gcp: { canonicalName: 'Memorystore for Redis', pricingServiceName: 'Memorystore', serviceFamily: 'Databases' }
    }
  },
  {
    serviceKey: 'object_storage',
    componentType: 'object_storage',
    aliases: ['object storage', 'blob storage', 's3', 'cloud storage', 'product images', 'invoices', 'exported reports', 'static files'],
    providers: {
      azure: { canonicalName: 'Azure Blob Storage', providerNamespace: 'Microsoft.Storage', pricingServiceName: 'Storage', serviceFamily: 'Storage' },
      aws: { canonicalName: 'Amazon S3', pricingServiceName: 'AmazonS3', serviceFamily: 'Storage' },
      gcp: { canonicalName: 'Cloud Storage', pricingServiceName: 'Cloud Storage', serviceFamily: 'Storage' }
    }
  },
  {
    serviceKey: 'block_storage',
    componentType: 'block_storage',
    aliases: ['block storage', 'managed disk', 'managed disks', 'ebs', 'persistent disk'],
    providers: {
      azure: { canonicalName: 'Azure Managed Disks', providerNamespace: 'Microsoft.Compute', pricingServiceName: 'Storage', serviceFamily: 'Storage' },
      aws: { canonicalName: 'Amazon EBS', pricingServiceName: 'AmazonEC2', serviceFamily: 'Storage' },
      gcp: { canonicalName: 'Persistent Disk', pricingServiceName: 'Compute Engine', serviceFamily: 'Storage' }
    }
  },
  {
    serviceKey: 'file_storage',
    componentType: 'file_storage',
    aliases: ['file storage', 'file share', 'azure files', 'efs', 'filestore'],
    providers: {
      azure: { canonicalName: 'Azure Files', providerNamespace: 'Microsoft.Storage', pricingServiceName: 'Storage', serviceFamily: 'Storage' },
      aws: { canonicalName: 'Amazon EFS', pricingServiceName: 'AmazonEFS', serviceFamily: 'Storage' },
      gcp: { canonicalName: 'Filestore', pricingServiceName: 'Cloud Filestore', serviceFamily: 'Storage' }
    }
  },
  {
    serviceKey: 'cdn',
    componentType: 'cdn',
    aliases: ['cdn', 'content delivery', 'static assets', 'cloudfront', 'cloud cdn', 'front door'],
    providers: {
      azure: { canonicalName: 'Azure CDN / Azure Front Door', providerNamespace: 'Microsoft.Cdn', pricingServiceName: 'Azure CDN', serviceFamily: 'Networking' },
      aws: { canonicalName: 'Amazon CloudFront', pricingServiceName: 'AmazonCloudFront', serviceFamily: 'Networking' },
      gcp: { canonicalName: 'Cloud CDN', pricingServiceName: 'Cloud CDN', serviceFamily: 'Networking' }
    }
  },
  {
    serviceKey: 'load_balancer.generic',
    componentType: 'load_balancer',
    aliases: ['load balancer', 'ingress', 'balancer'],
    providers: {
      azure: { canonicalName: 'Azure Load Balancer / Application Gateway', providerNamespace: 'Microsoft.Network', pricingServiceName: 'Load Balancer', serviceFamily: 'Networking' },
      aws: { canonicalName: 'Elastic Load Balancing', pricingServiceName: 'AWSELB', serviceFamily: 'Networking' },
      gcp: { canonicalName: 'Cloud Load Balancing', pricingServiceName: 'Cloud Load Balancing', serviceFamily: 'Networking' }
    }
  },
  {
    serviceKey: 'load_balancer.http_s',
    componentType: 'load_balancer',
    aliases: ['http load balancer', 'https load balancer', 'http/s load balancer', 'application gateway', 'application load balancer', 'layer 7 load balancer', 'l7 load balancer'],
    providers: {
      azure: { canonicalName: 'Azure Application Gateway', providerNamespace: 'Microsoft.Network', pricingServiceName: 'Application Gateway', serviceFamily: 'Networking' },
      aws: { canonicalName: 'Application Load Balancer', pricingServiceName: 'AWSELB', serviceFamily: 'Networking' },
      gcp: { canonicalName: 'External Application Load Balancer', pricingServiceName: 'Cloud Load Balancing', serviceFamily: 'Networking' }
    }
  },
  {
    serviceKey: 'load_balancer.tcp',
    componentType: 'load_balancer',
    aliases: ['tcp load balancer', 'network load balancer', 'layer 4 load balancer', 'l4 load balancer'],
    providers: {
      azure: { canonicalName: 'Azure Load Balancer', providerNamespace: 'Microsoft.Network', pricingServiceName: 'Load Balancer', serviceFamily: 'Networking' },
      aws: { canonicalName: 'Network Load Balancer', pricingServiceName: 'AWSELB', serviceFamily: 'Networking' },
      gcp: { canonicalName: 'Network Load Balancer', pricingServiceName: 'Cloud Load Balancing', serviceFamily: 'Networking' }
    }
  },
  {
    serviceKey: 'queue',
    componentType: 'queue',
    aliases: ['message queue', 'event bus', 'asynchronous events', 'messages', 'messaging', 'service bus', 'sqs', 'pubsub', 'pub/sub'],
    providers: {
      azure: { canonicalName: 'Azure Service Bus', providerNamespace: 'Microsoft.ServiceBus', pricingServiceName: 'Service Bus', serviceFamily: 'Integration' },
      aws: { canonicalName: 'Amazon SQS / Amazon EventBridge', pricingServiceName: 'AmazonSQS', serviceFamily: 'Application Integration' },
      gcp: { canonicalName: 'Pub/Sub', pricingServiceName: 'Cloud Pub/Sub', serviceFamily: 'Application Integration' }
    }
  },
  {
    serviceKey: 'monitoring',
    componentType: 'monitoring',
    aliases: ['monitoring', 'logging', 'logs', 'log analytics', 'cloudwatch', 'cloud monitoring'],
    providers: {
      azure: { canonicalName: 'Azure Monitor / Log Analytics', providerNamespace: 'Microsoft.Insights', pricingServiceName: 'Azure Monitor', serviceFamily: 'Management and Governance' },
      aws: { canonicalName: 'Amazon CloudWatch', pricingServiceName: 'AmazonCloudWatch', serviceFamily: 'Management and Governance' },
      gcp: { canonicalName: 'Cloud Monitoring / Cloud Logging', pricingServiceName: 'Cloud Logging', serviceFamily: 'Management Tools' }
    }
  },
  {
    serviceKey: 'network.egress',
    componentType: 'network',
    aliases: ['internet egress', 'egress', 'outbound data transfer', 'data transfer', 'bandwidth'],
    providers: {
      azure: { canonicalName: 'Azure Bandwidth', providerNamespace: 'Microsoft.Network', pricingServiceName: 'Bandwidth', serviceFamily: 'Networking' },
      aws: { canonicalName: 'AWS Data Transfer', pricingServiceName: 'AWSDataTransfer', serviceFamily: 'Networking' },
      gcp: { canonicalName: 'Network Data Transfer', pricingServiceName: 'Networking', serviceFamily: 'Networking' }
    }
  },
  {
    serviceKey: 'network.private',
    componentType: 'network',
    aliases: [
      'virtual private network',
      'virtual private cloud',
      'private network',
      'cloud network',
      'vpc',
      'vnet',
      'virtual network',
      'subnet',
      'subnets'
    ],
    providers: {
      azure: { canonicalName: 'Azure Virtual Network', providerNamespace: 'Microsoft.Network', pricingServiceName: 'Virtual Network', serviceFamily: 'Networking' },
      aws: { canonicalName: 'Amazon Virtual Private Cloud (VPC)', pricingServiceName: 'AmazonVPC', serviceFamily: 'Networking' },
      gcp: { canonicalName: 'Virtual Private Cloud (VPC)', pricingServiceName: 'Virtual Private Cloud', serviceFamily: 'Networking' }
    }
  },
  {
    serviceKey: 'backup',
    componentType: 'backup',
    aliases: ['backup', 'backup service', 'managed backup', 'azure backup', 'aws backup'],
    providers: {
      azure: { canonicalName: 'Azure Backup', providerNamespace: 'Microsoft.RecoveryServices', pricingServiceName: 'Azure Backup', serviceFamily: 'Storage' },
      aws: { canonicalName: 'AWS Backup', pricingServiceName: 'AWSBackup', serviceFamily: 'Storage' },
      gcp: { canonicalName: 'Backup and DR Service', pricingServiceName: 'Backup and DR', serviceFamily: 'Storage' }
    }
  },
  {
    serviceKey: 'serverless',
    componentType: 'serverless',
    aliases: ['serverless', 'function', 'functions', 'lambda', 'cloud functions', 'cloud run'],
    providers: {
      azure: { canonicalName: 'Azure Functions', providerNamespace: 'Microsoft.Web', pricingServiceName: 'Functions', serviceFamily: 'Compute' },
      aws: { canonicalName: 'AWS Lambda', pricingServiceName: 'AWSLambda', serviceFamily: 'Compute' },
      gcp: { canonicalName: 'Cloud Functions / Cloud Run', pricingServiceName: 'Cloud Functions', serviceFamily: 'Compute' }
    }
  },
  {
    serviceKey: 'security',
    componentType: 'security',
    aliases: ['security', 'defender', 'security hub', 'security command center'],
    providers: {
      azure: { canonicalName: 'Microsoft Defender for Cloud', providerNamespace: 'Microsoft.Security', pricingServiceName: 'Microsoft Defender for Cloud', serviceFamily: 'Security' },
      aws: { canonicalName: 'AWS Security Hub', pricingServiceName: 'AWSSecurityHub', serviceFamily: 'Security' },
      gcp: { canonicalName: 'Security Command Center', pricingServiceName: 'Security Command Center', serviceFamily: 'Security' }
    }
  }
];

const requiredFieldsByComponent: Partial<Record<NormalizedComponentType, string[]>> = {
  compute: ['quantity', 'vcpu', 'memoryGb', 'operatingSystem', 'imageType', 'monthlyHours'],
  kubernetes: ['nodeCount', 'vcpuPerNode', 'memoryGbPerNode', 'operatingSystem', 'imageType', 'monthlyHours'],
  database: ['engine', 'managed', 'vcpu', 'memoryGb', 'storageGb', 'storageType', 'highAvailability'],
  cache: ['engine', 'memoryGb', 'tier'],
  object_storage: ['dataStoredGb', 'accessTier', 'redundancy'],
  cdn: ['dataTransferGb', 'tier'],
  load_balancer: ['target', 'scheme'],
  queue: ['messageVolume', 'tier'],
  monitoring: ['logIngestionGb', 'retentionDays'],
  network: ['monthlyEgressGb'],
  backup: ['protectedDataGb', 'retentionDays']
};

export class CloudCatalogDatabase {
  private db: BetterSqliteDatabase | null = null;

  constructor(private readonly options: { path?: string } = {}) {}

  providerHintsForServiceKey(serviceKey: string): ProviderServiceHints | null {
    const rows = this.connection
      .prepare(
        `select provider_id, canonical_name
         from cloud_services
         where service_key = ?
         order by provider_id`
      )
      .all(serviceKey) as Array<{ provider_id: CloudProvider; canonical_name: string }>;

    if (rows.length === 0) {
      return null;
    }

    return rows.reduce<ProviderServiceHints>(
      (hints, row) => ({
        ...hints,
        [row.provider_id]: row.canonical_name
      }),
      { azure: null, aws: null, gcp: null }
    );
  }

  listServices(filters: { provider?: CloudProvider; query?: string } = {}): CatalogServiceListItem[] {
    const conditions: string[] = [];
    const params: SqlInputValue[] = [];

    if (filters.provider) {
      conditions.push('provider_id = ?');
      params.push(filters.provider);
    }

    if (filters.query) {
      const normalizedQuery = `%${this.normalizeAlias(filters.query)}%`;
      conditions.push(
        `(lower(canonical_name) like ?
          or service_key like ?
          or exists (
            select 1 from service_aliases a
            where a.service_id = cloud_services.id
              and a.normalized_alias like ?
          ))`
      );
      params.push(normalizedQuery, normalizedQuery, normalizedQuery);
    }

    const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
    const rows = this.connection
      .prepare(
        `select id, service_key, provider_id, component_type, canonical_name, provider_namespace,
                pricing_service_name, service_family, default_pricing_status
         from cloud_services
         ${where}
         order by component_type, service_key, provider_id`
      )
      .all(...params) as unknown as CatalogServiceDbRow[];

    return rows.map((row) => this.toServiceListItem(row));
  }

  requiredFields(providerId: CloudProvider, componentType: NormalizedComponentType): string[] {
    const rows = this.connection
      .prepare(
        `select field_name
         from pricing_required_fields
         where provider_id = ? and component_type = ?
         order by priority, field_name`
      )
      .all(providerId, componentType) as Array<{ field_name: string }>;

    return rows.map((row) => row.field_name);
  }

  upsertAzureRetailPriceMeters(items: AzureRetailPriceItem[]): number {
    if (items.length === 0) {
      return 0;
    }

    const statement = this.connection.prepare(
      `insert into retail_price_meters (
         provider_id, price_key, service_name, service_family, product_name, sku_name,
         arm_sku_name, meter_id, meter_name, arm_region_name, location, unit_of_measure,
         price_type, currency_code, retail_price, unit_price, tier_minimum_units, raw_json, updated_at
       )
       values ('azure', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, current_timestamp)
       on conflict(provider_id, price_key) do update set
         service_name = excluded.service_name,
         service_family = excluded.service_family,
         product_name = excluded.product_name,
         sku_name = excluded.sku_name,
         arm_sku_name = excluded.arm_sku_name,
         meter_id = excluded.meter_id,
         meter_name = excluded.meter_name,
         arm_region_name = excluded.arm_region_name,
         location = excluded.location,
         unit_of_measure = excluded.unit_of_measure,
         price_type = excluded.price_type,
         currency_code = excluded.currency_code,
         retail_price = excluded.retail_price,
         unit_price = excluded.unit_price,
         tier_minimum_units = excluded.tier_minimum_units,
         raw_json = excluded.raw_json,
         updated_at = current_timestamp`
    );

    this.connection.exec('begin immediate transaction');
    try {
      items.forEach((item) => {
        const retailPrice = item.retailPrice ?? item.unitPrice ?? 0;
        const unitPrice = item.unitPrice ?? retailPrice;
        statement.run(
          this.azurePriceKey(item),
          item.serviceName ?? '',
          item.serviceFamily ?? null,
          item.productName ?? '',
          item.skuName ?? '',
          item.armSkuName ?? null,
          item.meterId ?? null,
          item.meterName ?? '',
          item.armRegionName ?? null,
          item.location ?? null,
          item.unitOfMeasure ?? '',
          item.priceType ?? item.type ?? null,
          item.currencyCode ?? 'USD',
          retailPrice,
          unitPrice,
          item.tierMinimumUnits ?? 0,
          JSON.stringify(item)
        );
      });
      this.connection.exec('commit');
    } catch (error) {
      this.connection.exec('rollback');
      throw error;
    }

    return items.length;
  }

  listRetailPriceMeters(filters: { provider?: CloudProvider; serviceName?: string; region?: string; query?: string; limit?: number } = {}): RetailPriceMeter[] {
    const conditions: string[] = [];
    const params: SqlInputValue[] = [];

    if (filters.provider) {
      conditions.push('provider_id = ?');
      params.push(filters.provider);
    }

    if (filters.serviceName) {
      conditions.push('service_name = ?');
      params.push(filters.serviceName);
    }

    if (filters.region) {
      conditions.push('arm_region_name = ?');
      params.push(filters.region);
    }

    if (filters.query) {
      const query = `%${filters.query.toLowerCase()}%`;
      conditions.push(`(lower(service_name) like ? or lower(product_name) like ? or lower(sku_name) like ? or lower(meter_name) like ?)`);
      params.push(query, query, query, query);
    }

    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
    const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
    const rows = this.connection
      .prepare(
        `select id, provider_id, service_name, service_family, product_name, sku_name,
                arm_sku_name, meter_id, meter_name, arm_region_name, location, unit_of_measure,
                price_type, currency_code, retail_price, unit_price, tier_minimum_units, updated_at
         from retail_price_meters
         ${where}
         order by service_name, product_name, sku_name, meter_name
         limit ?`
      )
      .all(...params, limit) as unknown as RetailPriceMeterDbRow[];

    return rows.map((row) => this.toRetailPriceMeter(row));
  }

  startSyncRun(providerId: CloudProvider, source: string): number {
    const result = this.connection
      .prepare(
        `insert into catalog_sync_runs (provider_id, source, status)
         values (?, ?, 'running')`
      )
      .run(providerId, source);
    return Number(result.lastInsertRowid);
  }

  completeSyncRun(id: number, status: 'completed' | 'partial', rowsUpserted: number): void {
    this.connection
      .prepare(
        `update catalog_sync_runs
         set status = ?, completed_at = current_timestamp, rows_upserted = ?
         where id = ?`
      )
      .run(status, rowsUpserted, id);
  }

  failSyncRun(id: number, error: unknown, rowsUpserted: number): void {
    this.connection
      .prepare(
        `update catalog_sync_runs
         set status = 'failed', completed_at = current_timestamp, rows_upserted = ?, error_message = ?
         where id = ?`
      )
      .run(rowsUpserted, error instanceof Error ? error.message : String(error), id);
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }

  private get connection(): BetterSqliteDatabase {
    if (!this.db) {
      this.db = this.open();
      this.initialize();
    }

    return this.db;
  }

  private open(): BetterSqliteDatabase {
    const dbPath = this.options.path ?? process.env.CATALOG_DB_PATH ?? (process.env.NODE_ENV === 'test' ? ':memory:' : resolve(process.cwd(), 'data/cloud-catalog.sqlite'));
    if (dbPath !== ':memory:') {
      mkdirSync(dirname(dbPath), { recursive: true });
    }

    return new Database(dbPath, { timeout: 5000 });
  }

  private initialize(): void {
    const db = this.db;
    if (!db) {
      return;
    }

    db.exec(`
      pragma foreign_keys = on;

      create table if not exists providers (
        id text primary key,
        name text not null
      );

      create table if not exists cloud_services (
        id integer primary key autoincrement,
        service_key text not null,
        provider_id text not null references providers(id),
        component_type text not null,
        canonical_name text not null,
        provider_namespace text,
        pricing_service_name text,
        service_family text,
        default_pricing_status text not null default 'cataloged',
        created_at text not null default current_timestamp,
        updated_at text not null default current_timestamp,
        unique(provider_id, service_key)
      );

      create table if not exists service_aliases (
        id integer primary key autoincrement,
        service_id integer not null references cloud_services(id) on delete cascade,
        alias text not null,
        normalized_alias text not null,
        unique(service_id, normalized_alias)
      );

      create table if not exists pricing_required_fields (
        id integer primary key autoincrement,
        provider_id text not null references providers(id),
        component_type text not null,
        field_name text not null,
        priority integer not null default 0,
        unique(provider_id, component_type, field_name)
      );

      create table if not exists retail_price_meters (
        id integer primary key autoincrement,
        provider_id text not null references providers(id),
        price_key text not null,
        service_name text not null,
        service_family text,
        product_name text not null,
        sku_name text not null,
        arm_sku_name text,
        meter_id text,
        meter_name text not null,
        arm_region_name text,
        location text,
        unit_of_measure text not null,
        price_type text,
        currency_code text not null,
        retail_price real not null,
        unit_price real not null,
        tier_minimum_units real not null default 0,
        raw_json text not null,
        created_at text not null default current_timestamp,
        updated_at text not null default current_timestamp,
        unique(provider_id, price_key)
      );

      create index if not exists retail_price_meters_lookup_idx
        on retail_price_meters(provider_id, service_name, arm_region_name, sku_name, meter_name);

      create table if not exists catalog_sync_runs (
        id integer primary key autoincrement,
        provider_id text not null references providers(id),
        source text not null,
        status text not null,
        started_at text not null default current_timestamp,
        completed_at text,
        rows_upserted integer not null default 0,
        error_message text
      );
    `);

    this.seedProviders();
    this.seedServices();
    this.seedRequiredFields();
  }

  private seedProviders(): void {
    const statement = this.connection.prepare(
      `insert into providers (id, name)
       values (?, ?)
       on conflict(id) do update set name = excluded.name`
    );
    providers.forEach((provider) => statement.run(provider.id, provider.name));
  }

  private seedServices(): void {
    const serviceStatement = this.connection.prepare(
      `insert into cloud_services (
         service_key, provider_id, component_type, canonical_name, provider_namespace,
         pricing_service_name, service_family, default_pricing_status, updated_at
       )
       values (?, ?, ?, ?, ?, ?, ?, 'cataloged', current_timestamp)
       on conflict(provider_id, service_key) do update set
         component_type = excluded.component_type,
         canonical_name = excluded.canonical_name,
         provider_namespace = excluded.provider_namespace,
         pricing_service_name = excluded.pricing_service_name,
         service_family = excluded.service_family,
         updated_at = current_timestamp`
    );
    const serviceIdStatement = this.connection.prepare(`select id from cloud_services where provider_id = ? and service_key = ?`);
    const aliasStatement = this.connection.prepare(
      `insert into service_aliases (service_id, alias, normalized_alias)
       values (?, ?, ?)
       on conflict(service_id, normalized_alias) do update set alias = excluded.alias`
    );

    for (const service of seedServices) {
      for (const provider of providers) {
        const providerService = service.providers[provider.id];
        serviceStatement.run(
          service.serviceKey,
          provider.id,
          service.componentType,
          providerService.canonicalName,
          providerService.providerNamespace ?? null,
          providerService.pricingServiceName ?? null,
          providerService.serviceFamily ?? null
        );

        const serviceIdRow = serviceIdStatement.get(provider.id, service.serviceKey) as { id: number } | undefined;
        if (!serviceIdRow) {
          continue;
        }

        [...service.aliases, providerService.canonicalName].forEach((alias) => {
          aliasStatement.run(serviceIdRow.id, alias, this.normalizeAlias(alias));
        });
      }
    }
  }

  private seedRequiredFields(): void {
    const statement = this.connection.prepare(
      `insert into pricing_required_fields (provider_id, component_type, field_name, priority)
       values (?, ?, ?, ?)
       on conflict(provider_id, component_type, field_name) do update set priority = excluded.priority`
    );

    for (const provider of providers) {
      Object.entries(requiredFieldsByComponent).forEach(([componentType, fields]) => {
        fields?.forEach((field, index) => {
          statement.run(provider.id, componentType, field, index);
        });
      });
    }
  }

  private toServiceListItem(row: CatalogServiceDbRow): CatalogServiceListItem {
    const aliases = this.connection
      .prepare(
        `select alias
         from service_aliases
         where service_id = ?
         order by alias`
      )
      .all(row.id) as Array<{ alias: string }>;

    return {
      id: row.id,
      serviceKey: row.service_key,
      providerId: row.provider_id,
      componentType: row.component_type,
      canonicalName: row.canonical_name,
      providerNamespace: row.provider_namespace,
      pricingServiceName: row.pricing_service_name,
      serviceFamily: row.service_family,
      defaultPricingStatus: row.default_pricing_status,
      aliases: aliases.map((alias) => alias.alias),
      requiredFields: this.requiredFields(row.provider_id, row.component_type)
    };
  }

  private normalizeAlias(value: string): string {
    return value.toLowerCase().replace(/[^\w\s/.-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private toRetailPriceMeter(row: RetailPriceMeterDbRow): RetailPriceMeter {
    return {
      id: row.id,
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
      retailPrice: row.retail_price,
      unitPrice: row.unit_price,
      tierMinimumUnits: row.tier_minimum_units,
      updatedAt: row.updated_at
    };
  }

  private azurePriceKey(item: AzureRetailPriceItem): string {
    return [
      item.meterId ?? '',
      item.armRegionName ?? '',
      item.serviceName ?? '',
      item.productName ?? '',
      item.skuName ?? '',
      item.armSkuName ?? '',
      item.meterName ?? '',
      item.currencyCode ?? 'USD',
      item.priceType ?? item.type ?? '',
      item.tierMinimumUnits ?? 0
    ].join('|');
  }
}
