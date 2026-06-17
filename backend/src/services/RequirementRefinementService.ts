import OpenAI from 'openai';
import type { Provider } from '../types/estimate.types.js';

interface OpenAIResponsesClient {
  responses: {
    create(input: unknown): Promise<{ output_text?: string }>;
  };
}

function refinePrompt(provider: Provider): string {
  const profile = providerProfile(provider);
  return `Act as a senior ${profile.label} cloud architect and FinOps reviewer.
Refine the user's cloud infrastructure requirement into a clear structured ${profile.label} cost-estimation prompt.
Do not calculate prices.
Do not add services, quantities, tiers, regions, discounts, or assumptions that the user did not provide.
Preserve every service and specification the user mentioned, including compute, Kubernetes, databases, cache, storage, CDN, load balancing, networking, messaging, monitoring, logging, backup, security, data transfer, request counts, runtime hours, retention, availability, redundancy, operating system, pricing model, and discounts.
Translate written/generic services into the proper ${profile.label} service dictionary, for example Kubernetes -> ${profile.services.kubernetes}, virtual machines -> ${profile.services.compute}, managed PostgreSQL -> ${profile.services.postgres}, Redis -> ${profile.services.redis}, object storage -> ${profile.services.storage}, HTTP/S load balancer or ingress -> ${profile.services.loadBalancer}, message queue/event bus -> ${profile.services.queue}, monitoring/logging -> ${profile.services.monitoring}.
Normalize common units only when unambiguous, for example 1 TB = 1024 GB if writing storage in GB, or keep TB when that is clearer.
Normalize common East US aliases when unambiguous, for example useast, us-east, us_east, US East, East US, and eastus -> ${profile.eastUsLabel}.
Group requirements under concise headings by service area.
If a value is missing, keep the service and write "not specified" for that field instead of inventing a value.
Add an "Open items to complete before estimate" section when important pricing fields are missing, using short editable bullets.
If the user pasted sections named "Prompt:" and "Result:", refine only the actual prompt and ignore the pasted result.
Return only the refined prompt text.`;
}

export class RequirementRefinementService {
  private readonly client?: OpenAIResponsesClient;
  private readonly model: string;

  constructor(options: { client?: OpenAIResponsesClient; model?: string } = {}) {
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

  async refineRequirements(requirementText: string, provider: Provider = 'azure'): Promise<string> {
    const intentText = this.promptIntentText(requirementText);
    if (!this.client) {
      return refinePromptLocally(intentText, provider);
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        input: [
          { role: 'system', content: refinePrompt(provider) },
          { role: 'user', content: intentText }
        ]
      });

      return response.output_text?.trim() || refinePromptLocally(intentText, provider);
    } catch {
      return refinePromptLocally(intentText, provider);
    }
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

function refinePromptLocally(input: string, provider: Provider): string {
  const text = input.toLowerCase().replace(/\s+/g, ' ').trim();
  const sections: string[] = [];
  const profile = providerProfile(provider);
  const mappings = serviceMappings(text, provider);
  const openItems = openItemsFor(text);
  const region = regionLabelFromText(input, provider) ?? `${profile.label} region not specified`;

  if (mappings.length > 0) {
    sections.push(`${profile.label} Service Dictionary:\n${mappings.map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(kubernetes|aks|worker nodes?)/i.test(text)) {
    const nodeCount = workerNodeCount(text);
    const vcpu = numberNear(text, /(worker nodes|worker node|nodes)/, /(vcpu|vcpus|cpu|cpus)/);
    const memoryGb = numberNear(text, /(worker nodes|worker node|nodes)/, /(gb ram|gb memory|gib ram|gib memory)/);
    const hours = monthlyHours(text);
    sections.push(
      `Kubernetes:\n${[
        `${profile.label} service: ${profile.services.kubernetes}`,
        nodeCount ? `Worker nodes: ${nodeCount}` : 'Worker nodes: not specified',
        vcpu ? `vCPU per node: ${vcpu}` : 'vCPU per node: not specified',
        memoryGb ? `Memory per node: ${memoryGb} GB` : 'Memory per node: not specified',
        text.includes('linux') ? 'Node OS: Linux' : 'Node OS: not specified',
        text.includes('ubuntu') ? 'Node image: Ubuntu' : 'Node image: not specified',
        hours ? `Monthly runtime: ${hours} hours` : 'Monthly runtime: not specified'
      ]
        .map((line) => `- ${line}`)
        .join('\n')}`
    );
  }

  if (/(web server|server|vm|virtual machine)/i.test(text)) {
    const quantity = numberBefore(text, /(web servers|web server|servers|server|vms|virtual machines)/) ?? numberNearComputeNoun(text);
    const vcpu = numberBefore(text, /(vcpu|vcpus|cpu|cpus)/);
    const memoryGb = numberBefore(text, /(gb ram|gb memory|gib ram|gib memory)/);
    const hours = monthlyHours(text);
    sections.push(
      `Compute:\n${[
        `${profile.label} service: ${profile.services.compute}`,
        quantity ? `Virtual machines: ${quantity}` : 'Virtual machines: not specified',
        vcpu ? `vCPU per VM: ${vcpu}` : 'vCPU per VM: not specified',
        memoryGb ? `Memory per VM: ${memoryGb} GB` : 'Memory per VM: not specified',
        text.includes('linux') ? 'OS: Linux' : 'OS: not specified',
        text.includes('ubuntu') ? 'Image: Ubuntu' : 'Image: not specified',
        hours ? `Monthly runtime: ${hours} hours` : 'Monthly runtime: not specified'
      ]
        .map((line) => `- ${line}`)
        .join('\n')}`
    );
  }

  if (/(postgres|postgresql|database)/i.test(text)) {
    sections.push(`Database:\n${[`${profile.label} service: ${profile.services.postgres}`, /managed/.test(text) ? 'Deployment: managed' : 'Deployment: not specified']
      .map((line) => `- ${line}`)
      .join('\n')}`);
  }

  if (/(redis|cache)/i.test(text)) {
    sections.push(`Cache:\n${[`${profile.label} service: ${profile.services.redis}`, /redis/.test(text) ? 'Engine: Redis' : 'Engine: not specified'].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(object storage|product images|invoices|exported reports)/i.test(text)) {
    sections.push(`Object Storage:\n${[`${profile.label} service: ${profile.services.storage}`].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(cdn|static assets)/i.test(text)) {
    sections.push(`CDN:\n${[`${profile.label} service: ${profile.services.cdn}`].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(load balancer|ingress)/i.test(text)) {
    sections.push(`Load Balancer / Ingress:\n${[`${profile.label} service: ${profile.services.loadBalancer}`].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(message queue|event bus|asynchronous events|messages)/i.test(text)) {
    sections.push(`Messaging:\n${[`${profile.label} service: ${profile.services.queue}`].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(monitoring|logging|log ingestion|logs)/i.test(text)) {
    sections.push(`Monitoring and Logging:\n${[`${profile.label} service: ${profile.services.monitoring}`].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/\bbackup\b/i.test(text)) {
    sections.push(`Backup:\n${[`${profile.label} service: ${profile.services.backup}`].map((line) => `- ${line}`).join('\n')}`);
  }

  if (openItems.length > 0) {
    sections.push(`Open items to complete before estimate:\n${openItems.map((item) => `- ${item}: not specified`).join('\n')}`);
  }

  return sections.length > 0 ? [`I need infrastructure in ${region}.`, ...sections].join('\n\n') : input.trim();
}

function regionLabelFromText(input: string, provider: Provider): string | null {
  const raw = input.toLowerCase();
  const normalized = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (
    /\b(east us|us east|us east 1|us east1)\b/.test(normalized) ||
    /(^|[^a-z0-9])(eastus|useast)([^a-z0-9]|$)/.test(raw)
  ) {
    return providerProfile(provider).eastUsLabel;
  }

  return null;
}

function providerProfile(provider: Provider): { label: string; eastUsLabel: string; services: Record<string, string> } {
  const profiles: Record<Provider, { label: string; eastUsLabel: string; services: Record<string, string> }> = {
    azure: {
      label: 'Azure',
      eastUsLabel: 'Azure East US',
      services: {
        kubernetes: 'Azure Kubernetes Service (AKS)',
        compute: 'Azure Virtual Machines',
        postgres: 'Azure Database for PostgreSQL Flexible Server',
        redis: 'Azure Cache for Redis',
        storage: 'Azure Blob Storage',
        cdn: 'Azure CDN / Azure Front Door',
        loadBalancer: 'Azure Application Gateway',
        queue: 'Azure Service Bus',
        monitoring: 'Azure Monitor / Log Analytics',
        backup: 'Azure Backup'
      }
    },
    aws: {
      label: 'AWS',
      eastUsLabel: 'AWS US East (N. Virginia)',
      services: {
        kubernetes: 'Amazon EKS',
        compute: 'Amazon EC2',
        postgres: 'Amazon RDS for PostgreSQL',
        redis: 'Amazon ElastiCache for Redis',
        storage: 'Amazon S3',
        cdn: 'Amazon CloudFront',
        loadBalancer: 'Application Load Balancer',
        queue: 'Amazon SQS / EventBridge',
        monitoring: 'Amazon CloudWatch',
        backup: 'AWS Backup'
      }
    },
    gcp: {
      label: 'GCP',
      eastUsLabel: 'GCP us-east1',
      services: {
        kubernetes: 'Google Kubernetes Engine (GKE)',
        compute: 'Compute Engine',
        postgres: 'Cloud SQL for PostgreSQL',
        redis: 'Memorystore for Redis',
        storage: 'Cloud Storage',
        cdn: 'Cloud CDN',
        loadBalancer: 'Cloud Load Balancing',
        queue: 'Pub/Sub',
        monitoring: 'Cloud Monitoring / Cloud Logging',
        backup: 'Backup and DR Service'
      }
    }
  };

  return profiles[provider];
}

function serviceMappings(text: string, provider: Provider): string[] {
  const mappings: string[] = [];
  const services = providerProfile(provider).services;
  if (/(kubernetes|aks|worker nodes?)/i.test(text)) mappings.push(`Kubernetes -> ${services.kubernetes}`);
  if (/(web server|server|vm|virtual machine)/i.test(text)) mappings.push(`VMs / servers -> ${services.compute}`);
  if (/(postgres|postgresql|database)/i.test(text)) mappings.push(`Managed PostgreSQL -> ${services.postgres}`);
  if (/(redis|cache)/i.test(text)) mappings.push(`Redis cache -> ${services.redis}`);
  if (/(object storage|product images|invoices|exported reports)/i.test(text)) mappings.push(`Object storage -> ${services.storage}`);
  if (/(cdn|static assets)/i.test(text)) mappings.push(`CDN/static assets -> ${services.cdn}`);
  if (/(load balancer|ingress)/i.test(text)) mappings.push(`HTTP/S load balancer or ingress -> ${services.loadBalancer}`);
  if (/(message queue|event bus|asynchronous events|messages)/i.test(text)) mappings.push(`Message queue/event bus -> ${services.queue}`);
  if (/(monitoring|logging|log ingestion|logs)/i.test(text)) mappings.push(`Monitoring/logging -> ${services.monitoring}`);
  if (/\bbackup\b/i.test(text)) mappings.push(`Backup -> ${services.backup}`);
  return mappings;
}

function openItemsFor(text: string): string[] {
  const items: string[] = [];
  if (/(kubernetes|aks|worker nodes?)/i.test(text)) {
    if (!workerNodeCount(text)) items.push('AKS worker node count');
    if (!numberNear(text, /(worker nodes|worker node|nodes)/, /(vcpu|vcpus|cpu|cpus)/)) items.push('AKS vCPU per worker node');
    if (!numberNear(text, /(worker nodes|worker node|nodes)/, /(gb ram|gb memory|gib ram|gib memory)/)) items.push('AKS memory per worker node');
    if (!monthlyHours(text)) items.push('AKS monthly runtime hours');
  }
  if (/(postgres|postgresql|database)/i.test(text)) {
    if (!numberNear(text, /(postgres|postgresql|database)/, /(vcpu|vcpus|cpu|cpus)/)) items.push('PostgreSQL vCPU');
    if (!numberNear(text, /(postgres|postgresql|database)/, /(gb ram|gb memory|gib ram|gib memory)/)) items.push('PostgreSQL memory');
    if (!storageGb(text)) items.push('PostgreSQL storage');
    if (!/\b(high availability|highly available|ha|zone redundant|zone-redundant)\b/i.test(text)) items.push('PostgreSQL high availability');
  }
  if (/(redis|cache)/i.test(text)) {
    if (!numberNear(text, /(redis|cache)/, /(gb memory|gb ram|gb|gib memory|gib ram)/)) items.push('Redis memory');
    if (!/\b(production|premium|standard|basic|dev|development)\b/i.test(text)) items.push('Redis tier');
  }
  return items;
}

function numberBefore(text: string, unitPattern: RegExp): number | null {
  const match = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unitPattern.source}`, 'i'));
  return match ? Number(match[1]) : null;
}

function numberNear(text: string, startPattern: RegExp, unitPattern: RegExp): number | null {
  const start = text.search(startPattern);
  if (start < 0) return null;
  return numberBefore(text.slice(start, start + 220), unitPattern);
}

function numberNearComputeNoun(text: string): number | null {
  const match = text.match(/\b(\d+(?:\.\d+)?)(?:\s+[a-z]+){0,4}\s+(web servers|web server|servers|server|vms|virtual machines)\b/i);
  return match ? Number(match[1]) : null;
}

function workerNodeCount(text: string): number | null {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s+(?:(?:linux|ubuntu)\s+){0,3}worker nodes?\b/i) ?? text.match(/\b(\d+(?:\.\d+)?)\s+nodes?\b/i);
  return match ? Number(match[1]) : null;
}

function monthlyHours(text: string): number | null {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*hours?(?:\s+per\s+month|\s*\/\s*month)?\b/i) ?? text.match(/\bmonthly runtime\s*:\s*(\d+(?:\.\d+)?)\b/i);
  return match ? Number(match[1]) : null;
}

function storageGb(text: string): number | null {
  const match =
    text.match(/(?:storage|data stored|stored data)\s*:?\s*(?:around\s+|approximately\s+)?(\d+(?:\.\d+)?)\s*(tb|gb)\b/i) ??
    text.match(/(\d+(?:\.\d+)?)\s*(tb|gb)\s*(ssd\s*)?(?:storage|disk)/i);
  if (!match) return null;
  const value = Number(match[1]);
  return match[2].toLowerCase() === 'tb' ? value * 1024 : value;
}
