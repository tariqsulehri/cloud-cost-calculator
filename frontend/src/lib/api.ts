import axios from 'axios';
import type {
  AzureRegion,
  AzureCatalogSyncAllResult,
  AzureCatalogSyncStatus,
  AwsCatalogSyncAllResult,
  AwsCatalogSyncStatus,
  CatalogService,
  EstimateRequest,
  EstimateResponse,
  GcpCatalogSyncAllResult,
  GcpCatalogSyncStatus,
  NaturalLanguageEstimateResponse,
  NormalizedEstimateRequest,
  NormalizedInfrastructureRequirement,
  Provider,
  VmOptions
} from '../types/estimate';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api',
  timeout: 30000
});

export async function getAzureRegions(): Promise<AzureRegion[]> {
  const response = await api.get<AzureRegion[]>('/azure/regions');
  return response.data;
}

export async function getVmOptions(): Promise<VmOptions> {
  const response = await api.get<VmOptions>('/azure/vm-options');
  return response.data;
}

export async function createEstimate(payload: EstimateRequest): Promise<EstimateResponse> {
  const response = await api.post<EstimateResponse>('/estimate', payload);
  return response.data;
}

export async function extractRequirements(requirementText: string): Promise<NormalizedInfrastructureRequirement> {
  const response = await api.post<NormalizedInfrastructureRequirement>('/requirements/extract', { requirementText });
  return response.data;
}

export async function refineRequirements(requirementText: string, options: { provider?: Provider } = {}): Promise<string> {
  const response = await api.post<{ refinedPrompt: string }>('/requirements/refine', { requirementText, provider: options.provider });
  return response.data.refinedPrompt;
}

export async function createNaturalLanguageEstimate(payload: NormalizedEstimateRequest): Promise<NaturalLanguageEstimateResponse> {
  const response = await api.post<NaturalLanguageEstimateResponse>('/estimate', payload, { timeout: 90000 });
  return response.data;
}

export async function searchCatalogServices(
  query = '',
  options: { provider?: CatalogService['providerId'] } = {}
): Promise<CatalogService[]> {
  const params = {
    ...(query.trim() ? { q: query.trim() } : {}),
    ...(options.provider ? { provider: options.provider } : {})
  };
  const response = await api.get<{ services: CatalogService[] }>('/catalog/services', {
    params: Object.keys(params).length > 0 ? params : undefined
  });
  return response.data.services;
}

export async function getAwsCatalogSyncStatus(): Promise<AwsCatalogSyncStatus> {
  const response = await api.get<AwsCatalogSyncStatus>('/catalog/sync/aws-public-prices/status');
  return response.data;
}

export async function syncAwsPublicPrices(): Promise<AwsCatalogSyncAllResult> {
  const response = await api.post<AwsCatalogSyncAllResult>('/catalog/sync/aws-public-prices/all', {}, { timeout: 300000 });
  return response.data;
}

export async function getAzureCatalogSyncStatus(): Promise<AzureCatalogSyncStatus> {
  const response = await api.get<AzureCatalogSyncStatus>('/catalog/sync/azure-retail-prices/status');
  return response.data;
}

export async function syncAzurePublicPrices(): Promise<AzureCatalogSyncAllResult> {
  const response = await api.post<AzureCatalogSyncAllResult>('/catalog/sync/azure-retail-prices/all', {}, { timeout: 300000 });
  return response.data;
}

export async function getGcpCatalogSyncStatus(): Promise<GcpCatalogSyncStatus> {
  const response = await api.get<GcpCatalogSyncStatus>('/catalog/sync/gcp-public-prices/status');
  return response.data;
}

export async function syncGcpPublicPrices(): Promise<GcpCatalogSyncAllResult> {
  const response = await api.post<GcpCatalogSyncAllResult>('/catalog/sync/gcp-public-prices/all', {}, { timeout: 300000 });
  return response.data;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data?.error;
    if (typeof apiError === 'string') {
      return apiError;
    }
    if (error.code === 'ECONNABORTED') {
      const url = error.config?.url ?? '';
      if (url.includes('/requirements/refine')) {
        return 'The refine request timed out. The app can still use the current prompt for extraction.';
      }
      if (url.includes('/requirements/extract')) {
        return 'The extraction request timed out. Try again, or simplify the prompt and refine it first.';
      }
      if (url.includes('/estimate')) {
        return 'The estimate request timed out while waiting for pricing data.';
      }
      return 'The request timed out.';
    }
    return error.message;
  }

  return 'Something went wrong while creating the estimate.';
}
