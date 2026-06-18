# Cloud Service Mapping Architecture

## Demo-Safe Direction

For the demo timeline, mappings are organized in one canonical backend module:

```text
backend/src/mappings/cloudServiceMap.ts
```

This module is the application-level source of truth for:

- normalized service key
- component type
- required pricing fields
- Azure/AWS/GCP equivalent service names
- provider pricing service names
- pricing adapter strategy keys
- public catalog sync targets
- current coverage status: `exact`, `partial`, `planning`, or `unsupported`
- known pricing exclusions/notes

The existing database schema remains stable:

```text
providers
cloud_services
service_aliases
pricing_required_fields
retail_price_meters
catalog_sync_runs
schema_migrations
```

## Why Not Add More Tables Right Now?

The current database already stores base catalog mappings and price rows. Adding new mapping tables right before the demo would require migrations, seed backfills, API changes, and UI changes. That is valuable later, but risky for the demo.

The safer improvement is:

```text
canonical mapping module -> service mapping logic -> catalog API coverage endpoint
```

This reduces duplicated mapping logic while preserving the working pricing flows.

## New API

The organized map is exposed at:

```text
GET /api/catalog/cloud-service-map
```

It returns the mapped services, required fields, provider services, pricing adapters, sync targets, and coverage status.

## Example

```text
database.postgresql

Azure:
  service: Azure Database for PostgreSQL Flexible Server
  pricing service: Azure Database for PostgreSQL
  adapter: azure.postgres.flexible.ddsv5
  coverage: exact

AWS:
  service: Amazon RDS for PostgreSQL
  pricing service: AmazonRDS
  adapter: aws.rds.postgres.m7g
  coverage: exact

GCP:
  service: Cloud SQL for PostgreSQL
  pricing service: Cloud SQL
  adapter: gcp.cloudsql.postgres.vcpu_ram_storage
  coverage: exact
```

## Future Phase

After demo, we can move this module into normalized database tables:

```text
service_mappings
provider_service_mappings
pricing_adapter_mappings
service_pricing_coverage
```

That would allow admin-managed mappings and coverage without code changes.
