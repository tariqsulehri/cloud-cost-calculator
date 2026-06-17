export type Provider = 'azure';
export type AzureService = 'virtual-machines';
export type OperatingSystem = 'linux';
export type ImageType = 'ubuntu';
export type Tier = 'standard';
export type Category = 'all';
export type PricingModel = 'pay-as-you-go';
export type Confidence = 'low' | 'medium' | 'high';
export type PricingSource = 'azure-retail-prices-api' | 'fallback';
export type ExtractionMethod = 'llm' | 'rule-based-fallback';
export type PricingStatus = 'supported' | 'not_implemented' | 'missing_required_fields' | 'unsupported' | 'needs_review';

export interface AzureRegion {
  name: string;
  value: string;
}

export interface VmOption {
  label: string;
  value: string;
}

export interface VmInstanceOption extends VmOption {
  alternateSku: string;
}

export interface VmSeriesOption extends VmOption {
  instances: VmInstanceOption[];
}

export interface VmOptions {
  operatingSystems: Array<VmOption & { value: OperatingSystem }>;
  imageTypes: Array<VmOption & { value: ImageType }>;
  tiers: Array<VmOption & { value: Tier }>;
  categories: Array<VmOption & { value: Category }>;
  instanceSeries: VmSeriesOption[];
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

export interface NormalizedComponent {
  id: string;
  type: NormalizedComponentType;
  name: string;
  providerServiceHint: {
    azure: string | null;
    aws: string | null;
    gcp: string | null;
  };
  pricingStatus: PricingStatus;
  confidence: Confidence;
  missingFields: string[];
  assumptions: string[];
  rawText: string;
  [key: string]: unknown;
}

export interface NormalizedInfrastructureRequirement {
  region: NormalizedRegion;
  components: NormalizedComponent[];
  globalAssumptions: string[];
  clarifyingQuestions: string[];
  extractionMethod: ExtractionMethod;
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

export interface NaturalLanguageEstimateResponse {
  provider: Provider;
  region: string;
  currency: 'USD';
  totalMonthlyCost: number;
  estimateQuality?: {
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

export interface CatalogService {
  id: number;
  serviceKey: string;
  providerId: 'azure' | 'aws' | 'gcp';
  componentType: NormalizedComponentType;
  canonicalName: string;
  providerNamespace: string | null;
  pricingServiceName: string | null;
  serviceFamily: string | null;
  defaultPricingStatus: string;
  aliases: string[];
  requiredFields: string[];
}
