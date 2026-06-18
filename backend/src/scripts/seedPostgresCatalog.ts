import { catalogProviders, coreSeedServices, requiredFieldsByComponent } from '../database/CloudCatalogDatabase.js';
import { cloudServiceSeeds } from '../database/cloudServices.seed.js';
import { createPool, withTransaction } from '../database/postgres.js';

function normalizeAlias(value: string): string {
  return value.toLowerCase().replace(/[^\w\s/.-]/g, ' ').replace(/\s+/g, ' ').trim();
}

const pool = createPool();
const client = await pool.connect();

try {
  let providersUpserted = 0;
  let servicesUpserted = 0;
  let aliasesUpserted = 0;
  let requiredFieldsUpserted = 0;
  const allSeedServices = [...cloudServiceSeeds, ...coreSeedServices];

  await withTransaction(client, async () => {
    for (const provider of catalogProviders) {
      await client.query(
        `insert into providers (id, name)
         values ($1, $2)
         on conflict (id) do update set name = excluded.name`,
        [provider.id, provider.name]
      );
      providersUpserted += 1;
    }

    for (const service of allSeedServices) {
      for (const provider of catalogProviders) {
        const providerService = service.providers[provider.id];
        const serviceResult = await client.query<{ id: string }>(
          `insert into cloud_services (
             service_key, provider_id, component_type, canonical_name, provider_namespace,
             pricing_service_name, service_family, default_pricing_status, source_category,
             mapping_status, notes, updated_at
           )
           values ($1, $2, $3, $4, $5, $6, $7, 'cataloged', $8, $9, $10, now())
           on conflict(provider_id, service_key) do update set
             component_type = excluded.component_type,
             canonical_name = excluded.canonical_name,
             provider_namespace = excluded.provider_namespace,
             pricing_service_name = excluded.pricing_service_name,
             service_family = excluded.service_family,
             source_category = excluded.source_category,
             mapping_status = excluded.mapping_status,
             notes = excluded.notes,
             updated_at = now()
           returning id`,
          [
            service.serviceKey,
            provider.id,
            service.componentType,
            providerService.canonicalName,
            providerService.providerNamespace ?? null,
            providerService.pricingServiceName ?? null,
            providerService.serviceFamily ?? null,
            service.sourceCategory ?? providerService.serviceFamily ?? null,
            providerService.mappingStatus ?? service.mappingStatus ?? 'mapped',
            providerService.notes ?? service.notes ?? null
          ]
        );
        servicesUpserted += 1;

        const serviceId = serviceResult.rows[0].id;
        const aliases = [...service.aliases, service.sourceCategory, providerService.serviceFamily, providerService.canonicalName].filter((alias): alias is string => Boolean(alias));
        for (const alias of aliases) {
          await client.query(
            `insert into service_aliases (service_id, alias, normalized_alias)
             values ($1, $2, $3)
             on conflict(service_id, normalized_alias) do update set alias = excluded.alias`,
            [serviceId, alias, normalizeAlias(alias)]
          );
          aliasesUpserted += 1;
        }
      }
    }

    for (const provider of catalogProviders) {
      for (const [componentType, fields] of Object.entries(requiredFieldsByComponent)) {
        for (const [priority, field] of (fields ?? []).entries()) {
          await client.query(
            `insert into pricing_required_fields (provider_id, component_type, field_name, priority)
             values ($1, $2, $3, $4)
             on conflict(provider_id, component_type, field_name) do update set priority = excluded.priority`,
            [provider.id, componentType, field, priority]
          );
          requiredFieldsUpserted += 1;
        }
      }
    }
  });

  console.log(
    JSON.stringify(
      {
        providersUpserted,
        servicesUpserted,
        aliasesUpserted,
        requiredFieldsUpserted
      },
      null,
      2
    )
  );
} finally {
  client.release();
  await pool.end();
}
