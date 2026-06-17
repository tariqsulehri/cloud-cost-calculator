import { describe, expect, it } from 'vitest';
import { RequirementExtractionService } from './RequirementExtractionService.js';
import type { CacheComponent, CdnComponent, ComputeComponent, DatabaseComponent, GenericComponent, LoadBalancerComponent } from '../types/estimate.types.js';

const service = new RequirementExtractionService();

const exactPrompt = `I need 2 web servers with 4 vCPU and 16GB RAM each, running Linux Ubuntu.
A managed PostgreSQL database with 8 vCPU and 32GB RAM, 500GB SSD storage with highly available option.
Redis cache production grade with 2GB memory.
A CDN for static assets, 1TB data transfer per month.
Load balancer HTTP/S across both servers.
All in US East region.`;

function component<T extends { type: string }>(type: T['type'], prompt: string): T {
  const result = service.extractRequirements(prompt);
  const found = result.components.find((candidate) => candidate.type === type);
  if (!found) {
    throw new Error(`Expected component ${type}`);
  }
  return found as T;
}

describe('RequirementExtractionService phrase detection', () => {
  it('detects explicit HA, Redis production tier, and HTTP/S load balancer scheme in exact prompt', () => {
    const result = service.extractRequirements(exactPrompt);
    const database = result.components.find((candidate) => candidate.type === 'database') as DatabaseComponent;
    const cache = result.components.find((candidate) => candidate.type === 'cache') as CacheComponent;
    const loadBalancer = result.components.find((candidate) => candidate.type === 'load_balancer') as LoadBalancerComponent;

    expect(database.highAvailability).toBe(true);
    expect(database.missingFields).not.toContain('highAvailability');
    expect(cache.tier).toBe('production');
    expect(cache.missingFields).not.toContain('tier');
    expect(loadBalancer.scheme).toBe('http_s');
    expect(loadBalancer.missingFields).not.toContain('scheme');
    expect(result.clarifyingQuestions).not.toContain('Should PostgreSQL be highly available?');
    expect(result.clarifyingQuestions).not.toContain('Should Redis be basic/dev or production-grade?');
    expect(result.clarifyingQuestions).not.toContain('Is the load balancer HTTP/S or TCP?');
  });

  it('detects PostgreSQL highly available option', () => {
    const database = component<DatabaseComponent>('database', 'PostgreSQL with highly available option');

    expect(database.highAvailability).toBe(true);
  });

  it('detects PostgreSQL high availability', () => {
    const database = component<DatabaseComponent>('database', 'PostgreSQL with high availability');

    expect(database.highAvailability).toBe(true);
  });

  it('detects Redis cache production grade', () => {
    const cache = component<CacheComponent>('cache', 'Redis cache production grade');

    expect(cache.tier).toBe('production');
  });

  it('detects Redis cache premium tier', () => {
    const cache = component<CacheComponent>('cache', 'Redis cache premium tier');

    expect(cache.tier).toBe('production');
  });

  it('detects Load balancer HTTP/S', () => {
    const loadBalancer = component<LoadBalancerComponent>('load_balancer', 'Load balancer HTTP/S');

    expect(loadBalancer.scheme).toBe('http_s');
  });

  it('detects Load balancer HTTPS', () => {
    const loadBalancer = component<LoadBalancerComponent>('load_balancer', 'Load balancer HTTPS');

    expect(loadBalancer.scheme).toBe('http_s');
  });

  it('detects Load balancer TCP', () => {
    const loadBalancer = component<LoadBalancerComponent>('load_balancer', 'Load balancer TCP');

    expect(loadBalancer.scheme).toBe('tcp');
  });

  it('detects quantity when descriptors appear before virtual machines', () => {
    const compute = component<ComputeComponent>(
      'compute',
      `I need 3 Linux Ubuntu virtual machines in East US.
Each VM should have 2 vCPU and 8GB RAM.
They will run 730 hours per month.`
    );

    expect(compute.quantity).toBe(3);
    expect(compute.vcpu).toBe(2);
    expect(compute.memoryGb).toBe(8);
    expect(compute.monthlyHours).toBe(730);
    expect(compute.missingFields).toEqual([]);
  });

  it('ignores open-item checklist questions while keeping answered clarifications', () => {
    const result = service.extractRequirements(`Azure Cost Estimation Request:

Compute:
- Azure Virtual Machines
  - Quantity: 2
  - vCPU: 4 each
  - RAM: 16 GB each
  - Operating System: Linux Ubuntu
  - Region: US East

Database:
- Azure Database for PostgreSQL Flexible Server
  - vCPU: 8
  - RAM: 32 GB
  - Storage: 500 GB SSD
  - Region: US East

Cache:
- Azure Cache for Redis
  - Memory Size: 2 GB
  - Region: US East

Content Delivery Network:
- Azure CDN
  - Data Transfer: 1 TB per month
  - Region: US East

Load Balancing:
- Azure Load Balancer (or Azure Application Gateway if HTTP/S specified)
  - Backend pool: 2 web servers
  - Region: US East

Open items to complete before estimate:
- Load balancer type (Basic, Standard, Application Gateway) and SKU
- Pricing model (Reserved, Pay-as-you-go, etc.) for VMs and Database
- Backup/High availability requirements for database and cache
- Any monitoring or logging requirements
- Data transfer details beyond CDN usage (Ingress/Egress)
Redis tier: production.`);

    const types = result.components.map((candidate) => candidate.type);
    const compute = result.components.find((candidate) => candidate.type === 'compute') as ComputeComponent;
    const database = result.components.find((candidate) => candidate.type === 'database') as DatabaseComponent;
    const cache = result.components.find((candidate) => candidate.type === 'cache') as CacheComponent;
    const cdn = result.components.find((candidate) => candidate.type === 'cdn') as CdnComponent;
    const loadBalancer = result.components.find((candidate) => candidate.type === 'load_balancer') as LoadBalancerComponent;

    expect(types).toEqual(expect.arrayContaining(['compute', 'database', 'cache', 'cdn', 'load_balancer']));
    expect(types).not.toContain('monitoring');
    expect(types).not.toContain('network');
    expect(compute.quantity).toBe(2);
    expect(cache.tier).toBe('production');
    expect(cdn.dataTransferGb).toBe(1024);
    expect(database.highAvailability).toBeNull();
    expect(database.missingFields).toContain('highAvailability');
    expect(loadBalancer.scheme).toBeNull();
    expect(loadBalancer.missingFields).toContain('scheme');
  });

  it('does not create standalone compute from AKS or managed service server wording', () => {
    const result = service.extractRequirements(`Azure Kubernetes Service (AKS)
- Cluster size: 4 Linux worker nodes
- Node specifications: 8 vCPU, 32 GB RAM per node
- Azure Database for PostgreSQL Flexible Server
- SKU or tier for AKS worker node VMs: not specified`);

    expect(result.components.map((candidate) => candidate.type)).toContain('kubernetes');
    expect(result.components.map((candidate) => candidate.type)).not.toContain('compute');
  });

  it('detects CDN monthly transfer label', () => {
    const cdn = component<CdnComponent>(
      'cdn',
      `CDN:
- Static assets
- Monthly transfer: 1 TB`
    );

    expect(cdn.dataTransferGb).toBe(1024);
    expect(cdn.missingFields).toEqual(['tier']);
  });

  it('ignores pasted result sections when extracting a prompt', () => {
    const result = service.extractRequirements(`I need infrastructure in Azure East US.

Prompt:
I need 3 Linux Ubuntu virtual machines in East US.
Each VM should have 2 vCPU and 8GB RAM.
They will run 730 hours per month.

Result:

Compute:
- 2 web servers
- Each server: 4 vCPU, 16 GB RAM

Database:
- Managed PostgreSQL
- 8 vCPU
- 32 GB RAM`);

    const compute = result.components.find((candidate) => candidate.type === 'compute') as ComputeComponent;

    expect(result.components).toHaveLength(1);
    expect(compute.quantity).toBe(3);
    expect(compute.vcpu).toBe(2);
    expect(compute.memoryGb).toBe(8);
  });

  it('detects PostgreSQL storage label with TB unit', () => {
    const database = component<DatabaseComponent>(
      'database',
      'Managed PostgreSQL database - 8 vCPU, 32 GB RAM - storage: 1 TB SSD - high availability yes'
    );

    expect(database.storageGb).toBe(1024);
    expect(database.missingFields).not.toContain('storageGb');
  });

  it('detects API Gateway as load balancer target', () => {
    const loadBalancer = component<LoadBalancerComponent>(
      'load_balancer',
      'Expose the API Gateway through an HTTP/S public load balancer or ingress.'
    );

    expect(loadBalancer.target).toBe('API Gateway service');
  });

  it('detects AKS worker node compute sizing', () => {
    const kubernetes = component<GenericComponent>(
      'kubernetes',
      `The application will run on Kubernetes using AKS.
The AKS cluster should have 4 Linux worker nodes.
Each worker node should have 8 vCPU and 32GB RAM.
The cluster should run 730 hours per month.
Use Ubuntu Linux nodes.`
    );

    expect(kubernetes.nodeCount).toBe(4);
    expect(kubernetes.vcpuPerNode).toBe(8);
    expect(kubernetes.memoryGbPerNode).toBe(32);
    expect(kubernetes.operatingSystem).toBe('linux');
    expect(kubernetes.imageType).toBe('ubuntu');
    expect(kubernetes.monthlyHours).toBe(730);
    expect(kubernetes.missingFields).toEqual([]);
  });

  it('detects AKS worker node count when Linux and Ubuntu both describe nodes', () => {
    const kubernetes = component<GenericComponent>(
      'kubernetes',
      `Kubernetes cluster: AKS with 4 Linux Ubuntu worker nodes.
Each node: 8 vCPU, 32 GB RAM.
Cluster runtime: 730 hours per month.`
    );

    expect(kubernetes.nodeCount).toBe(4);
    expect(kubernetes.missingFields).not.toContain('nodeCount');
  });

  it('detects platform services that are excluded from VM-only pricing', () => {
    const result = service.extractRequirements(`Use Azure Blob Storage for product images with 5TB hot data.
Use Azure Service Bus for 10 million messages per month.
Use Azure Monitor and Log Analytics with 200GB log ingestion and 30 days retention.
Expected internet egress excluding CDN is 1TB per month.
Use backup retention of 30 days.`);

    expect(result.components.map((candidate) => candidate.type)).toEqual(
      expect.arrayContaining(['object_storage', 'queue', 'monitoring', 'network'])
    );
    expect(result.components.map((candidate) => candidate.type)).not.toContain('backup');
  });

  it('detects standalone backup only when Azure Backup is explicitly requested', () => {
    const backup = component<GenericComponent>('backup', 'Use Azure Backup with 30 days retention.');

    expect(backup.providerServiceHint.azure).toBe('Azure Backup');
    expect(backup.retentionDays).toBe(30);
  });
});
