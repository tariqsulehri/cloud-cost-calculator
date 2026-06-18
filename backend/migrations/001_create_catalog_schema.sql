create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists providers (
  id text primary key,
  name text not null
);

insert into providers (id, name)
values
  ('azure', 'Microsoft Azure'),
  ('aws', 'Amazon Web Services'),
  ('gcp', 'Google Cloud Platform')
on conflict (id) do update set
  name = excluded.name;

create table if not exists cloud_services (
  id bigserial primary key,
  service_key text not null,
  provider_id text not null references providers(id),
  component_type text not null,
  canonical_name text not null,
  provider_namespace text,
  pricing_service_name text,
  service_family text,
  default_pricing_status text not null default 'cataloged',
  source_category text,
  mapping_status text not null default 'mapped',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_id, service_key)
);

create table if not exists service_aliases (
  id bigserial primary key,
  service_id bigint not null references cloud_services(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  unique(service_id, normalized_alias)
);

create table if not exists pricing_required_fields (
  id bigserial primary key,
  provider_id text not null references providers(id),
  component_type text not null,
  field_name text not null,
  priority integer not null default 0,
  unique(provider_id, component_type, field_name)
);

create table if not exists retail_price_meters (
  id bigserial primary key,
  provider_id text not null references providers(id),
  price_key text not null,
  service_code text,
  service_name text not null,
  service_family text,
  product_name text not null,
  sku_id text,
  sku_name text not null,
  arm_sku_name text,
  meter_id text,
  meter_name text not null,
  region_code text,
  arm_region_name text,
  location text,
  unit_of_measure text not null,
  price_type text,
  currency_code text not null,
  retail_price numeric(18, 10) not null,
  unit_price numeric(18, 10) not null,
  tier_minimum_units numeric(18, 4) not null default 0,
  effective_date timestamptz,
  publication_date timestamptz,
  raw_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_id, price_key)
);

create index if not exists retail_price_meters_service_region_idx
  on retail_price_meters(provider_id, service_code, region_code);

create index if not exists retail_price_meters_lookup_idx
  on retail_price_meters(provider_id, service_name, region_code, sku_name, meter_name);

create index if not exists retail_price_meters_sku_meter_idx
  on retail_price_meters(provider_id, sku_name, meter_name);

create index if not exists retail_price_meters_updated_at_idx
  on retail_price_meters(provider_id, updated_at);

create table if not exists catalog_sync_runs (
  id bigserial primary key,
  provider_id text not null references providers(id),
  source text not null,
  service_code text,
  region_code text,
  status text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  rows_read integer not null default 0,
  rows_upserted integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists catalog_sync_runs_provider_started_idx
  on catalog_sync_runs(provider_id, started_at desc);
