import { CheckCircle2, FileText, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface RequirementTextInputProps {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onExtract: () => void;
  onRefine: (value: string) => Promise<string>;
}

export function RequirementTextInput({ value, loading, onChange, onExtract, onRefine }: RequirementTextInputProps) {
  const [showRefinedPrompt, setShowRefinedPrompt] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [refining, setRefining] = useState(false);

  async function handleReviewRefine() {
    setRefining(true);
    try {
      setRefinedPrompt(await onRefine(value));
    } catch {
      setRefinedPrompt(refinePrompt(value));
    } finally {
      setShowRefinedPrompt(true);
      setRefining(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-card">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-azure/20 bg-white px-2.5 py-1 text-xs font-semibold text-azure shadow-sm">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          Step 1
        </div>
        <h2 className="mt-3 text-lg font-semibold text-navy">Describe cloud needs</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Paste the requirement. You can improve the text first, or directly find services.</p>
      </div>
      <div className="p-5">
      <label className="block">
        <span className="text-sm font-semibold text-graphite">Requirement text</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={12}
          className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-azure focus:ring-4 focus:ring-blue-100"
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleReviewRefine}
          disabled={refining || value.trim().length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-graphite transition hover:border-azure/40 hover:bg-blue-50 hover:text-azure disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {refining ? 'Improving...' : 'Improve text'}
        </button>
        <button
          type="button"
          onClick={onExtract}
          disabled={loading || value.trim().length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-azure px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-azureDark disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {loading ? 'Finding...' : 'Find services'}
        </button>
      </div>
      {showRefinedPrompt ? (
        <div className="mt-5 rounded-lg border border-violet/20 bg-violet/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-navy">Improved text is ready</h3>
            <p className="mt-1 text-sm leading-6 text-muted">Review it quickly. If it looks right, use it and then click Find services.</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(refinedPrompt)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-violet px-3 text-xs font-semibold text-white transition hover:bg-plum"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Use improved text
          </button>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-graphite">Improved text</span>
          <textarea
            value={refinedPrompt}
            onChange={(event) => setRefinedPrompt(event.target.value)}
            rows={10}
            className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 font-mono text-sm leading-6 text-ink outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/15"
          />
        </label>
      </div>
      ) : null}
      </div>
    </section>
  );
}

function refinePrompt(input: string): string {
  const intentText = promptIntentText(input);
  const normalized = intentText.toLowerCase().replace(/\s+/g, ' ').trim();
  const sections: string[] = [];
  const region = /\b(east us|us east)\b/i.test(intentText) ? 'Azure East US' : 'Azure region not specified';
  const dictionary = azureDictionaryLines(normalized);

  if (dictionary.length > 0) {
    sections.push(`Azure Service Dictionary:\n${dictionary.map((line) => `- ${line}`).join('\n')}`);
  }

  const kubernetes = kubernetesLines(normalized, intentText);
  if (kubernetes.length > 0) {
    sections.push(`Kubernetes:\n${kubernetes.map((line) => `- ${line}`).join('\n')}`);
  }

  const compute = computeLines(normalized);
  if (compute.length > 0) {
    sections.push(`Compute:\n${compute.map((line) => `- ${line}`).join('\n')}`);
  }

  const database = databaseLines(normalized);
  if (database.length > 0) {
    sections.push(`Database:\n${database.map((line) => `- ${line}`).join('\n')}`);
  }

  const cache = cacheLines(normalized);
  if (cache.length > 0) {
    sections.push(`Cache:\n${cache.map((line) => `- ${line}`).join('\n')}`);
  }

  const cdn = cdnLines(normalized);
  if (cdn.length > 0) {
    sections.push(`CDN:\n${cdn.map((line) => `- ${line}`).join('\n')}`);
  }

  const loadBalancer = loadBalancerLines(normalized);
  if (loadBalancer.length > 0) {
    sections.push(`Load Balancer:\n${loadBalancer.map((line) => `- ${line}`).join('\n')}`);
  }

  const objectStorage = objectStorageLines(normalized);
  if (objectStorage.length > 0) {
    sections.push(`Object Storage:\n${objectStorage.map((line) => `- ${line}`).join('\n')}`);
  }

  const queue = queueLines(normalized);
  if (queue.length > 0) {
    sections.push(`Messaging:\n${queue.map((line) => `- ${line}`).join('\n')}`);
  }

  const monitoring = monitoringLines(normalized);
  if (monitoring.length > 0) {
    sections.push(`Monitoring and Logging:\n${monitoring.map((line) => `- ${line}`).join('\n')}`);
  }

  const backup = backupLines(normalized);
  if (backup.length > 0) {
    sections.push(`Backup:\n${backup.map((line) => `- ${line}`).join('\n')}`);
  }

  const network = networkLines(normalized);
  if (network.length > 0) {
    sections.push(`Network Egress:\n${network.map((line) => `- ${line}`).join('\n')}`);
  }

  const pricing = pricingLines(normalized);
  if (pricing.length > 0) {
    sections.push(`Pricing Model:\n${pricing.map((line) => `- ${line}`).join('\n')}`);
  }

  const openItems = openItemsFor(normalized);
  if (openItems.length > 0) {
    sections.push(`Open items to complete before estimate:\n${openItems.map((line) => `- ${line}: not specified`).join('\n')}`);
  }

  if (sections.length === 0) {
    return intentText.trim();
  }

  return [`I need infrastructure in ${region}.`, ...sections].join('\n\n');
}

function promptIntentText(input: string): string {
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

function kubernetesLines(text: string, rawText: string): string[] {
  if (!/(kubernetes|aks|worker nodes?)/i.test(text)) {
    return [];
  }

  const lines = ['AKS cluster (Azure Kubernetes Service)'];
  const serviceCount = numberBefore(text, /(microservices|services)/);
  const services = microserviceNames(rawText);
  const nodeCount = workerNodeCount(text);
  const vcpu = numberNear(text, /(worker nodes|worker node|nodes)/, /(vcpu|vcpus|cpu|cpus)/);
  const memoryGb = numberNear(text, /(worker nodes|worker node|nodes)/, /(gb ram|gb memory|gib ram|gib memory)/);
  const hours = monthlyHours(text);

  if (serviceCount) lines.push(`${serviceCount} microservices`);
  if (services.length > 0) lines.push(`Services: ${services.join(', ')}`);
  if (nodeCount) lines.push(`${nodeCount} Linux worker nodes`);
  if (vcpu || memoryGb) lines.push(`Each worker node: ${[vcpu ? `${vcpu} vCPU` : null, memoryGb ? `${memoryGb} GB RAM` : null].filter(Boolean).join(', ')}`);
  if (text.includes('ubuntu')) lines.push('Node image: Ubuntu Linux');
  if (hours) lines.push(`Monthly runtime: ${hours} hours`);
  return lines;
}

function computeLines(text: string): string[] {
  if (!/(web server|server|vm|virtual machine)/i.test(text)) {
    return [];
  }

  const quantity = numberBefore(text, /(web servers|web server|servers|server|vms|virtual machines)/) ?? numberNearComputeNoun(text);
  const vcpu = numberBefore(text, /(vcpu|vcpus|cpu|cpus)/);
  const memoryGb = numberBefore(text, /(gb ram|gb memory|gib ram|gib memory)/);
  const hours = monthlyHours(text);
  const lines = [quantity ? `${quantity} ${quantity === 1 ? 'virtual machine' : 'virtual machines'}` : 'Virtual machines'];

  if (vcpu || memoryGb) {
    lines.push(`Each VM: ${[vcpu ? `${vcpu} vCPU` : null, memoryGb ? `${memoryGb} GB RAM` : null].filter(Boolean).join(', ')}`);
  }
  if (text.includes('linux')) {
    lines.push('OS: Linux');
  }
  if (text.includes('ubuntu')) {
    lines.push('Image: Ubuntu');
  }
  if (hours) {
    lines.push(`Monthly runtime: ${hours} hours`);
  }

  return lines;
}

function databaseLines(text: string): string[] {
  if (!/(postgres|postgresql|database)/i.test(text)) {
    return [];
  }

  const lines = [/(managed)/i.test(text) ? 'Managed PostgreSQL' : 'PostgreSQL'];
  const vcpu = numberNear(text, /(postgres|postgresql|database)/, /(vcpu|vcpus|cpu|cpus)/) ?? numberBefore(text, /(vcpu|vcpus|cpu|cpus)/);
  const memoryGb = numberNear(text, /(postgres|postgresql|database)/, /(gb ram|gb memory|gib ram|gib memory)/) ?? numberBefore(text, /(gb ram|gb memory|gib ram|gib memory)/);
  const storage = storageGb(text);
  const backupDays = retentionDaysNear(text, /(postgres|postgresql|database)/);
  if (vcpu) lines.push(`${vcpu} vCPU`);
  if (memoryGb) lines.push(`${memoryGb} GB RAM`);
  if (storage) lines.push(`${storage} GB SSD storage`);
  if (/\b(high availability|highly available|ha|zone redundant|zone-redundant)\b/i.test(text)) lines.push('High availability: yes');
  if (/\b(production grade|production-grade|production database)\b/i.test(text)) lines.push('Tier: production');
  if (/\b(zone redundant|zone-redundant)\b/i.test(text)) lines.push('Redundancy: zone redundant');
  if (backupDays) lines.push(`Backup retention: ${backupDays} days`);
  return lines;
}

function cacheLines(text: string): string[] {
  if (!/(redis|cache)/i.test(text)) {
    return [];
  }

  const lines = ['Redis'];
  const memoryGb = numberNear(text, /(redis|cache)/, /(gb memory|gb ram|gb|gib memory|gib ram)/);
  if (memoryGb) lines.push(`Memory: ${memoryGb} GB`);
  if (/\b(production|premium|standard)\b/i.test(text)) lines.push('Tier: production');
  if (/\b(basic|dev|development)\b/i.test(text)) lines.push('Tier: basic');
  if (/\b(high availability|highly available|ha)\b/i.test(text)) lines.push('High availability: yes');
  if (/sessions|catalog data/i.test(text)) lines.push('Usage: sessions and frequently accessed catalog data');
  return lines;
}

function cdnLines(text: string): string[] {
  if (!/(cdn|static assets)/i.test(text)) {
    return [];
  }

  const lines = ['Static assets'];
  const transferGb = dataTransferGb(text);
  const requests = requestCount(text);
  if (transferGb) lines.push(`Monthly transfer: ${transferGb >= 1024 ? `${transferGb / 1024} TB` : `${transferGb} GB`}`);
  if (requests) lines.push(`Monthly requests: ${formatCount(requests)}`);
  return lines;
}

function loadBalancerLines(text: string): string[] {
  if (!/(load balancer|ingress)/i.test(text)) {
    return [];
  }

  const lines: string[] = [];
  if (/\b(http\/s|https|http|layer 7|l7|ingress)\b/i.test(text)) lines.push('Azure service: Azure Application Gateway');
  if (/\b(tcp|udp|layer 4|l4)\b/i.test(text)) lines.push('Azure service: Azure Load Balancer');
  if (/\b(http\/s|https|http|layer 7|l7)\b/i.test(text)) lines.push('Type: HTTP/S');
  if (/\b(tcp|udp|layer 4|l4)\b/i.test(text)) lines.push('Type: TCP');
  if (/api gateway/i.test(text)) lines.push('Target: API Gateway service');
  if (/public/i.test(text)) lines.push('Public facing: yes');
  if (/tls|ssl/i.test(text)) lines.push('TLS/SSL termination: yes');
  if (/other microservices should be internal only|internal only/i.test(text)) lines.push('Other microservices: internal only');
  if (/both servers|both web servers/i.test(text)) lines.push('Targets: both web servers');
  return lines.length > 0 ? lines : ['Load balancer'];
}

function objectStorageLines(text: string): string[] {
  if (!/(object storage|product images|invoices|exported reports)/i.test(text)) {
    return [];
  }

  const lines = ['Stores product images, invoices, and exported reports'];
  const storage = dataSizeNear(text, /(object storage|product images|invoices|exported reports)/);
  if (storage) lines.push(`Stored data: ${storage >= 1024 ? `${storage / 1024} TB` : `${storage} GB`}`);
  if (/hot access tier|hot tier/i.test(text)) lines.push('Access tier: hot');
  return lines;
}

function queueLines(text: string): string[] {
  if (!/(message queue|event bus|asynchronous events|messages)/i.test(text)) {
    return [];
  }

  const lines = ['Managed message queue or event bus'];
  const messages = messageCount(text);
  if (messages) lines.push(`Monthly messages: ${formatCount(messages)}`);
  return lines;
}

function monitoringLines(text: string): string[] {
  if (!/(monitoring|logging|log ingestion|logs)/i.test(text)) {
    return [];
  }

  const lines = ['Monitoring and logging for all microservices'];
  const logIngestionGb = numberNear(text, /(log ingestion|logs|logging)/, /(gb per month|gb\/month|gb)/);
  const retention = retentionDaysNear(text, /(logs|logging|monitoring)/);
  if (logIngestionGb) lines.push(`Log ingestion: ${logIngestionGb} GB per month`);
  if (retention) lines.push(`Log retention: ${retention} days`);
  return lines;
}

function backupLines(text: string): string[] {
  if (!/\bbackup\b/i.test(text)) {
    return [];
  }

  const lines = ['Backup for PostgreSQL and object storage'];
  const retention = backupRetentionDays(text) ?? retentionDaysNear(text, /backup/);
  if (retention) lines.push(`Backup retention: ${retention} days`);
  return lines;
}

function networkLines(text: string): string[] {
  if (!/(internet egress|egress|excluding cdn)/i.test(text)) {
    return [];
  }

  const egressGb = dataSizeNear(text, /(internet egress|egress)/);
  return egressGb ? [`Internet egress excluding CDN: ${egressGb >= 1024 ? `${egressGb / 1024} TB` : `${egressGb} GB`} per month`] : ['Internet egress excluding CDN'];
}

function pricingLines(text: string): string[] {
  const lines: string[] = [];
  if (/pay-as-you-go|pay as you go/i.test(text)) lines.push('Pay-as-you-go pricing');
  if (/no reserved instances|reserved instances/i.test(text)) lines.push('No reserved instances');
  if (/no .*savings plans|savings plans/i.test(text)) lines.push('No savings plans');
  if (/no .*enterprise discounts|enterprise discounts/i.test(text)) lines.push('No enterprise discounts');
  return lines;
}

function azureDictionaryLines(text: string): string[] {
  const lines: string[] = [];
  if (/(kubernetes|aks|worker nodes?)/i.test(text)) lines.push('Kubernetes -> Azure Kubernetes Service (AKS)');
  if (/(web server|server|vm|virtual machine)/i.test(text)) lines.push('VMs / servers -> Azure Virtual Machines');
  if (/(postgres|postgresql|database)/i.test(text)) lines.push('Managed PostgreSQL -> Azure Database for PostgreSQL Flexible Server');
  if (/(redis|cache)/i.test(text)) lines.push('Redis cache -> Azure Cache for Redis');
  if (/(object storage|product images|invoices|exported reports)/i.test(text)) lines.push('Object storage -> Azure Blob Storage');
  if (/(cdn|static assets)/i.test(text)) lines.push('CDN/static assets -> Azure CDN / Azure Front Door');
  if (/(load balancer|ingress)/i.test(text)) lines.push('HTTP/S load balancer or ingress -> Azure Application Gateway');
  if (/(message queue|event bus|asynchronous events|messages)/i.test(text)) lines.push('Message queue/event bus -> Azure Service Bus');
  if (/(monitoring|logging|log ingestion|logs)/i.test(text)) lines.push('Monitoring/logging -> Azure Monitor / Log Analytics');
  if (/\bbackup\b/i.test(text)) lines.push('Backup -> Azure Backup');
  return lines;
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

function numberNearComputeNoun(text: string): number | null {
  const match = text.match(/\b(\d+(?:\.\d+)?)(?:\s+[a-z]+){0,4}\s+(web servers|web server|servers|server|vms|virtual machines)\b/i);
  return match ? Number(match[1]) : null;
}

function workerNodeCount(text: string): number | null {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s+(?:(?:linux|ubuntu)\s+){0,3}worker nodes?\b/i) ?? text.match(/\b(\d+(?:\.\d+)?)\s+nodes?\b/i);
  return match ? Number(match[1]) : null;
}

function numberNear(text: string, startPattern: RegExp, unitPattern: RegExp): number | null {
  const start = text.search(startPattern);
  if (start < 0) {
    return null;
  }
  return numberBefore(text.slice(start, start + 180), unitPattern);
}

function microserviceNames(input: string): string[] {
  const matches = [...input.matchAll(/^\s*\d+\.\s+(.+?)(?:\s+service)?\s*$/gim)];
  return matches.map((match) => match[1].trim()).filter(Boolean);
}

function monthlyHours(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*hours?(?:\s+per\s+month|\s*\/\s*month)?/i) ?? text.match(/monthly runtime\s*:\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function storageGb(text: string): number | null {
  const match =
    text.match(/(?:storage|data stored|stored data)\s*:?\s*(?:around\s+|approximately\s+)?(\d+(?:\.\d+)?)\s*(tb|gb)\b/i) ??
    text.match(/(\d+(?:\.\d+)?)\s*(tb|gb)\s*(ssd\s*)?(?:storage|disk)/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return match[2].toLowerCase() === 'tb' ? value * 1024 : value;
}

function dataTransferGb(text: string): number | null {
  const match =
    text.match(/(\d+(?:\.\d+)?)\s*(tb|gb)\s*(data transfer|transfer)/i) ??
    text.match(/(?:data transfer|monthly transfer|transfer)(?:\s+is|\s+of|\s*:)?\s*(?:around\s+|expected\s+)?(\d+(?:\.\d+)?)\s*(tb|gb)/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return match[2].toLowerCase() === 'tb' ? value * 1024 : value;
}

function dataSizeNear(text: string, startPattern: RegExp): number | null {
  const start = text.search(startPattern);
  const segment = start >= 0 ? text.slice(start, start + 220) : text;
  const match = segment.match(/(\d+(?:\.\d+)?)\s*(tb|gb)\b/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return match[2].toLowerCase() === 'tb' ? value * 1024 : value;
}

function requestCount(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(million|m)?\s*requests/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return match[2] ? value * 1_000_000 : value;
}

function messageCount(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(million|m)?\s*messages/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return match[2] ? value * 1_000_000 : value;
}

function retentionDaysNear(text: string, startPattern: RegExp): number | null {
  const start = text.search(startPattern);
  const segment = start >= 0 ? text.slice(start, start + 420) : text;
  const matches = [
    ...segment.matchAll(/(\d+(?:\.\d+)?)\s*days?(?:\s+backup|\s+retention)?|retention(?:\s+should\s+be|\s+is|\s*:)?\s*(\d+(?:\.\d+)?)\s*days?/gi)
  ];
  const match = matches[matches.length - 1];
  if (!match) {
    return null;
  }
  return Number(match[1] ?? match[2]);
}

function backupRetentionDays(text: string): number | null {
  const matches = [...text.matchAll(/backup retention(?:\s+should\s+be|\s+is|\s*:)?\s*(\d+(?:\.\d+)?)\s*days?/gi)];
  const match = matches[matches.length - 1];
  return match ? Number(match[1]) : null;
}

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${value / 1_000_000} million`;
  }
  return String(value);
}
