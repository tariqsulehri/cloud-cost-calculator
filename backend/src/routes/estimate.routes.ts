import { Router } from 'express';
import { z } from 'zod';
import { EstimateService } from '../services/EstimateService.js';
import { HttpError } from '../utils/errors.js';
import { isSupportedAzureRegion } from './azure.routes.js';
import {
  categories,
  confidenceLevels,
  imageTypes,
  operatingSystems,
  pricingModels,
  providers,
  services,
  tiers,
  type NormalizedEstimateRequest
} from '../types/estimate.types.js';

const estimateSchema = z.object({
  provider: z.enum(providers),
  region: z.string().min(1),
  service: z.enum(services),
  operatingSystem: z.enum(operatingSystems),
  imageType: z.enum(imageTypes),
  tier: z.enum(tiers),
  category: z.enum(categories),
  instanceSeries: z.string().min(1),
  instanceSku: z.string().min(1, 'Instance SKU is required.'),
  quantity: z.number().positive('Quantity must be greater than zero.'),
  hours: z.number().positive('Hours must be greater than zero.'),
  pricingModel: z.enum(pricingModels)
});

const normalizedComponentSchema = z.object({
  id: z.string(),
  type: z.enum([
    'compute',
    'database',
    'cache',
    'storage',
    'object_storage',
    'block_storage',
    'file_storage',
    'cdn',
    'load_balancer',
    'kubernetes',
    'serverless',
    'queue',
    'monitoring',
    'backup',
    'security',
    'network',
    'unknown'
  ]),
  confidence: z.enum(confidenceLevels),
  missingFields: z.array(z.string()),
  assumptions: z.array(z.string())
}).passthrough();

const normalizedEstimateSchema = z.object({
  provider: z.enum(providers),
  requirements: z.object({
    region: z.object({
      raw: z.string().nullable(),
      normalized: z.string(),
      providerRegion: z.object({
        azure: z.string(),
        aws: z.string(),
        gcp: z.string()
      }),
      confidence: z.enum(confidenceLevels)
    }),
    components: z.array(normalizedComponentSchema),
    globalAssumptions: z.array(z.string()),
    clarifyingQuestions: z.array(z.string())
  })
});

export const estimateRouter = Router();
const estimateService = new EstimateService();

estimateRouter.post('/estimate', async (req, res, next) => {
  try {
    if ('requirements' in req.body) {
      const payload = normalizedEstimateSchema.parse(req.body);

      if (payload.provider === 'azure' && !isSupportedAzureRegion(payload.requirements.region.providerRegion.azure)) {
        throw new HttpError(400, `Unsupported Azure region: ${payload.requirements.region.providerRegion.azure}`);
      }

      res.json(await estimateService.estimateNormalized(payload as unknown as NormalizedEstimateRequest));
      return;
    }

    const payload = estimateSchema.parse(req.body);

    if (payload.provider !== 'azure') {
      throw new HttpError(400, 'Only Azure is supported in this MVP.');
    }

    if (payload.service !== 'virtual-machines') {
      throw new HttpError(400, 'Only Azure Virtual Machines are supported in Phase 1.');
    }

    if (!isSupportedAzureRegion(payload.region)) {
      throw new HttpError(400, `Unsupported Azure region: ${payload.region}`);
    }

    res.json(await estimateService.estimate(payload));
  } catch (error) {
    next(error);
  }
});
