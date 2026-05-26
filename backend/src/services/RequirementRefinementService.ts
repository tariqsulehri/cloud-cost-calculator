import OpenAI from 'openai';

interface OpenAIResponsesClient {
  responses: {
    create(input: unknown): Promise<{ output_text?: string }>;
  };
}

const refinePrompt = `Act as a senior Azure cloud architect and FinOps reviewer.
Refine the user's cloud infrastructure requirement into a clear structured Azure cost-estimation prompt.
Do not calculate prices.
Do not add services, quantities, tiers, regions, discounts, or assumptions that the user did not provide.
Preserve every service and specification the user mentioned, including compute, Kubernetes, databases, cache, storage, CDN, load balancing, networking, messaging, monitoring, logging, backup, security, data transfer, request counts, runtime hours, retention, availability, redundancy, operating system, pricing model, and discounts.
Translate written/generic services into the proper Azure service dictionary, for example Kubernetes -> Azure Kubernetes Service (AKS), virtual machines -> Azure Virtual Machines, managed PostgreSQL -> Azure Database for PostgreSQL Flexible Server, Redis -> Azure Cache for Redis, object storage -> Azure Blob Storage, HTTP/S load balancer or ingress -> Azure Application Gateway, message queue/event bus -> Azure Service Bus, monitoring/logging -> Azure Monitor / Log Analytics.
Normalize common units only when unambiguous, for example 1 TB = 1024 GB if writing storage in GB, or keep TB when that is clearer.
Group requirements under concise headings by service area.
If a value is missing, keep the service and write "not specified" for that field instead of inventing a value.
Add an "Open items to complete before estimate" section when important pricing fields are missing, using short editable bullets.
If the user pasted sections named "Prompt:" and "Result:", refine only the actual prompt and ignore the pasted result.
Return only the refined prompt text.`;

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

  async refineRequirements(requirementText: string): Promise<string> {
    const intentText = this.promptIntentText(requirementText);
    if (!this.client) {
      return refineAzurePromptLocally(intentText);
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        input: [
          { role: 'system', content: refinePrompt },
          { role: 'user', content: intentText }
        ]
      });

      return response.output_text?.trim() || refineAzurePromptLocally(intentText);
    } catch {
      return refineAzurePromptLocally(intentText);
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

function refineAzurePromptLocally(input: string): string {
  const text = input.toLowerCase().replace(/\s+/g, ' ').trim();
  const sections: string[] = [];
  const mappings = azureMappings(text);
  const openItems = openItemsFor(text);
  const region = /\b(east us|us east|eastus)\b/i.test(input) ? 'Azure East US' : 'Azure region not specified';

  if (mappings.length > 0) {
    sections.push(`Azure Service Dictionary:\n${mappings.map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(kubernetes|aks|worker nodes?)/i.test(text)) {
    const nodeCount = workerNodeCount(text);
    const vcpu = numberNear(text, /(worker nodes|worker node|nodes)/, /(vcpu|vcpus|cpu|cpus)/);
    const memoryGb = numberNear(text, /(worker nodes|worker node|nodes)/, /(gb ram|gb memory|gib ram|gib memory)/);
    const hours = monthlyHours(text);
    sections.push(
      `Kubernetes:\n${[
        'Azure service: Azure Kubernetes Service (AKS)',
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
        'Azure service: Azure Virtual Machines',
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
    sections.push(`Database:\n${['Azure service: Azure Database for PostgreSQL Flexible Server', /managed/.test(text) ? 'Deployment: managed' : 'Deployment: not specified']
      .map((line) => `- ${line}`)
      .join('\n')}`);
  }

  if (/(redis|cache)/i.test(text)) {
    sections.push(`Cache:\n${['Azure service: Azure Cache for Redis', /redis/.test(text) ? 'Engine: Redis' : 'Engine: not specified'].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(object storage|product images|invoices|exported reports)/i.test(text)) {
    sections.push(`Object Storage:\n${['Azure service: Azure Blob Storage'].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(cdn|static assets)/i.test(text)) {
    sections.push(`CDN:\n${['Azure service: Azure CDN / Azure Front Door'].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(load balancer|ingress)/i.test(text)) {
    const azureService = /\b(http\/s|https|http|layer 7|l7|ingress)\b/i.test(text) ? 'Azure Application Gateway' : 'Azure Load Balancer';
    sections.push(`Load Balancer / Ingress:\n${[`Azure service: ${azureService}`].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(message queue|event bus|asynchronous events|messages)/i.test(text)) {
    sections.push(`Messaging:\n${['Azure service: Azure Service Bus'].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/(monitoring|logging|log ingestion|logs)/i.test(text)) {
    sections.push(`Monitoring and Logging:\n${['Azure service: Azure Monitor / Log Analytics'].map((line) => `- ${line}`).join('\n')}`);
  }

  if (/\bbackup\b/i.test(text)) {
    sections.push(`Backup:\n${['Azure service: Azure Backup'].map((line) => `- ${line}`).join('\n')}`);
  }

  if (openItems.length > 0) {
    sections.push(`Open items to complete before estimate:\n${openItems.map((item) => `- ${item}: not specified`).join('\n')}`);
  }

  return sections.length > 0 ? [`I need infrastructure in ${region}.`, ...sections].join('\n\n') : input.trim();
}

function azureMappings(text: string): string[] {
  const mappings: string[] = [];
  if (/(kubernetes|aks|worker nodes?)/i.test(text)) mappings.push('Kubernetes -> Azure Kubernetes Service (AKS)');
  if (/(web server|server|vm|virtual machine)/i.test(text)) mappings.push('VMs / servers -> Azure Virtual Machines');
  if (/(postgres|postgresql|database)/i.test(text)) mappings.push('Managed PostgreSQL -> Azure Database for PostgreSQL Flexible Server');
  if (/(redis|cache)/i.test(text)) mappings.push('Redis cache -> Azure Cache for Redis');
  if (/(object storage|product images|invoices|exported reports)/i.test(text)) mappings.push('Object storage -> Azure Blob Storage');
  if (/(cdn|static assets)/i.test(text)) mappings.push('CDN/static assets -> Azure CDN / Azure Front Door');
  if (/(load balancer|ingress)/i.test(text)) mappings.push('HTTP/S load balancer or ingress -> Azure Application Gateway');
  if (/(message queue|event bus|asynchronous events|messages)/i.test(text)) mappings.push('Message queue/event bus -> Azure Service Bus');
  if (/(monitoring|logging|log ingestion|logs)/i.test(text)) mappings.push('Monitoring/logging -> Azure Monitor / Log Analytics');
  if (/\bbackup\b/i.test(text)) mappings.push('Backup -> Azure Backup');
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
