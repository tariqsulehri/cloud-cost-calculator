import { Router } from 'express';
import { z } from 'zod';
import { CloudCatalogDatabase } from '../database/CloudCatalogDatabase.js';
import { AzureRetailCatalogSyncService } from '../services/AzureRetailCatalogSyncService.js';

const providerSchema = z.enum(['azure', 'aws', 'gcp']).optional();
const syncSchema = z.object({
  armRegionName: z.string().trim().min(1).optional(),
  serviceName: z.string().trim().min(1).optional(),
  priceType: z.string().trim().min(1).optional(),
  currencyCode: z.string().trim().min(1).optional(),
  maxPages: z.number().int().positive().max(100).optional()
});

export function createCatalogRouter(catalog = new CloudCatalogDatabase(), syncService = new AzureRetailCatalogSyncService(catalog)) {
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

  return router;
}

export const catalogRouter = createCatalogRouter();
