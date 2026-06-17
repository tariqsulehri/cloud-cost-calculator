import type {
  CacheComponent,
  CdnComponent,
  ComputeComponent,
  DatabaseComponent,
  GenericComponent,
  LoadBalancerComponent,
  NormalizedInfrastructureRequirement
} from '../types/estimate.types.js';
import { pricingIntentText } from './RequirementTextUtils.js';

interface NormalizedText {
  rawLower: string;
  compact: string;
  wordsOnly: string;
}

export class RequirementExtractionService {
  extractRequirements(requirementText: string): NormalizedInfrastructureRequirement {
    const normalized = this.normalizeText(requirementText);
    const text = normalized.compact;
    const components = [
      this.extractKubernetes(normalized),
      this.extractCompute(text),
      this.extractDatabase(normalized),
      this.extractCache(normalized),
      this.extractObjectStorage(normalized),
      this.extractCdn(normalized),
      this.extractLoadBalancer(normalized),
      this.extractQueue(normalized),
      this.extractMonitoring(normalized),
      this.extractBackup(normalized),
      this.extractNetwork(normalized)
    ].filter((component): component is GenericComponent | ComputeComponent | DatabaseComponent | CacheComponent | CdnComponent | LoadBalancerComponent =>
      Boolean(component)
    );

    const clarifyingQuestions: string[] = [];
    if (components.some((component) => component.type === 'database' && component.missingFields.includes('highAvailability'))) {
      clarifyingQuestions.push('Should PostgreSQL be highly available?');
    }
    if (components.some((component) => component.type === 'cache' && component.missingFields.includes('tier'))) {
      clarifyingQuestions.push('Should Redis be basic/dev or production-grade?');
    }
    if (components.some((component) => component.type === 'load_balancer' && component.missingFields.includes('scheme'))) {
      clarifyingQuestions.push('Is the load balancer HTTP/S or TCP?');
    }

    const result = {
      region: this.extractRegion(text),
      components,
      globalAssumptions: [
        'Requirement extraction used the rule-based fallback.',
        'Azure pricing is calculated for services with implemented Retail Prices API adapters; incomplete services stay in review instead of using fake values.'
      ],
      clarifyingQuestions,
      extractionMethod: 'rule-based-fallback' as const
    };

    if (process.env.NODE_ENV === 'development') {
      const database = components.find((component) => component.type === 'database') as DatabaseComponent | undefined;
      const cache = components.find((component) => component.type === 'cache') as CacheComponent | undefined;
      const loadBalancer = components.find((component) => component.type === 'load_balancer') as LoadBalancerComponent | undefined;
      console.log('Requirement extraction debug', {
        'database.highAvailability': database?.highAvailability ?? null,
        'cache.tier': cache?.tier ?? null,
        'load_balancer.scheme': loadBalancer?.scheme ?? null,
        clarifyingQuestions
      });
      console.log('Requirement extraction result', JSON.stringify(result, null, 2));
    }

    return result;
  }

  private extractRegion(text: string) {
    const eastUsMatch = text.match(/\b(us east|east us)\b/i);
    return {
      raw: eastUsMatch?.[0] ?? null,
      normalized: 'eastus',
      providerRegion: {
        azure: 'eastus',
        aws: 'us-east-1',
        gcp: 'us-east1'
      },
      confidence: eastUsMatch ? 'high' : 'medium'
    } as const;
  }

  private extractCompute(text: string): ComputeComponent | null {
    if (!this.hasStandaloneComputeIntent(text)) {
      return null;
    }

    const computeSegment = this.segmentFrom(text, /(azure virtual machines|virtual machines?|web servers?|app servers?|application servers?|api servers?|vms)/);
    const quantity = this.numberBefore(text, /(web servers|web server|servers|server|vms|virtual machines)/) ?? this.numberNearComputeNoun(text) ?? this.quantityLabel(computeSegment);
    const vcpu = this.numberBefore(computeSegment, /(vcpu|vcpus|cpu|cpus)/) ?? this.numberBefore(text, /(vcpu|vcpus|cpu|cpus)/);
    const memoryGb = this.numberBefore(computeSegment, /(gb ram|gb memory|gib ram|gib memory)/) ?? this.numberBefore(text, /(gb ram|gb memory|gib ram|gib memory)/);
    const operatingSystem = computeSegment.includes('linux') || text.includes('linux') ? 'linux' : null;
    const imageType = computeSegment.includes('ubuntu') || text.includes('ubuntu') ? 'ubuntu' : null;
    const monthlyHours = this.monthlyHours(computeSegment) ?? this.monthlyHours(text) ?? 730;

    const missingFields = [
      quantity ? undefined : 'quantity',
      vcpu ? undefined : 'vcpu',
      memoryGb ? undefined : 'memoryGb',
      operatingSystem ? undefined : 'operatingSystem',
      imageType ? undefined : 'imageType'
    ].filter((field): field is string => Boolean(field));

    return {
      id: 'compute-1',
      type: 'compute',
      name: 'Virtual machines',
      providerServiceHint: {
        azure: 'Virtual Machines',
        aws: 'EC2',
        gcp: 'Compute Engine'
      },
      pricingStatus: missingFields.length === 0 ? 'supported' : 'missing_required_fields',
      rawText: computeSegment,
      role: computeSegment.includes('web') || text.includes('web') ? 'web servers' : null,
      quantity,
      vcpu,
      memoryGb,
      operatingSystem,
      imageType,
      monthlyHours,
      confidence: missingFields.length === 0 ? 'high' : 'medium',
      missingFields,
      assumptions: ['Compute hours default to 730 hours per month.']
    };
  }

  private extractKubernetes(normalized: NormalizedText): GenericComponent | null {
    const text = normalized.compact;
    if (!/(aks|kubernetes|worker nodes?)/i.test(text)) {
      return null;
    }

    const kubernetesSegment = this.segmentFrom(text, /(aks|kubernetes|worker nodes?)/);
    const nodeCount = this.workerNodeCount(text) ?? this.workerNodeCount(kubernetesSegment);
    const nodeSizingText = this.segmentFrom(text, /(each worker node|each node|worker node)/);
    const vcpuPerNode = this.numberBefore(nodeSizingText, /(vcpu|vcpus|cpu|cpus)/);
    const memoryGbPerNode = this.numberBefore(nodeSizingText, /(gb ram|gb memory|gib ram|gib memory)/);
    const operatingSystem = text.includes('linux') ? 'linux' : null;
    const imageType = text.includes('ubuntu') ? 'ubuntu' : null;
    const monthlyHours = this.monthlyHours(text) ?? 730;
    const missingFields = [
      nodeCount ? undefined : 'nodeCount',
      vcpuPerNode ? undefined : 'vcpuPerNode',
      memoryGbPerNode ? undefined : 'memoryGbPerNode',
      operatingSystem ? undefined : 'operatingSystem',
      imageType ? undefined : 'imageType'
    ].filter((field): field is string => Boolean(field));

    return {
      id: 'kubernetes-1',
      type: 'kubernetes',
      name: 'AKS cluster',
      providerServiceHint: {
        azure: 'Azure Kubernetes Service',
        aws: 'Amazon EKS',
        gcp: 'Google Kubernetes Engine'
      },
      pricingStatus: missingFields.length === 0 ? 'not_implemented' : 'missing_required_fields',
      rawText: kubernetesSegment,
      nodeCount,
      vcpuPerNode,
      memoryGbPerNode,
      operatingSystem,
      imageType,
      monthlyHours,
      confidence: missingFields.length === 0 ? 'high' : 'medium',
      missingFields,
      assumptions: ['AKS worker node compute can be estimated from node count, vCPU, memory, OS, image, and monthly runtime.']
    };
  }

  private extractDatabase(normalized: NormalizedText): DatabaseComponent | null {
    const text = normalized.compact;
    if (!/(postgres|postgresql|database)/i.test(text)) {
      return null;
    }

    const dbSegment = this.segmentFrom(text, /(managed postgresql database|postgresql database|postgres database|database)/);
    const vcpu = this.numberBefore(dbSegment, /(vcpu|vcpus|cpu|cpus)/);
    const memoryGb = this.numberBefore(dbSegment, /(gb ram|gb memory|gib ram|gib memory)/);
    const storageGb = this.storageGb(dbSegment);
    const highAvailability = this.detectHighAvailability(normalized) ? true : null;

    return {
      id: 'database-1',
      type: 'database',
      name: 'PostgreSQL database',
      providerServiceHint: {
        azure: 'Azure Database for PostgreSQL',
        aws: 'Amazon RDS for PostgreSQL',
        gcp: 'Cloud SQL for PostgreSQL'
      },
      pricingStatus: 'not_implemented',
      rawText: dbSegment,
      engine: /postgres|postgresql/.test(text) ? 'postgresql' : null,
      managed: /managed/.test(dbSegment),
      vcpu,
      memoryGb,
      storageGb,
      storageType: /ssd/.test(dbSegment) ? 'ssd' : null,
      highAvailability,
      confidence: vcpu && memoryGb && storageGb ? 'high' : 'medium',
      missingFields: [
        vcpu ? undefined : 'vcpu',
        memoryGb ? undefined : 'memoryGb',
        storageGb ? undefined : 'storageGb',
        highAvailability === null ? 'highAvailability' : undefined
      ].filter((field): field is string => Boolean(field)),
      assumptions: ['PostgreSQL Flexible Server pricing can be estimated when engine, vCPU, storage, and high availability are known.']
    };
  }

  private extractCache(normalized: NormalizedText): CacheComponent | null {
    const text = normalized.compact;
    if (!/(redis|cache)/i.test(text)) {
      return null;
    }

    const cacheSegment = this.segmentFrom(text, /(redis cache|redis|cache)/);
    const memoryGb = this.numberBefore(cacheSegment, /(gb memory|gb ram|gb|gib memory|gib ram)/);
    const tier = this.detectRedisTier(normalized);

    return {
      id: 'cache-1',
      type: 'cache',
      name: 'Redis cache',
      providerServiceHint: {
        azure: 'Azure Cache for Redis',
        aws: 'Amazon ElastiCache for Redis',
        gcp: 'Memorystore for Redis'
      },
      pricingStatus: 'not_implemented',
      rawText: cacheSegment,
      engine: /redis/.test(cacheSegment) ? 'redis' : null,
      memoryGb,
      tier,
      confidence: memoryGb ? 'high' : 'medium',
      missingFields: [memoryGb ? undefined : 'memoryGb', tier ? undefined : 'tier'].filter((field): field is string => Boolean(field)),
      assumptions: ['Redis pricing can be estimated from memory size and tier.']
    };
  }

  private extractObjectStorage(normalized: NormalizedText): GenericComponent | null {
    const text = normalized.compact;
    if (!/(object storage|blob storage|product images|invoices|exported reports)/i.test(text)) {
      return null;
    }

    const storageSegment = this.segmentFrom(text, /(object storage|blob storage|product images|invoices|exported reports)/);
    const dataStoredGb = this.dataSizeNear(text, /(object storage|blob storage|product images|invoices|exported reports)/);
    const accessTier = this.storageAccessTier(text);
    const redundancy = this.storageRedundancy(text);
    const backupRetentionDays = this.retentionDaysNear(text, /(object storage|blob storage|backup)/);

    return {
      id: 'object-storage-1',
      type: 'object_storage',
      name: 'Blob Storage',
      providerServiceHint: {
        azure: 'Azure Blob Storage',
        aws: 'Amazon S3',
        gcp: 'Cloud Storage'
      },
      pricingStatus: 'not_implemented',
      rawText: storageSegment,
      dataStoredGb,
      accessTier,
      backupRetentionDays,
      redundancy,
      confidence: dataStoredGb && accessTier ? 'high' : 'medium',
      missingFields: [dataStoredGb ? undefined : 'dataStoredGb', accessTier ? undefined : 'accessTier', redundancy ? undefined : 'redundancy'].filter(
        (field): field is string => Boolean(field)
      ),
      assumptions: ['Blob Storage capacity pricing can be estimated from data stored, access tier, and redundancy.']
    };
  }

  private extractCdn(normalized: NormalizedText): CdnComponent | null {
    const text = normalized.compact;
    if (!/(cdn|static assets)/i.test(text)) {
      return null;
    }

    const cdnSegment = this.segmentFrom(text, /(cdn|static assets|content delivery)/);
    const transferGb = this.dataTransferGb(cdnSegment) ?? this.dataTransferGb(text);
    const requestCount = this.requestCount(cdnSegment) ?? this.requestCount(text);
    return {
      id: 'cdn-1',
      type: 'cdn',
      name: 'CDN',
      providerServiceHint: {
        azure: 'Azure CDN',
        aws: 'Amazon CloudFront',
        gcp: 'Cloud CDN'
      },
      pricingStatus: 'not_implemented',
      rawText: cdnSegment,
      purpose: text.includes('static assets') ? 'static assets' : null,
      dataTransferGb: transferGb,
      requestCount,
      confidence: transferGb ? 'high' : 'medium',
      missingFields: [transferGb ? undefined : 'dataTransferGb', 'tier'].filter((field): field is string => Boolean(field)),
      assumptions: ['Azure CDN Standard Microsoft pricing can be estimated from monthly transfer and request count.', '1 TB is normalized to 1024 GB.']
    };
  }

  private extractLoadBalancer(normalized: NormalizedText): LoadBalancerComponent | null {
    const text = normalized.compact;
    if (!/load balancer/.test(text)) {
      return null;
    }

    const lbSegment = this.segmentFrom(text, /load balancer/);
    const scheme = this.detectLoadBalancerScheme(normalized);
    return {
      id: 'load-balancer-1',
      type: 'load_balancer',
      name: 'Load balancer',
      providerServiceHint: {
        azure: scheme === 'http_s' ? 'Azure Application Gateway' : 'Azure Load Balancer',
        aws: 'Elastic Load Balancing',
        gcp: 'Cloud Load Balancing'
      },
      pricingStatus: 'not_implemented',
      rawText: lbSegment,
      target: this.loadBalancerTarget(normalized),
      scheme,
      confidence: scheme ? 'high' : 'medium',
      missingFields: scheme ? [] : ['scheme'],
      assumptions: ['HTTP/S load balancer pricing maps to Azure Application Gateway Standard v2 baseline pricing.']
    };
  }

  private extractQueue(normalized: NormalizedText): GenericComponent | null {
    const text = normalized.compact;
    if (!/(service bus|message queue|event bus|asynchronous events|messages)/i.test(text)) {
      return null;
    }

    const queueSegment = this.segmentFrom(text, /(service bus|message queue|event bus|asynchronous events|messages)/);
    const messageVolume = this.messageCount(queueSegment) ?? this.messageCount(text);
    const tier = this.queueTier(queueSegment) ?? this.queueTier(text);
    return {
      id: 'queue-1',
      type: 'queue',
      name: 'Service Bus',
      providerServiceHint: {
        azure: 'Azure Service Bus',
        aws: 'Amazon SQS',
        gcp: 'Pub/Sub'
      },
      pricingStatus: 'not_implemented',
      rawText: queueSegment,
      messageVolume,
      tier,
      confidence: messageVolume ? 'high' : 'medium',
      missingFields: [messageVolume ? undefined : 'messageVolume', tier ? undefined : 'tier'].filter((field): field is string => Boolean(field)),
      assumptions: ['Service Bus pricing can be estimated from tier and monthly message volume.']
    };
  }

  private extractMonitoring(normalized: NormalizedText): GenericComponent | null {
    const text = normalized.compact;
    if (!/(monitoring|logging|log analytics|log ingestion|logs)/i.test(text)) {
      return null;
    }

    const monitoringSegment = this.segmentFrom(text, /(monitoring|logging|log analytics|log ingestion|logs)/);
    const logIngestionGb = this.numberNear(text, /(log ingestion|logs|logging)/, /(gb per month|gb\/month|gb)/);
    const retentionDays = this.retentionDaysNear(text, /(logs|logging|monitoring|log retention)/);
    return {
      id: 'monitoring-1',
      type: 'monitoring',
      name: 'Azure Monitor',
      providerServiceHint: {
        azure: 'Azure Monitor / Log Analytics',
        aws: 'Amazon CloudWatch',
        gcp: 'Cloud Monitoring'
      },
      pricingStatus: 'not_implemented',
      rawText: monitoringSegment,
      logIngestionGb,
      retentionDays,
      confidence: logIngestionGb && retentionDays ? 'high' : 'medium',
      missingFields: [logIngestionGb ? undefined : 'logIngestionGb', retentionDays ? undefined : 'retentionDays'].filter((field): field is string =>
        Boolean(field)
      ),
      assumptions: ['Azure Monitor and Log Analytics pricing can be estimated from log ingestion and retention.']
    };
  }

  private extractBackup(normalized: NormalizedText): GenericComponent | null {
    const text = normalized.compact;
    if (!this.explicitBackupServiceRequested(text)) {
      return null;
    }

    const backupSegment = this.segmentFrom(text, /backup/);
    const retentionDays = this.retentionDaysNear(text, /backup/);
    return {
      id: 'backup-1',
      type: 'backup',
      name: 'Backup',
      providerServiceHint: {
        azure: 'Azure Backup',
        aws: 'AWS Backup',
        gcp: 'Backup and DR Service'
      },
      pricingStatus: 'not_implemented',
      rawText: backupSegment,
      retentionDays,
      confidence: retentionDays ? 'high' : 'medium',
      missingFields: [retentionDays ? undefined : 'retentionDays', 'protectedDataGb'].filter((field): field is string => Boolean(field)),
      assumptions: ['Backup pricing is detected but not implemented in this phase.']
    };
  }

  private extractNetwork(normalized: NormalizedText): GenericComponent | null {
    const text = normalized.compact;
    if (!/(internet egress|egress|excluding cdn)/i.test(text)) {
      return null;
    }

    const networkSegment = this.segmentFrom(text, /(internet egress|egress|excluding cdn)/);
    const monthlyEgressGb = this.dataSizeNear(text, /(internet egress|egress)/);
    return {
      id: 'network-1',
      type: 'network',
      name: 'Internet egress',
      providerServiceHint: {
        azure: 'Azure Bandwidth',
        aws: 'Data Transfer',
        gcp: 'Network Data Transfer'
      },
      pricingStatus: 'not_implemented',
      rawText: networkSegment,
      monthlyEgressGb,
      confidence: monthlyEgressGb ? 'high' : 'medium',
      missingFields: monthlyEgressGb ? [] : ['monthlyEgressGb'],
      assumptions: ['Internet egress pricing can be estimated from monthly outbound data transfer.']
    };
  }

  private numberBefore(text: string, unitPattern: RegExp): number | null {
    const unitSource = unitPattern.source;
    const before = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unitSource}`, 'i'));
    if (before) {
      return Number(before[1]);
    }

    const after = text.match(new RegExp(`${unitSource}\\s*:?\\s*(\\d+(?:\\.\\d+)?)`, 'i'));
    return after ? Number(after[after.length - 1]) : null;
  }

  private numberNearComputeNoun(text: string): number | null {
    const match = text.match(/\b(\d+(?:\.\d+)?)(?:\s+[a-z]+){0,4}\s+(web servers|web server|servers|server|vms|virtual machines)\b/i);
    return match ? Number(match[1]) : null;
  }

  private quantityLabel(text: string): number | null {
    const match = text.match(/\b(?:quantity|qty|count|number of (?:vms|virtual machines|servers))\s*:?\s*(\d+(?:\.\d+)?)/i);
    return match ? Number(match[1]) : null;
  }

  private hasStandaloneComputeIntent(text: string): boolean {
    const vmsIsOnlyAksNodeDescriptor =
      /\b(worker node|worker nodes|aks|kubernetes).{0,80}\bvms\b/i.test(text) && !/\b(virtual machines?|web servers?|app servers?|application servers?|api servers?)\b/i.test(text);

    if (vmsIsOnlyAksNodeDescriptor) {
      return false;
    }

    return (
      /\b(web servers?|app servers?|application servers?|api servers?|virtual machines?|vms)\b/i.test(text) ||
      /\b(\d+(?:\.\d+)?)\s+vm\b/i.test(text) ||
      /\b(each|per)\s+vm\b/i.test(text)
    );
  }

  private numberNear(text: string, startPattern: RegExp, unitPattern: RegExp): number | null {
    const start = text.search(startPattern);
    if (start < 0) {
      return null;
    }
    return this.numberBefore(text.slice(start, start + 220), unitPattern);
  }

  private workerNodeCount(text: string): number | null {
    const match = text.match(/\b(\d+(?:\.\d+)?)\s+(?:(?:linux|ubuntu)\s+){0,3}worker nodes?\b/i) ?? text.match(/\b(\d+(?:\.\d+)?)\s+nodes?\b/i);
    return match ? Number(match[1]) : null;
  }

  private normalizeText(input: string): NormalizedText {
    const rawLower = pricingIntentText(input).toLowerCase();
    const compact = rawLower.replace(/\s+/g, ' ').trim();
    return {
      rawLower,
      compact,
      wordsOnly: rawLower.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
    };
  }

  private containsAny(texts: string[], patterns: RegExp[]): boolean {
    return texts.some((text) => patterns.some((pattern) => pattern.test(text)));
  }

  private detectHighAvailability(normalized: NormalizedText): boolean {
    return this.containsAny([normalized.rawLower, normalized.compact, normalized.wordsOnly], [
      /\bhighly available\b/i,
      /\bhigh availability\b/i,
      /\bhighly available option\b/i,
      /\bha\b/i,
      /\bzone redundant\b/i,
      /\bzone-redundant\b/i,
      /\bzone redundancy\b/i
    ]);
  }

  private detectRedisTier(normalized: NormalizedText): 'production' | 'basic' | null {
    const texts = [normalized.rawLower, normalized.compact, normalized.wordsOnly];

    if (
      this.containsAny(texts, [
        /\bnon production\b/i,
        /\bnon-production\b/i,
        /\bbasic\b/i,
        /\bdev\b/i,
        /\bdevelopment\b/i
      ])
    ) {
      return 'basic';
    }

    if (
      this.containsAny(texts, [
        /\bproduction grade\b/i,
        /\bproduction-grade\b/i,
        /\bproduction\b/i,
        /\bstandard tier\b/i,
        /\bpremium tier\b/i,
        /\breplicated\b/i,
        /\bhigh availability\b/i
      ])
    ) {
      return 'production';
    }

    return null;
  }

  private detectLoadBalancerScheme(normalized: NormalizedText): 'http_s' | 'tcp' | null {
    if (
      this.containsAny([normalized.rawLower, normalized.compact], [
        /\bhttp\/s\b/i,
        /\bhttps\b/i,
        /\bhttp\b/i,
        /\blayer 7\b/i,
        /\bl7\b/i,
        /\bapplication load balancer\b/i
      ]) ||
      this.containsAny([normalized.wordsOnly], [/\bhttp s\b/i])
    ) {
      return 'http_s';
    }

    if (
      this.containsAny([normalized.rawLower, normalized.compact, normalized.wordsOnly], [
        /\btcp\b/i,
        /\blayer 4\b/i,
        /\bl4\b/i,
        /\bnetwork load balancer\b/i
      ])
    ) {
      return 'tcp';
    }

    return null;
  }

  private storageGb(text: string): number | null {
    const match =
      text.match(/(?:storage|data stored|stored data)\s*:?\s*(?:around\s+|approximately\s+)?(\d+(?:\.\d+)?)\s*(tb|gb)\b/i) ??
      text.match(/(\d+(?:\.\d+)?)\s*(tb|gb)\s*(ssd\s*)?(?:storage|disk)/i);
    if (!match) {
      return null;
    }
    const value = Number(match[1]);
    return match[2].toLowerCase() === 'tb' ? value * 1024 : value;
  }

  private dataTransferGb(text: string): number | null {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(tb|gb)\s*(data transfer|transfer)/i) ?? text.match(/(?:data transfer|monthly transfer|transfer)\s*:\s*(\d+(?:\.\d+)?)\s*(tb|gb)/i);
    if (!match) {
      return null;
    }
    const value = Number(match[1]);
    return match[2].toLowerCase() === 'tb' ? value * 1024 : value;
  }

  private dataSizeNear(text: string, startPattern: RegExp): number | null {
    const start = text.search(startPattern);
    const segment = start >= 0 ? text.slice(start, start + 240) : text;
    const match = segment.match(/(\d+(?:\.\d+)?)\s*(tb|gb)\b/i);
    if (!match) {
      return null;
    }
    const value = Number(match[1]);
    return match[2].toLowerCase() === 'tb' ? value * 1024 : value;
  }

  private storageAccessTier(text: string): string | null {
    const match = text.match(/\baccess tier\s*:?\s*(hot|cool|cold|archive)\b/i) ?? text.match(/\b(hot|cool|cold|archive)\s+(?:access\s+)?tier\b/i);
    return match ? match[1].toLowerCase() : null;
  }

  private storageRedundancy(text: string): string | null {
    const match = text.match(/\b(ra-gzrs|ra-grs|ragzrs|ragrs|gzrs|grs|zrs|lrs)\b/i);
    if (!match) {
      return null;
    }
    return match[1].toUpperCase().replace('RAGZRS', 'RA-GZRS').replace('RAGRS', 'RA-GRS');
  }

  private requestCount(text: string): number | null {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(million|m)?\s*requests/i);
    if (!match) {
      return null;
    }
    const value = Number(match[1]);
    return match[2] ? value * 1_000_000 : value;
  }

  private messageCount(text: string): number | null {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(million|m)?\s*messages/i);
    if (!match) {
      return null;
    }
    const value = Number(match[1]);
    return match[2] ? value * 1_000_000 : value;
  }

  private queueTier(text: string): string | null {
    const match =
      text.match(/\bservice bus\s+(basic|standard|premium)\b/i) ??
      text.match(/\b(basic|standard|premium)\s+service bus\b/i) ??
      text.match(/\b(?:sku|tier)\s*:?\s*(basic|standard|premium)\b/i);
    return match ? match[1].toLowerCase() : null;
  }

  private retentionDaysNear(text: string, startPattern: RegExp): number | null {
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

  private monthlyHours(text: string): number | null {
    const match = text.match(/(\d+(?:\.\d+)?)\s*hours?(?:\s+per\s+month|\s*\/\s*month)?/i) ?? text.match(/monthly runtime\s*:\s*(\d+(?:\.\d+)?)/i);
    return match ? Number(match[1]) : null;
  }

  private loadBalancerTarget(normalized: NormalizedText): string | null {
    if (/\bapi gateway\b/i.test(normalized.compact)) {
      return 'API Gateway service';
    }
    if (/\bacross both servers\b/i.test(normalized.compact) || /\bboth servers\b/i.test(normalized.compact)) {
      return 'both servers';
    }
    if (/\bboth web servers\b/i.test(normalized.compact)) {
      return 'both web servers';
    }
    return null;
  }

  private explicitBackupServiceRequested(text: string): boolean {
    return /\bazure backup\b|\bbackup service\b|\bmanaged backup service\b/i.test(text);
  }

  private segmentFrom(text: string, startPattern: RegExp): string {
    const match = text.match(startPattern);
    if (!match || match.index === undefined) {
      return text;
    }
    return text.slice(match.index, match.index + 160);
  }
}
