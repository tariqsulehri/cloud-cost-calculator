import { Router } from 'express';
import { z } from 'zod';
import { LLMRequirementExtractionService } from '../services/LLMRequirementExtractionService.js';
import { RequirementRefinementService } from '../services/RequirementRefinementService.js';
import { providers, type NormalizedInfrastructureRequirement, type Provider } from '../types/estimate.types.js';

const extractSchema = z.object({
  requirementText: z.string().trim().min(1, 'Requirement text is required.').max(10000)
});

const refineSchema = extractSchema.extend({
  provider: z.enum(providers).optional().default('azure')
});

export interface RequirementExtractor {
  extractRequirements(requirementText: string): NormalizedInfrastructureRequirement | Promise<NormalizedInfrastructureRequirement>;
  refineRequirements?(requirementText: string, provider?: Provider): string | Promise<string>;
}

export function createRequirementsRouter(extractionService: RequirementExtractor = new LLMRequirementExtractionService()) {
  const router = Router();
  const refinementService =
    typeof extractionService.refineRequirements === 'function'
      ? { refineRequirements: extractionService.refineRequirements.bind(extractionService) }
      : new RequirementRefinementService();

  router.post('/requirements/extract', async (req, res, next) => {
    try {
      const payload = extractSchema.parse(req.body);
      res.json(await extractionService.extractRequirements(payload.requirementText));
    } catch (error) {
      next(error);
    }
  });

  router.post('/requirements/refine', async (req, res, next) => {
    try {
      const payload = refineSchema.parse(req.body);
      res.json({ refinedPrompt: await refinementService.refineRequirements(payload.requirementText, payload.provider) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export const requirementsRouter = createRequirementsRouter();
