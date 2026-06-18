import { Router } from 'express';
import { z } from 'zod';
import { CloudCatalogDatabase } from '../database/CloudCatalogDatabase.js';
import { PostgresPricingCatalogRepository } from '../database/PostgresPricingCatalogRepository.js';
import { AWS_PUBLIC_OFFER_SYNC_TARGETS, AwsPostgresCatalogSyncService, type AwsPostgresCatalogSyncOptions } from '../services/AwsPostgresCatalogSyncService.js';
import { AZURE_RETAIL_SYNC_TARGETS, AzurePostgresCatalogSyncService, type AzurePostgresCatalogSyncOptions } from '../services/AzurePostgresCatalogSyncService.js';
import { GCP_PUBLIC_PRICE_SYNC_TARGETS, GcpCloudBillingCatalogSyncService, type GcpCatalogSyncOptions } from '../services/GcpCloudBillingCatalogSyncService.js';
import { AzureRetailCatalogSyncService } from '../services/AzureRetailCatalogSyncService.js';
import { pricingCoverageSummary } from '../mappings/cloudServiceMap.js';

const providerSchema = z.enum(['azure', 'aws', 'gcp']).optional();
const syncSchema = z.object({
  armRegionName: z.string().trim().min(1).optional(),
  serviceName: z.string().trim().min(1).optional(),
  priceType: z.string().trim().min(1).optional(),
  currencyCode: z.string().trim().min(1).optional(),
  maxPages: z.number().int().positive().max(100).optional()
});
const awsSyncSchema = z.object({
  filePath: z.string().trim().min(1).optional(),
  sourceUrl: z.string().trim().url().optional(),
  offerCode: z.string().trim().min(1).optional(),
  regionCode: z.string().trim().min(1).optional(),
  maxMeters: z.number().int().positive().optional()
});
const gcpSyncSchema = z.object({
  serviceName: z.string().trim().min(1).optional(),
  regionCode: z.string().trim().min(1).optional(),
  currencyCode: z.string().trim().min(1).optional(),
  maxSkus: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(5000).optional()
});

interface AwsCatalogSyncer {
  sync(options?: AwsPostgresCatalogSyncOptions): Promise<unknown>;
  syncSupportedOffers?(options?: { maxMeters?: number }): Promise<unknown>;
}

interface AzurePostgresCatalogSyncer {
  sync(options?: AzurePostgresCatalogSyncOptions): Promise<unknown>;
  syncSupportedServices?(options?: { maxPages?: number }): Promise<unknown>;
}

interface GcpCatalogSyncer {
  sync(options?: GcpCatalogSyncOptions): Promise<unknown>;
  syncSupportedServices?(options?: { maxSkus?: number }): Promise<unknown>;
}

export function createCatalogRouter(
  catalog = new CloudCatalogDatabase(),
  syncService = new AzureRetailCatalogSyncService(catalog),
  awsSyncService: AwsCatalogSyncer = new AwsPostgresCatalogSyncService(),
  azurePostgresSyncService: AzurePostgresCatalogSyncer = new AzurePostgresCatalogSyncService(),
  gcpSyncService: GcpCatalogSyncer = new GcpCloudBillingCatalogSyncService()
) {
  const router = Router();

  router.get('/catalog/services', (req, res, next) => {
    try {
      const provider = providerSchema.parse(req.query.provider);
      const query = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
      res.json({
        services: catalog.listServices({ provider, query: query || undefined })
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/catalog/service-hints/:serviceKey', (req, res, next) => {
    try {
      const hints = catalog.providerHintsForServiceKey(req.params.serviceKey);
      res.json({
        serviceKey: req.params.serviceKey,
        providerServiceHint: hints ?? { azure: null, aws: null, gcp: null }
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/catalog/cloud-service-map', (_req, res, next) => {
    try {
      res.json({
        services: pricingCoverageSummary()
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/catalog/price-meters', (req, res, next) => {
    try {
      const provider = providerSchema.parse(req.query.provider) ?? 'azure';
      const query = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
      const serviceName = typeof req.query.serviceName === 'string' ? req.query.serviceName.trim() : undefined;
      const region = typeof req.query.region === 'string' ? req.query.region.trim() : undefined;
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
      res.json({
        meters: catalog.listRetailPriceMeters({
          provider,
          query: query || undefined,
          serviceName: serviceName || undefined,
          region: region || undefined,
          limit: Number.isFinite(limit) ? limit : undefined
        })
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/catalog/sync/azure-retail-prices', async (req, res, next) => {
    try {
      const payload = syncSchema.parse(req.body ?? {});
      res.json(await syncService.sync(payload));
    } catch (error) {
      next(error);
    }
  });

  router.post('/catalog/sync/aws-public-prices', async (req, res, next) => {
    try {
      const payload = awsSyncSchema.parse(req.body ?? {});
      res.json(await awsSyncService.sync(payload));
    } catch (error) {
      next(error);
    }
  });

  router.post('/catalog/sync/azure-retail-prices/postgres', async (req, res, next) => {
    try {
      const payload = syncSchema.parse(req.body ?? {});
      res.json(await azurePostgresSyncService.sync(payload));
    } catch (error) {
      next(error);
    }
  });

  router.post('/catalog/sync/azure-retail-prices/all', async (req, res, next) => {
    try {
      const payload = z.object({ maxPages: z.number().int().positive().max(500).optional() }).parse(req.body ?? {});
      if (azurePostgresSyncService.syncSupportedServices) {
        res.json(await azurePostgresSyncService.syncSupportedServices(payload));
        return;
      }

      const results = [];
      for (const target of AZURE_RETAIL_SYNC_TARGETS) {
        results.push(await azurePostgresSyncService.sync({ ...target, maxPages: payload.maxPages }));
      }
      res.json({
        status: results.some((result) => (result as { status?: string }).status === 'partial') ? 'partial' : 'completed',
        results
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/catalog/sync/gcp-public-prices', async (req, res, next) => {
    try {
      const payload = gcpSyncSchema.parse(req.body ?? {});
      res.json(await gcpSyncService.sync(payload));
    } catch (error) {
      next(error);
    }
  });

  router.post('/catalog/sync/gcp-public-prices/all', async (req, res, next) => {
    try {
      const payload = z.object({ maxSkus: z.number().int().positive().optional() }).parse(req.body ?? {});
      if (gcpSyncService.syncSupportedServices) {
        res.json(await gcpSyncService.syncSupportedServices(payload));
        return;
      }

      const results = [];
      for (const target of GCP_PUBLIC_PRICE_SYNC_TARGETS) {
        results.push(await gcpSyncService.sync({ ...target, maxSkus: payload.maxSkus }));
      }
      res.json({
        status: results.some((result) => (result as { status?: string }).status === 'partial') ? 'partial' : 'completed',
        results
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/catalog/sync/aws-public-prices/all', async (req, res, next) => {
    try {
      const payload = z.object({ maxMeters: z.number().int().positive().optional() }).parse(req.body ?? {});
      if (awsSyncService.syncSupportedOffers) {
        res.json(await awsSyncService.syncSupportedOffers(payload));
        return;
      }

      const results = [];
      for (const target of AWS_PUBLIC_OFFER_SYNC_TARGETS) {
        results.push(await awsSyncService.sync({ ...target, maxMeters: payload.maxMeters }));
      }
      res.json({
        status: results.some((result) => (result as { status?: string }).status === 'partial') ? 'partial' : 'completed',
        results
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/catalog/sync/aws-public-prices/status', async (_req, res, next) => {
    const repository = new PostgresPricingCatalogRepository();
    try {
      const services = await Promise.all(
        AWS_PUBLIC_OFFER_SYNC_TARGETS.map(async (target) => {
          const [meterCount, latestRun] = await Promise.all([
            repository.countRetailPriceMeters({ provider: 'aws', serviceName: target.offerCode }),
            repository.listSyncRuns({ provider: 'aws', serviceCode: target.offerCode, limit: 1 })
          ]);

          return {
            offerCode: target.offerCode,
            regionCode: target.regionCode,
            meterCount,
            latestRun: latestRun[0] ?? null
          };
        })
      );

      res.json({ services });
    } catch (error) {
      next(error);
    } finally {
      await repository.close();
    }
  });

  router.get('/catalog/sync/azure-retail-prices/status', async (_req, res, next) => {
    const repository = new PostgresPricingCatalogRepository();
    try {
      const services = await Promise.all(
        AZURE_RETAIL_SYNC_TARGETS.map(async (target) => {
          const [meterCount, latestRun] = await Promise.all([
            repository.countRetailPriceMeters({ provider: 'azure', serviceName: target.serviceName, region: target.armRegionName }),
            repository.listSyncRuns({ provider: 'azure', serviceCode: target.serviceName, limit: 1 })
          ]);

          return {
            serviceName: target.serviceName,
            armRegionName: target.armRegionName,
            meterCount,
            latestRun: latestRun[0] ?? null
          };
        })
      );

      res.json({ services });
    } catch (error) {
      next(error);
    } finally {
      await repository.close();
    }
  });

  router.get('/catalog/sync/gcp-public-prices/status', async (_req, res, next) => {
    const repository = new PostgresPricingCatalogRepository();
    try {
      const services = await Promise.all(
        GCP_PUBLIC_PRICE_SYNC_TARGETS.map(async (target) => {
          const [meterCount, latestRun] = await Promise.all([
            repository.countRetailPriceMeters({ provider: 'gcp', serviceName: target.serviceName, region: target.regionCode }),
            repository.listSyncRuns({ provider: 'gcp', serviceCode: target.serviceName, limit: 1 })
          ]);

          return {
            serviceName: target.serviceName,
            regionCode: target.regionCode,
            meterCount,
            latestRun: latestRun[0] ?? null
          };
        })
      );

      res.json({ services });
    } catch (error) {
      next(error);
    } finally {
      await repository.close();
    }
  });

  return router;
}

export const catalogRouter = createCatalogRouter();
