import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createNaturalLanguageEstimate, extractRequirements, refineRequirements, searchCatalogServices } from './lib/api';
import type { CatalogService, NaturalLanguageEstimateResponse, NormalizedInfrastructureRequirement } from './types/estimate';

vi.mock('./lib/api', () => ({
  extractRequirements: vi.fn(),
  refineRequirements: vi.fn(),
  createNaturalLanguageEstimate: vi.fn(),
  searchCatalogServices: vi.fn(),
  getApiErrorMessage: vi.fn(() => 'Request failed')
}));

const extractedRequirements: NormalizedInfrastructureRequirement = {
  region: {
    raw: 'us east',
    normalized: 'eastus',
    providerRegion: { azure: 'eastus', aws: 'us-east-1', gcp: 'us-east1' },
    confidence: 'high'
  },
  components: [
    {
      id: 'compute-1',
      type: 'compute',
      name: 'Virtual machines',
      providerServiceHint: { azure: 'Virtual Machines', aws: 'EC2', gcp: 'Compute Engine' },
      pricingStatus: 'supported',
      rawText: '2 web servers with 4 vCPU and 16GB RAM each, running Linux Ubuntu',
      role: 'web servers',
      quantity: 2,
      vcpu: 4,
      memoryGb: 16,
      operatingSystem: 'linux',
      imageType: 'ubuntu',
      monthlyHours: 730,
      confidence: 'high',
      missingFields: [],
      assumptions: ['Compute hours default to 730 hours per month.']
    },
    {
      id: 'database-1',
      type: 'database',
      name: 'PostgreSQL database',
      providerServiceHint: { azure: 'Azure Database for PostgreSQL', aws: 'Amazon RDS for PostgreSQL', gcp: 'Cloud SQL for PostgreSQL' },
      pricingStatus: 'not_implemented',
      rawText: 'A managed PostgreSQL database with 8 vCPU and 32GB RAM, 500GB SSD storage.',
      engine: 'postgresql',
      managed: true,
      vcpu: 8,
      memoryGb: 32,
      storageGb: 500,
      storageType: 'ssd',
      highAvailability: null,
      confidence: 'high',
      missingFields: ['highAvailability'],
      assumptions: ['PostgreSQL pricing is detected but not implemented in this phase.']
    }
  ],
  globalAssumptions: ['Requirement extraction is rule-based; no LLM is used yet.'],
  clarifyingQuestions: ['Should PostgreSQL be highly available?'],
  extractionMethod: 'llm'
};

const estimateResponse: NaturalLanguageEstimateResponse = {
  provider: 'azure',
  region: 'eastus',
  currency: 'USD',
  totalMonthlyCost: 280.32,
  calculatedLineItems: [
    {
      category: 'Compute',
      serviceName: 'Virtual Machines',
      skuName: 'D4s v5',
      meterName: 'D4s v5',
      quantity: 2,
      hours: 730,
      unit: '1 Hour',
      unitPrice: 0.192,
      monthlyCost: 280.32,
      assumption: 'Matched VM pricing.',
      pricingSource: 'azure-retail-prices-api',
      confidence: 'high',
      rawProductName: 'Virtual Machines Dsv5 Series',
      rawSkuName: 'D4s v5',
      rawMeterName: 'D4s v5',
      rawArmRegionName: 'eastus'
    }
  ],
  notImplementedLineItems: [
    {
      componentId: 'database-1',
      type: 'database',
      serviceName: 'Azure Database for PostgreSQL',
      reason: 'Detected but pricing not implemented yet.',
      assumptions: [],
      rawText: 'A managed PostgreSQL database with 8 vCPU and 32GB RAM, 500GB SSD storage.'
    }
  ],
  unsupportedLineItems: [],
  missingRequiredFieldLineItems: [],
  assumptions: ['Only Azure VM pricing is calculated in this phase.'],
  clarifyingQuestions: ['Should PostgreSQL be highly available?']
};

const extractedWithMissingStorage: NormalizedInfrastructureRequirement = {
  ...extractedRequirements,
  components: extractedRequirements.components.map((component) =>
    component.id === 'database-1'
      ? {
          ...component,
          storageGb: null,
          missingFields: ['storageGb']
        }
      : component
  )
};

const extractedKubernetesRequirements: NormalizedInfrastructureRequirement = {
  ...extractedRequirements,
  components: [
    {
      id: 'kubernetes-1',
      type: 'kubernetes',
      name: 'AKS cluster',
      providerServiceHint: { azure: 'Azure Kubernetes Service', aws: 'Amazon EKS', gcp: 'Google Kubernetes Engine' },
      pricingStatus: 'not_implemented',
      rawText: 'AKS cluster with 4 Linux worker nodes. Each worker node should have 8 vCPU and 32GB RAM.',
      nodeCount: 4,
      vcpuPerNode: 8,
      memoryGbPerNode: 32,
      operatingSystem: 'linux',
      imageType: 'ubuntu',
      monthlyHours: 730,
      confidence: 'high',
      missingFields: [],
      assumptions: ['AKS worker node compute can be estimated from node count, vCPU, memory, OS, image, and monthly runtime.']
    }
  ],
  clarifyingQuestions: []
};

const extractedKubernetesMissingNodeCount: NormalizedInfrastructureRequirement = {
  ...extractedKubernetesRequirements,
  components: extractedKubernetesRequirements.components.map((component) => ({
    ...component,
    nodeCount: null,
    missingFields: ['nodeCount'],
    pricingStatus: 'missing_required_fields'
  }))
};

const extractedCacheOnlyRequirements: NormalizedInfrastructureRequirement = {
  ...extractedRequirements,
  components: [
    {
      id: 'cache-1',
      type: 'cache',
      name: 'Redis cache',
      providerServiceHint: { azure: 'Azure Cache for Redis', aws: 'Amazon ElastiCache for Redis', gcp: 'Memorystore for Redis' },
      pricingStatus: 'not_implemented',
      rawText: 'Production Redis cache with 6 GB memory.',
      engine: 'redis',
      memoryGb: 6,
      tier: 'production',
      confidence: 'high',
      missingFields: [],
      assumptions: ['Redis pricing can be estimated from memory size and tier.']
    }
  ],
  clarifyingQuestions: []
};

const mappedCatalogServices: CatalogService[] = [
  {
    id: 1,
    serviceKey: 'redis_cache',
    providerId: 'azure',
    componentType: 'cache',
    canonicalName: 'Azure Cache for Redis',
    providerNamespace: 'Microsoft.Cache',
    pricingServiceName: 'Azure Cache for Redis',
    serviceFamily: 'Cache',
    defaultPricingStatus: 'supported',
    aliases: ['redis', 'cache'],
    requiredFields: ['tier', 'memoryGb']
  },
  {
    id: 2,
    serviceKey: 'redis_cache',
    providerId: 'aws',
    componentType: 'cache',
    canonicalName: 'Amazon ElastiCache for Redis',
    providerNamespace: null,
    pricingServiceName: 'Amazon ElastiCache',
    serviceFamily: 'Cache',
    defaultPricingStatus: 'not_implemented',
    aliases: ['redis', 'cache'],
    requiredFields: ['tier', 'memoryGb']
  },
  {
    id: 3,
    serviceKey: 'redis_cache',
    providerId: 'gcp',
    componentType: 'cache',
    canonicalName: 'Memorystore for Redis',
    providerNamespace: null,
    pricingServiceName: 'Memorystore',
    serviceFamily: 'Cache',
    defaultPricingStatus: 'not_implemented',
    aliases: ['redis', 'cache'],
    requiredFields: ['tier', 'memoryGb']
  }
];

const productionMicroservicesPrompt = `I need to estimate the monthly Azure cost for a production microservices platform in US East.

The application will run on Kubernetes using AKS.

There are 8 microservices:
1. API Gateway service
2. User service
3. Product catalog service
4. Order service
5. Payment service
6. Notification service
7. Inventory service
8. Reporting service

The AKS cluster should have 4 Linux worker nodes.
Each worker node should have 8 vCPU and 32GB RAM.
The cluster should run 730 hours per month.
Use Ubuntu Linux nodes.

Expose the API Gateway through an HTTP/S public load balancer or ingress.
Use TLS/SSL termination.
The other microservices should be internal only.

Use a highly available managed PostgreSQL database for transactional data.
The PostgreSQL database should have 8 vCPU, 32GB RAM, 1TB SSD storage, and 7 days backup retention.
It should be production grade and zone redundant.

Use Redis as a production-grade cache for sessions and frequently accessed catalog data.
Redis should have 6GB memory and high availability enabled.

Use object storage for product images, invoices, and exported reports.
Object storage should store around 5TB of data.
The storage should use hot access tier because files are accessed frequently.

Use CDN for public static assets and product images.
Expected CDN data transfer is 3TB per month.
Expected request count is around 20 million requests per month.

The platform will publish asynchronous events between services.
Use a managed message queue or event bus.
Expected volume is 10 million messages per month.

Use monitoring and logging for all microservices.
Expected log ingestion is 200GB per month.
Keep logs for 30 days.

Use backup for PostgreSQL and object storage.
Backup retention should be 30 days.

Expected internet egress from the platform, excluding CDN, is 1TB per month.

All services should be deployed in Azure East US.
Use pay-as-you-go pricing.
No reserved instances, savings plans, or enterprise discounts.`;

describe('App', () => {
  beforeEach(() => {
    vi.mocked(extractRequirements).mockResolvedValue(extractedRequirements);
    vi.mocked(refineRequirements).mockImplementation(async (value: string) => value);
    vi.mocked(createNaturalLanguageEstimate).mockResolvedValue(estimateResponse);
    vi.mocked(searchCatalogServices).mockResolvedValue(mappedCatalogServices);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders requirement textarea', () => {
    render(<App />);

    expect(screen.getByLabelText('Requirement text')).toBeInTheDocument();
  });

  it('renders Find services button', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'Find services' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Improve text' })).toBeInTheDocument();
  });

  it('shows service mapping tab with cloud equivalents', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /Service Mapping/ }));

    expect(await screen.findByText('Azure Cache for Redis')).toBeInTheDocument();
    expect(screen.getByText('Amazon ElastiCache for Redis')).toBeInTheDocument();
    expect(screen.getByText('Memorystore for Redis')).toBeInTheDocument();
  });

  it('shows AI help tab with guarded guidance', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /AI Help/ }));

    expect(screen.getByText('Ask about the estimate')).toBeInTheDocument();
    expect(screen.getByText(/Full AI chat can be connected later/)).toBeInTheDocument();
  });

  it('shows a refined prompt below and lets the user use it for extraction', async () => {
    vi.mocked(refineRequirements).mockResolvedValueOnce(`I need infrastructure in Azure East US.

Compute:
- 2 virtual machines

Database:
- Managed PostgreSQL

CDN:
- Monthly transfer: 1 TB`);
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Improve text' }));
    const refinedTextarea = screen.getByLabelText('Improved text') as HTMLTextAreaElement;
    expect(refinedTextarea.value).toContain('2 virtual machines');
    expect(refinedTextarea.value).toContain('Managed PostgreSQL');
    expect(refinedTextarea.value).toContain('Monthly transfer: 1 TB');
    expect(refinedTextarea.value).not.toContain('High availability: yes');
    await userEvent.click(screen.getByRole('button', { name: 'Use improved text' }));
    const textarea = screen.getByLabelText('Requirement text') as HTMLTextAreaElement;

    expect(textarea.value).toContain('2 virtual machines');
    expect(textarea.value).toContain('Managed PostgreSQL');
  });

  it('refines the current simple VM prompt instead of showing the canned multi-service prompt', async () => {
    vi.mocked(refineRequirements).mockRejectedValueOnce(new Error('fallback to local refine'));
    render(<App />);

    const textarea = screen.getByLabelText('Requirement text');
    await userEvent.clear(textarea);
    await userEvent.type(
      textarea,
      `I need infrastructure in Azure East US.

Prompt:
I need 3 Linux Ubuntu virtual machines in East US.
Each VM should have 2 vCPU and 8GB RAM.
They will run 730 hours per month.

Result:

Compute:
- 2 web servers
- Each server: 4 vCPU, 16 GB RAM
- OS: Linux
- Image: Ubuntu
- Monthly runtime: 730 hours

Database:
- Managed PostgreSQL`
    );

    await userEvent.click(screen.getByRole('button', { name: 'Improve text' }));
    const refinedTextarea = screen.getByLabelText('Improved text') as HTMLTextAreaElement;

    expect(refinedTextarea.value).toContain('3 virtual machines');
    expect(refinedTextarea.value).toContain('Each VM: 2 vCPU, 8 GB RAM');
    expect(refinedTextarea.value).toContain('Monthly runtime: 730 hours');
    expect(refinedTextarea.value).toContain('VMs / servers -> Azure Virtual Machines');
    expect(refinedTextarea.value).not.toContain('2 web servers');
    expect(refinedTextarea.value).not.toContain('Database:');
    expect(refinedTextarea.value).not.toContain('Redis');
    expect(refinedTextarea.value).not.toContain('Load Balancer');
  });

  it('refines the production AKS microservices prompt without dropping platform services', async () => {
    vi.mocked(refineRequirements).mockRejectedValueOnce(new Error('fallback to local refine'));
    render(<App />);

    const textarea = screen.getByLabelText('Requirement text');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, productionMicroservicesPrompt);
    await userEvent.click(screen.getByRole('button', { name: 'Improve text' }));

    const refinedTextarea = screen.getByLabelText('Improved text') as HTMLTextAreaElement;
    expect(refinedTextarea.value).toContain('Azure Service Dictionary:');
    expect(refinedTextarea.value).toContain('Kubernetes -> Azure Kubernetes Service (AKS)');
    expect(refinedTextarea.value).toContain('Kubernetes:');
    expect(refinedTextarea.value).toContain('AKS cluster');
    expect(refinedTextarea.value).toContain('8 microservices');
    expect(refinedTextarea.value).toContain('4 Linux worker nodes');
    expect(refinedTextarea.value).toContain('Each worker node: 8 vCPU, 32 GB RAM');
    expect(refinedTextarea.value).toContain('Type: HTTP/S');
    expect(refinedTextarea.value).toContain('TLS/SSL termination: yes');
    expect(refinedTextarea.value).toContain('Managed PostgreSQL');
    expect(refinedTextarea.value).toContain('1024 GB SSD storage');
    expect(refinedTextarea.value).toContain('Redis');
    expect(refinedTextarea.value).toContain('Memory: 6 GB');
    expect(refinedTextarea.value).toContain('Object Storage:');
    expect(refinedTextarea.value).toContain('Stored data: 5 TB');
    expect(refinedTextarea.value).toContain('CDN:');
    expect(refinedTextarea.value).toContain('Monthly transfer: 3 TB');
    expect(refinedTextarea.value).toContain('Monthly requests: 20 million');
    expect(refinedTextarea.value).toContain('Messaging:');
    expect(refinedTextarea.value).toContain('Monthly messages: 10 million');
    expect(refinedTextarea.value).toContain('Monitoring and Logging:');
    expect(refinedTextarea.value).toContain('Log ingestion: 200 GB per month');
    expect(refinedTextarea.value).toContain('Backup:');
    expect(refinedTextarea.value).toContain('Backup retention: 30 days');
    expect(refinedTextarea.value).toContain('Network Egress:');
    expect(refinedTextarea.value).toContain('Internet egress excluding CDN: 1 TB per month');
    expect(refinedTextarea.value).toContain('Pricing Model:');
    expect(refinedTextarea.value).toContain('Pay-as-you-go pricing');
  });

  it('shows review section after successful extraction', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Find services' }));

    expect(await screen.findByText('Step 2: Review services')).toBeInTheDocument();
    expect(screen.getByText('AI-assisted')).toBeInTheDocument();
    expect(screen.getByText('Azure region')).toBeInTheDocument();
    expect(screen.getByText('eastus')).toBeInTheDocument();
    expect(screen.getByText("Azure pricing is active now. Services marked Need info, Price not ready, or Can't price are not included in the total.")).toBeInTheDocument();
    expect(screen.getByText('database')).toBeInTheDocument();
  });

  it('clears stale extracted requirements when the prompt changes', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Find services' }));
    expect(await screen.findByText('Step 2: Review services')).toBeInTheDocument();

    const textarea = screen.getByLabelText('Requirement text');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'I need 3 Linux Ubuntu virtual machines in East US.');

    expect(screen.queryByText('Step 2: Review services')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Calculate Azure cost' })).not.toBeInTheDocument();
  });

  it('ignores extraction results that return after the prompt changed', async () => {
    let resolveExtraction: (value: NormalizedInfrastructureRequirement) => void = () => undefined;
    vi.mocked(extractRequirements).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveExtraction = resolve;
      })
    );
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Find services' }));
    const textarea = screen.getByLabelText('Requirement text');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'I need 3 Linux Ubuntu virtual machines in East US.');
    resolveExtraction(extractedRequirements);

    await waitFor(() => expect(screen.queryByText('Step 2: Review services')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Calculate Azure cost' })).not.toBeInTheDocument();
  });

  it('renders Calculate Azure cost button after extraction', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Find services' }));

    expect(await screen.findByRole('button', { name: 'Calculate Azure cost' })).toBeInTheDocument();
  });

  it('enables Calculate Azure cost for AKS worker node compute', async () => {
    vi.mocked(extractRequirements).mockResolvedValueOnce(extractedKubernetesRequirements);
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Find services' }));

    expect(await screen.findByRole('button', { name: 'Calculate Azure cost' })).toBeEnabled();
  });

  it('enables Calculate Azure cost for non-compute services with pricing adapters', async () => {
    vi.mocked(extractRequirements).mockResolvedValueOnce(extractedCacheOnlyRequirements);
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Find services' }));

    expect(await screen.findByRole('button', { name: 'Calculate Azure cost' })).toBeEnabled();
  });

  it('lets users fill missing AKS node count inline and enables estimate', async () => {
    vi.mocked(extractRequirements).mockResolvedValueOnce(extractedKubernetesMissingNodeCount);
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Find services' }));
    const calculateButton = await screen.findByRole('button', { name: 'Calculate Azure cost' });
    expect(calculateButton).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Node count'), '4');
    await userEvent.click(screen.getByRole('button', { name: 'Apply changes' }));

    expect(screen.queryByText('Missing: nodeCount')).not.toBeInTheDocument();
    expect(calculateButton).toBeEnabled();
  });

  it('adds selected clarification answers to the prompt', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Find services' }));
    expect(await screen.findByText('Should PostgreSQL be highly available?')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'Yes, highly available' }));

    const textarea = screen.getByLabelText('Requirement text') as HTMLTextAreaElement;
    expect(textarea.value).toContain('PostgreSQL high availability: yes.');
    expect(screen.queryByText('Should PostgreSQL be highly available?')).not.toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('lets users fill missing review fields inline', async () => {
    vi.mocked(extractRequirements).mockResolvedValueOnce(extractedWithMissingStorage);
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Find services' }));
    expect(await screen.findByText('Missing: storageGb')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Storage GB'), '1024');
    await userEvent.click(screen.getByRole('button', { name: 'Apply changes' }));

    expect(screen.queryByText('Missing: storageGb')).not.toBeInTheDocument();
  });

  it('shows estimate summary after successful estimate', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Find services' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Calculate Azure cost' }));

    await waitFor(() => expect(screen.getByText('Step 3: Azure Estimate')).toBeInTheDocument());
    expect(screen.getAllByText('$280.32').length).toBeGreaterThan(0);
    expect(screen.getByText('Azure Database for PostgreSQL')).toBeInTheDocument();
  });
});
