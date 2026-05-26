export const providers = ['azure'] as const;
export const services = ['virtual-machines'] as const;
export const operatingSystems = ['linux'] as const;
export const imageTypes = ['ubuntu'] as const;
export const tiers = ['standard'] as const;
export const categories = ['all'] as const;
export const pricingModels = ['pay-as-you-go'] as const;
export const confidenceLevels = ['low', 'medium', 'high'] as const;
export const pricingSources = ['azure-retail-prices-api', 'fallback'] as const;

export type Provider = (typeof providers)[number];
export type AzureService = (typeof services)[number];
export type OperatingSystem = (typeof operatingSystems)[number];
export type ImageType = (typeof imageTypes)[number];
export type Tier = (typeof tiers)[number];
export type Category = (typeof categories)[number];
export type PricingModel = (typeof pricingModels)[number];
export type Confidence = (typeof confidenceLevels)[number];
export type PricingSource = (typeof pricingSources)[number];
export type ExtractionMethod = 'llm' | 'rule-based-fallback';
export type PricingStatus = 'supported' | 'not_implemented' | 'missing_required_fields' | 'unsupported' | 'needs_review';

export type NormalizedComponentType =
  | 'compute'
  | 'database'
  | 'cache'
  | 'storage'
  | 'object_storage'
  | 'block_storage'
  | 'file_storage'
  | 'cdn'
  | 'load_balancer'
  | 'kubernetes'
  | 'serverless'
  | 'queue'
  | 'monitoring'
  | 'backup'
  | 'security'
  | 'network'
  | 'unknown';

export interface NormalizedRegion {
  raw: string | null;
  normalized: string;
  providerRegion: {
    azure: string;
    aws: string;
    gcp: string;
  };
  confidence: Confidence;
}

interface BaseNormalizedComponent {
  id: string;
  type: NormalizedComponentType;
  name: string;
  providerServiceHint: {
    azure: string | null;
    aws: string | null;
    gcp: string | null;
  };
  pricingStatus: PricingStatus;
  azureService?: string | null;
  confidence: Confidence;
  missingFields: string[];
  assumptions: string[];
  rawText: string;
}

export interface ComputeComponent extends BaseNormalizedComponent {
  type: 'compute';
  role: string | null;
  quantity: number | null;
  vcpu: number | null;
  memoryGb: number | null;
  operatingSystem: OperatingSystem | null;
  imageType: ImageType | null;
  os?: string | null;
  image?: string | null;
  monthlyHours: number;
}

export interface DatabaseComponent extends BaseNormalizedComponent {
  type: 'database';
  engine: 'postgresql' | null;
  managed: boolean;
  vcpu: number | null;
  memoryGb: number | null;
  storageGb: number | null;
  storageType: 'ssd' | null;
  highAvailability: boolean | null;
  backupRetentionDays?: number | null;
}

export interface CacheComponent extends BaseNormalizedComponent {
  type: 'cache';
  engine: 'redis' | null;
  memoryGb: number | null;
  tier: string | null;
  highAvailability?: boolean | null;
}

export interface CdnComponent extends BaseNormalizedComponent {
  type: 'cdn';
  purpose: string | null;
  dataTransferGb: number | null;
  usage?: string | null;
  monthlyTransferGb?: number | null;
  requestCount?: number | null;
}

export interface LoadBalancerComponent extends BaseNormalizedComponent {
  type: 'load_balancer';
  target: string | null;
  targets?: string | null;
  scheme: 'http_s' | 'tcp' | null;
  publicFacing?: boolean | null;
}

export interface GenericComponent extends BaseNormalizedComponent {
  type:
    | 'storage'
    | 'object_storage'
    | 'block_storage'
    | 'file_storage'
    | 'kubernetes'
    | 'serverless'
    | 'queue'
    | 'monitoring'
    | 'backup'
    | 'security'
    | 'network'
    | 'unknown';
  [key: string]: unknown;
}

export type NormalizedComponent = ComputeComponent | DatabaseComponent | CacheComponent | CdnComponent | LoadBalancerComponent | GenericComponent;

export interface NormalizedInfrastructureRequirement {
  region: NormalizedRegion;
  components: NormalizedComponent[];
  globalAssumptions: string[];
  clarifyingQuestions: string[];
  extractionMethod: ExtractionMethod;
}

export interface EstimateRequest {
  provider: Provider;
  region: string;
  service: AzureService;
  operatingSystem: OperatingSystem;
  imageType: ImageType;
  tier: Tier;
  category: Category;
  instanceSeries: string;
  instanceSku: string;
  quantity: number;
  hours: number;
  pricingModel: PricingModel;
}

export interface AzureVmPriceLookupInput {
  region: string;
  operatingSystem: OperatingSystem;
  tier: Tier;
  instanceSku: string;
}

export interface AzureVmPriceResult {
  serviceName: 'Virtual Machines';
  skuName: string;
  meterName: string;
  unit: string;
  unitPrice: number;
  assumption: string;
  pricingSource: PricingSource;
  confidence: Confidence;
  rawProductName: string | null;
  rawSkuName: string | null;
  rawMeterName: string | null;
  rawArmRegionName: string | null;
}

export interface EstimateLineItem {
  category: 'Compute' | 'Storage' | 'Networking' | 'Database' | 'Cache' | 'Integration' | 'Management';
  serviceName: string;
  skuName: string;
  meterName: string;
  quantity: number;
  hours: number;
  usageLabel?: string;
  unit: string;
  unitPrice: number;
  monthlyCost: number;
  assumption: string;
  pricingSource: PricingSource;
  confidence: Confidence;
  rawProductName: string | null;
  rawSkuName: string | null;
  rawMeterName: string | null;
  rawArmRegionName: string | null;
}

export interface EstimateResponse {
  provider: Provider;
  service: AzureService;
  region: string;
  currency: 'USD';
  totalMonthlyCost: number;
  confidence: Confidence;
  lineItems: EstimateLineItem[];
  assumptions: string[];
}

export interface NormalizedEstimateRequest {
  provider: Provider;
  requirements: NormalizedInfrastructureRequirement;
}

export interface NotImplementedLineItem {
  componentId: string;
  type: Exclude<NormalizedComponentType, 'compute'>;
  serviceName: string;
  reason: string;
  assumptions: string[];
  rawText?: string;
}

export interface UnpricedLineItem {
  componentId: string;
  type: NormalizedComponentType;
  serviceName: string;
  reason: string;
  assumptions: string[];
  rawText?: string;
}

export interface NormalizedEstimateResponse {
  provider: Provider;
  region: string;
  currency: 'USD';
  totalMonthlyCost: number;
  estimateQuality: {
    status: 'complete' | 'partial' | 'blocked';
    coveragePercent: number;
    pricedComponentCount: number;
    totalComponentCount: number;
    summary: string;
    blockers: string[];
  };
  calculatedLineItems: EstimateLineItem[];
  notImplementedLineItems: NotImplementedLineItem[];
  unsupportedLineItems: UnpricedLineItem[];
  missingRequiredFieldLineItems: UnpricedLineItem[];
  assumptions: string[];
  clarifyingQuestions: string[];
}
