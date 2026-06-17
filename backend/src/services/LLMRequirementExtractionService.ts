import OpenAI from 'openai';
import { z } from 'zod';
import { ClarifyingQuestionService } from './ClarifyingQuestionService.js';
import { RequirementExtractionService } from './RequirementExtractionService.js';
import { RequirementCompletenessService } from './RequirementCompletenessService.js';
import { RequirementPostProcessor } from './RequirementPostProcessor.js';
import { ServiceMappingService } from './ServiceMappingService.js';
import type { NormalizedInfrastructureRequirement } from '../types/estimate.types.js';

interface OpenAIResponsesClient {
  responses: {
    create(input: unknown): Promise<{ output_text?: string }>;
  };
}

const confidenceSchema = z.enum(['low', 'medium', 'high']);
const componentTypeValues = [
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
] as const;
const pricingStatusValues = ['supported', 'not_implemented', 'missing_required_fields', 'unsupported', 'needs_review'] as const;

const llmRequirementSchema = z.object({
  region: z.object({
    raw: z.string().nullable(),
    normalized: z.string(),
    providerRegion: z.object({
      azure: z.string(),
      aws: z.string(),
      gcp: z.string()
    }),
    confidence: confidenceSchema
  }),
  components: z.array(
    z
      .object({
        id: z.string(),
        type: z.enum(componentTypeValues),
        name: z.string(),
        providerServiceHint: z
          .object({
            azure: z.string().nullable(),
            aws: z.string().nullable(),
            gcp: z.string().nullable()
          })
          .optional()
          .default({ azure: null, aws: null, gcp: null }),
        pricingStatus: z.enum(pricingStatusValues).optional().default('needs_review'),
        confidence: confidenceSchema,
        missingFields: z.array(z.string()),
        assumptions: z.array(z.string()),
        rawText: z.string(),
        role: z.string().nullable().optional(),
        quantity: z.number().nullable().optional(),
        vcpu: z.number().nullable().optional(),
        memoryGb: z.number().nullable().optional(),
        os: z.string().nullable().optional(),
        image: z.string().nullable().optional(),
        operatingSystem: z.enum(['linux']).nullable().optional(),
        imageType: z.enum(['ubuntu']).nullable().optional(),
        monthlyHours: z.number().nullable().optional(),
        engine: z.string().nullable().optional(),
        deployment: z.string().nullable().optional(),
        managed: z.boolean().nullable().optional(),
        storageGb: z.number().nullable().optional(),
        storageType: z.string().nullable().optional(),
        highAvailability: z.boolean().nullable().optional(),
        backupRetentionDays: z.number().nullable().optional(),
        tier: z.string().nullable().optional(),
        usage: z.string().nullable().optional(),
        purpose: z.string().nullable().optional(),
        dataTransferGb: z.number().nullable().optional(),
        monthlyTransferGb: z.number().nullable().optional(),
        requestCount: z.number().nullable().optional(),
        target: z.string().nullable().optional(),
        targets: z.string().nullable().optional(),
        scheme: z.string().nullable().optional(),
        publicFacing: z.boolean().nullable().optional(),
        accessTier: z.string().nullable().optional(),
        redundancy: z.string().nullable().optional(),
        nodeCount: z.number().nullable().optional(),
        vcpuPerNode: z.number().nullable().optional(),
        memoryGbPerNode: z.number().nullable().optional(),
        monthlyEgressGb: z.number().nullable().optional(),
        source: z.string().nullable().optional(),
        destination: z.string().nullable().optional(),
        logIngestionGb: z.number().nullable().optional(),
        retentionDays: z.number().nullable().optional(),
        protectedDataGb: z.number().nullable().optional()
      })
      .passthrough()
  ),
  globalAssumptions: z.array(z.string()),
  clarifyingQuestions: z.array(z.string())
});

const responseJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['region', 'components', 'globalAssumptions', 'clarifyingQuestions'],
  properties: {
    region: {
      type: 'object',
      additionalProperties: false,
      required: ['raw', 'normalized', 'providerRegion', 'confidence'],
      properties: {
        raw: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        normalized: { type: 'string' },
        providerRegion: {
          type: 'object',
          additionalProperties: false,
          required: ['azure', 'aws', 'gcp'],
          properties: {
            azure: { type: 'string' },
            aws: { type: 'string' },
            gcp: { type: 'string' }
          }
        },
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] }
      }
    },
    components: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id',
          'type',
          'name',
          'providerServiceHint',
          'pricingStatus',
          'confidence',
          'missingFields',
          'assumptions',
          'rawText',
          'role',
          'quantity',
          'vcpu',
          'memoryGb',
          'os',
          'image',
          'monthlyHours',
          'engine',
          'deployment',
          'managed',
          'storageGb',
          'storageType',
          'highAvailability',
          'backupRetentionDays',
          'tier',
          'usage',
          'purpose',
          'monthlyTransferGb',
          'requestCount',
          'targets',
          'scheme',
          'publicFacing',
          'accessTier',
          'redundancy',
          'nodeCount',
          'vcpuPerNode',
          'memoryGbPerNode',
          'monthlyEgressGb',
          'source',
          'destination',
          'logIngestionGb',
          'retentionDays',
          'protectedDataGb'
        ],
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: [...componentTypeValues] },
          name: { type: 'string' },
          providerServiceHint: {
            type: 'object',
            additionalProperties: false,
            required: ['azure', 'aws', 'gcp'],
            properties: {
              azure: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              aws: { anyOf: [{ type: 'string' }, { type: 'null' }] },
              gcp: { anyOf: [{ type: 'string' }, { type: 'null' }] }
            }
          },
          pricingStatus: { type: 'string', enum: [...pricingStatusValues] },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          missingFields: { type: 'array', items: { type: 'string' } },
          assumptions: { type: 'array', items: { type: 'string' } },
          rawText: { type: 'string' },
          role: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          quantity: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          vcpu: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          memoryGb: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          os: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          image: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          monthlyHours: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          engine: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          deployment: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          managed: { anyOf: [{ type: 'boolean' }, { type: 'null' }] },
          storageGb: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          storageType: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          highAvailability: {
            description:
              'Set true when the user asks for highly available, HA, zone-redundant, multi-zone, replicated, or production database deployment.',
            anyOf: [{ type: 'boolean' }, { type: 'null' }]
          },
          backupRetentionDays: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          tier: {
            description:
              'Use production when the user asks for production-grade, replicated, standard, premium, highly available, or non-basic Redis.',
            anyOf: [{ type: 'string' }, { type: 'null' }]
          },
          usage: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          purpose: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          monthlyTransferGb: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          requestCount: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          targets: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          scheme: {
            description:
              'Use http_s for HTTP/S, HTTPS, HTTP, Layer 7, L7, or application load balancer. Use tcp for TCP, UDP, Layer 4, L4, or network load balancer.',
            anyOf: [{ type: 'string' }, { type: 'null' }]
          },
          publicFacing: { anyOf: [{ type: 'boolean' }, { type: 'null' }] },
          accessTier: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          redundancy: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          nodeCount: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          vcpuPerNode: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          memoryGbPerNode: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          monthlyEgressGb: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          source: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          destination: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          logIngestionGb: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          retentionDays: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          protectedDataGb: { anyOf: [{ type: 'number' }, { type: 'null' }] }
        }
      }
    },
    globalAssumptions: { type: 'array', items: { type: 'string' } },
    clarifyingQuestions: { type: 'array', items: { type: 'string' } }
  }
} as const;

const systemPrompt = `Extract all cloud infrastructure requirements mentioned by the user into one strict JSON object.
Do not calculate prices. Do not invent pricing.
Do not ignore services just because pricing is not implemented.
Use provider-neutral infrastructure components.
Use one universal extraction pass for every service in the prompt.
Convert TB to GB using 1 TB = 1024 GB.
Normalize common region names to provider regions. If the user says US East, East US, us east, east us, us-east, us_east, useast, or eastus, map provider regions to Azure eastus, AWS us-east-1, and GCP us-east1.
If the user says "highly available", "high availability", "HA", "zone redundant", "zone-redundant", "multi-zone", "replicated", or "production database", set database.highAvailability = true unless the user explicitly says no HA.
If the user says "production grade Redis", "production Redis", "standard Redis", "premium Redis", "replicated Redis", or "highly available Redis", set cache.tier = "production".
If the user says "basic Redis", "dev Redis", "development Redis", or "non-production Redis", set cache.tier = "basic".
If the user says "HTTP/S", "HTTPS", "HTTP", "Layer 7", "L7", or "application load balancer", set load_balancer.scheme = "http_s".
If the user says "TCP", "UDP", "Layer 4", "L4", or "network load balancer", set load_balancer.scheme = "tcp".
If load_balancer.scheme = "http_s", set providerServiceHint.azure = "Azure Application Gateway".
If load_balancer.scheme = "tcp", set providerServiceHint.azure = "Azure Load Balancer".
Do not calculate provider service mapping. The backend maps provider-specific Azure, AWS, and GCP service equivalents after validation.
Do not decide final pricing support. The backend decides pricingStatus after validation.
If providerServiceHint is present in the schema, use null values unless the provider-specific product was explicitly named by the user.
If pricingStatus is present in the schema, use "needs_review"; the backend will overwrite it.
Include rawText for each component as the shortest source phrase or sentence from the user prompt that supports the extraction.
If a required field is missing, add it to that component's missingFields.
Only ask clarifying questions for fields that are truly missing.
Do not ask clarifying questions for values explicitly provided.
Do not add missingFields for values explicitly stated by the user.
Return only the JSON object matching the supplied schema.`;

export class LLMRequirementExtractionService {
  private readonly client?: OpenAIResponsesClient;
  private readonly model: string;
  private readonly serviceMappingService = new ServiceMappingService();
  private readonly postProcessor = new RequirementPostProcessor();
  private readonly completenessService = new RequirementCompletenessService();
  private readonly clarifyingQuestionService = new ClarifyingQuestionService();

  constructor(
    private readonly fallbackExtractor = new RequirementExtractionService(),
    options: { client?: OpenAIResponsesClient; model?: string } = {}
  ) {
    this.model = options.model ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
    this.client =
      options.client ??
      (process.env.OPENAI_API_KEY
        ? (new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 12000,
            maxRetries: 0
          }) as OpenAIResponsesClient)
        : undefined);
  }

  async extractRequirements(requirementText: string): Promise<NormalizedInfrastructureRequirement> {
    const intentText = this.promptIntentText(requirementText);
    if (!this.client) {
      return this.fallback(intentText, 'OpenAI extraction is not configured; rule-based fallback was used.');
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: intentText }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'normalized_infrastructure_requirement',
            schema: responseJsonSchema
          }
        }
      });

      const outputText = response.output_text;
      if (!outputText) {
        return this.fallback(intentText, 'OpenAI extraction returned no structured content; rule-based fallback was used.');
      }

      const parsed = JSON.parse(outputText);
      const validated = llmRequirementSchema.safeParse(parsed);

      if (!validated.success) {
        return this.fallback(intentText, 'OpenAI extraction failed validation; rule-based fallback was used.');
      }

      const normalized = this.finalizeRequirement(intentText, this.normalizeForInternalUse(validated.data));
      return {
        ...normalized,
        extractionMethod: 'llm'
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('OpenAI requirement extraction failed; using rule-based fallback.', error);
      }
      return this.fallback(intentText, 'OpenAI extraction failed; rule-based fallback was used.');
    }
  }

  private fallback(requirementText: string, assumption: string): NormalizedInfrastructureRequirement {
    const fallbackResult = this.fallbackExtractor.extractRequirements(requirementText);
    const mappedFallbackResult = this.finalizeRequirement(requirementText, fallbackResult);
    return {
      ...mappedFallbackResult,
      extractionMethod: 'rule-based-fallback',
      globalAssumptions: [...mappedFallbackResult.globalAssumptions, assumption]
    };
  }

  private finalizeRequirement(requirementText: string, requirement: NormalizedInfrastructureRequirement): NormalizedInfrastructureRequirement {
    return this.clarifyingQuestionService.process(
      this.completenessService.process(this.postProcessor.process(requirementText, this.serviceMappingService.mapRequirement(requirement)))
    );
  }

  private normalizeForInternalUse(requirement: z.infer<typeof llmRequirementSchema>): NormalizedInfrastructureRequirement {
    const components = requirement.components.map((component) => {
      if (component.type === 'compute') {
        return {
          ...component,
          operatingSystem: component.operatingSystem ?? (component.os?.toLowerCase() === 'linux' ? 'linux' : null),
          imageType: component.imageType ?? (component.image?.toLowerCase() === 'ubuntu' ? 'ubuntu' : null),
          monthlyHours: component.monthlyHours ?? 730
        };
      }

      if (component.type === 'cdn') {
        return {
          ...component,
          dataTransferGb: component.dataTransferGb ?? component.monthlyTransferGb ?? null
        };
      }

      if (component.type === 'load_balancer') {
        return {
          ...component,
          target: component.target ?? component.targets ?? null
        };
      }

      return component;
    });

    return {
      ...requirement,
      components,
      extractionMethod: 'llm'
    } as NormalizedInfrastructureRequirement;
  }

  private promptIntentText(input: string): string {
    const promptMatch = input.match(/\bprompt\s*:\s*/i);
    if (!promptMatch || promptMatch.index === undefined) {
      return input;
    }

    const beforePrompt = input.slice(0, promptMatch.index).trim();
    const afterPrompt = input.slice(promptMatch.index + promptMatch[0].length);
    const resultIndex = afterPrompt.search(/\bresult\s*:\s*/i);
    const promptBody = (resultIndex >= 0 ? afterPrompt.slice(0, resultIndex) : afterPrompt).trim();
    return [beforePrompt, promptBody].filter(Boolean).join('\n');
  }
}
