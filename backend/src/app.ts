import cors from 'cors';
import express from 'express';
import { azureRouter } from './routes/azure.routes.js';
import { estimateRouter } from './routes/estimate.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { createRequirementsRouter, type RequirementExtractor } from './routes/requirements.routes.js';
import { errorHandler } from './utils/errors.js';

interface AppServices {
  requirementExtractionService?: RequirementExtractor;
}

export function createApp(services: AppServices = {}) {
  const app = express();
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS origin not allowed: ${origin}`));
      }
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', healthRouter);
  app.use('/api', azureRouter);
  app.use('/api', createRequirementsRouter(services.requirementExtractionService));
  app.use('/api', estimateRouter);
  app.use(errorHandler);

  return app;
}
