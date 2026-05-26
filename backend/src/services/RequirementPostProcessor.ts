import type {
  CacheComponent,
  DatabaseComponent,
  GenericComponent,
  LoadBalancerComponent,
  NormalizedComponent,
  NormalizedInfrastructureRequirement
} from '../types/estimate.types.js';

const postgresHaQuestion = 'Should PostgreSQL be highly available?';
const redisTierQuestion = 'Should Redis be basic/dev or production-grade?';
const loadBalancerSchemeQuestion = 'Is the load balancer HTTP/S or TCP?';

interface NormalizedText {
  rawLower: string;
  compact: string;
  wordsOnly: string;
}

export class RequirementPostProcessor {
  process(requirementText: string, requirement: NormalizedInfrastructureRequirement): NormalizedInfrastructureRequirement {
    const normalized = this.normalizeText(requirementText);
    const components = this.ensureDetectedComponents(this.removeImplicitBackupComponents(requirement.components, normalized), normalized).map((component) =>
      this.processComponent(component, normalized)
    );

    return {
      ...requirement,
      components,
      globalAssumptions: this.filterGlobalAssumptions(requirement.globalAssumptions, components),
      clarifyingQuestions: this.filterClarifyingQuestions(requirement.clarifyingQuestions, components)
    };
  }

  private processComponent(component: NormalizedComponent, normalized: NormalizedText): NormalizedComponent {
    if (component.type === 'database') {
      const highAvailability = this.detectHighAvailability(normalized) ? true : null;
      const storageGb = (component as DatabaseComponent).storageGb ?? this.detectDatabaseStorageGb(normalized);
      const storageType = (component as DatabaseComponent).storageType ?? (storageGb && /\bssd\b/i.test(normalized.compact) ? 'ssd' : null);
      const missingFields = component.missingFields
        .filter((field) => !(highAvailability === true && field === 'highAvailability'))
        .filter((field) => !(storageGb && field === 'storageGb'));
      return {
        ...component,
        highAvailability,
        storageGb,
        storageType,
        assumptions: highAvailability === true ? component.assumptions : this.removeAssumptions(component.assumptions, [/highly available/i, /\bhigh availability\b/i, /\bha\b/i]),
        missingFields
      } as DatabaseComponent;
    }

    if (component.type === 'cache') {
      const redisTier = this.detectRedisTier(normalized);
      return {
        ...component,
        tier: redisTier,
        assumptions: redisTier ? component.assumptions : this.removeAssumptions(component.assumptions, [/production grade/i, /\bproduction\b/i, /\bstandard tier\b/i, /\bpremium tier\b/i]),
        missingFields: redisTier ? this.removeMissingField(component.missingFields, 'tier') : component.missingFields
      } as CacheComponent;
    }

    if (component.type === 'load_balancer') {
      const scheme = this.detectLoadBalancerScheme(normalized);
      const azureService = scheme === 'http_s' ? 'Azure Application Gateway' : scheme === 'tcp' ? 'Azure Load Balancer' : null;
      const target = (component as LoadBalancerComponent).target ?? this.detectLoadBalancerTarget(normalized);
      return {
        ...component,
        scheme,
        target,
        azureService,
        providerServiceHint: {
          ...component.providerServiceHint,
          azure: azureService ?? component.providerServiceHint.azure
        },
        assumptions: scheme ? component.assumptions : this.removeAssumptions(component.assumptions, [/http\/s/i, /\bhttps?\b/i, /\blayer 7\b/i, /\bl7\b/i, /\bscheme\b/i]),
        missingFields: component.missingFields
          .filter((field) => !(scheme && field === 'scheme'))
          .filter((field) => !(target && field === 'target'))
      } as LoadBalancerComponent;
    }

    if (component.type === 'kubernetes') {
      const kubernetesComponent = component as GenericComponent;
      const nodeCount = kubernetesComponent.nodeCount ?? this.detectWorkerNodeCount(normalized);
      const vcpuPerNode = kubernetesComponent.vcpuPerNode ?? this.detectWorkerNodeVcpu(normalized);
      const memoryGbPerNode = kubernetesComponent.memoryGbPerNode ?? this.detectWorkerNodeMemoryGb(normalized);
      const operatingSystem = kubernetesComponent.operatingSystem ?? (/\blinux\b/i.test(normalized.compact) ? 'linux' : null);
      const imageType = kubernetesComponent.imageType ?? (/\bubuntu\b/i.test(normalized.compact) ? 'ubuntu' : null);
      const monthlyHours = kubernetesComponent.monthlyHours ?? this.detectMonthlyHours(normalized);

      return {
        ...component,
        nodeCount,
        vcpuPerNode,
        memoryGbPerNode,
        operatingSystem,
        imageType,
        monthlyHours,
        missingFields: component.missingFields
          .filter((field) => !(nodeCount && field === 'nodeCount'))
          .filter((field) => !(vcpuPerNode && field === 'vcpuPerNode'))
          .filter((field) => !(memoryGbPerNode && field === 'memoryGbPerNode'))
          .filter((field) => !(operatingSystem && field === 'operatingSystem'))
          .filter((field) => !(imageType && field === 'imageType'))
          .filter((field) => !(monthlyHours && field === 'monthlyHours'))
      } as GenericComponent;
    }

    if (component.type === 'object_storage') {
      const storageComponent = component as GenericComponent;
      const dataStoredGb = storageComponent.dataStoredGb ?? this.detectDataSizeNear(normalized, /(object storage|blob storage|product images|invoices|exported reports)/);
      const accessTier = storageComponent.accessTier ?? this.detectStorageAccessTier(normalized);
      const redundancy = storageComponent.redundancy ?? this.detectStorageRedundancy(normalized);

      return {
        ...component,
        dataStoredGb,
        accessTier,
        redundancy,
        missingFields: component.missingFields
          .filter((field) => !(dataStoredGb && field === 'dataStoredGb'))
          .filter((field) => !(accessTier && field === 'accessTier'))
          .filter((field) => !(redundancy && field === 'redundancy'))
      } as GenericComponent;
    }

    if (component.type === 'queue') {
      const queueComponent = component as GenericComponent;
      const tier = queueComponent.tier ?? this.detectQueueTier(normalized);
      const messageVolume = queueComponent.messageVolume ?? this.detectMessageCount(normalized);

      return {
        ...component,
        tier,
        messageVolume,
        missingFields: component.missingFields
          .filter((field) => !(tier && field === 'tier'))
          .filter((field) => !(messageVolume && field === 'messageVolume'))
      } as GenericComponent;
    }

    return component;
  }

  private ensureDetectedComponents(components: NormalizedComponent[], normalized: NormalizedText): NormalizedComponent[] {
    const next = [...components];
    const hasType = (type: NormalizedComponent['type']) => next.some((component) => component.type === type);

    if (!hasType('kubernetes') && /\b(azure kubernetes service|aks|kubernetes|worker nodes?)\b/i.test(normalized.compact)) {
      const nodeCount = this.detectWorkerNodeCount(normalized);
      const vcpuPerNode = this.detectWorkerNodeVcpu(normalized);
      const memoryGbPerNode = this.detectWorkerNodeMemoryGb(normalized);
      const operatingSystem = /\blinux\b/i.test(normalized.compact) ? 'linux' : null;
      const imageType = /\bubuntu\b/i.test(normalized.compact) ? 'ubuntu' : null;
      const monthlyHours = this.detectMonthlyHours(normalized) ?? 730;

      next.push({
        id: 'kubernetes-1',
        type: 'kubernetes',
        name: 'AKS cluster',
        providerServiceHint: { azure: 'Azure Kubernetes Service (AKS)', aws: 'Amazon EKS', gcp: 'Google Kubernetes Engine' },
        pricingStatus: 'not_implemented',
        confidence: nodeCount && vcpuPerNode && memoryGbPerNode ? 'high' : 'medium',
        missingFields: [
          nodeCount ? undefined : 'nodeCount',
          vcpuPerNode ? undefined : 'vcpuPerNode',
          memoryGbPerNode ? undefined : 'memoryGbPerNode',
          operatingSystem ? undefined : 'operatingSystem',
          imageType ? undefined : 'imageType'
        ].filter((field): field is string => Boolean(field)),
        assumptions: ['AKS worker node compute can be estimated from node count, vCPU, memory, OS, image, and monthly runtime.'],
        rawText: this.detectSegment(normalized, /(azure kubernetes service|aks|kubernetes|worker nodes?)/, 260),
        nodeCount,
        vcpuPerNode,
        memoryGbPerNode,
        operatingSystem,
        imageType,
        monthlyHours
      } as GenericComponent);
    }

    if (!hasType('object_storage') && /\b(object storage|blob storage|product images|invoices|exported reports)\b/i.test(normalized.compact)) {
      const dataStoredGb = this.detectDataSizeNear(normalized, /(object storage|blob storage|product images|invoices|exported reports)/);
      const accessTier = this.detectStorageAccessTier(normalized);
      const redundancy = this.detectStorageRedundancy(normalized);
      next.push({
        id: 'object-storage-1',
        type: 'object_storage',
        name: 'Blob Storage',
        providerServiceHint: { azure: 'Azure Blob Storage', aws: 'Amazon S3', gcp: 'Cloud Storage' },
        pricingStatus: 'not_implemented',
        confidence: dataStoredGb ? 'high' : 'medium',
        missingFields: [
          dataStoredGb ? undefined : 'dataStoredGb',
          accessTier ? undefined : 'accessTier',
          redundancy ? undefined : 'redundancy'
        ].filter((field): field is string => Boolean(field)),
        assumptions: ['Blob Storage capacity pricing can be estimated from data stored, access tier, and redundancy.'],
        rawText: this.detectSegment(normalized, /(object storage|blob storage|product images|invoices|exported reports)/),
        dataStoredGb,
        accessTier,
        redundancy
      } as GenericComponent);
    }

    if (!hasType('queue') && /\b(service bus|message queue|event bus|asynchronous events|messages)\b/i.test(normalized.compact)) {
      const messageVolume = this.detectMessageCount(normalized);
      next.push({
        id: 'queue-1',
        type: 'queue',
        name: 'Service Bus',
        providerServiceHint: { azure: 'Azure Service Bus', aws: 'Amazon SQS', gcp: 'Pub/Sub' },
        pricingStatus: 'not_implemented',
        confidence: messageVolume ? 'high' : 'medium',
        missingFields: [messageVolume ? undefined : 'messageVolume', 'tier'].filter((field): field is string => Boolean(field)),
        assumptions: ['Service Bus pricing can be estimated from tier and monthly message volume.'],
        rawText: this.detectSegment(normalized, /(service bus|message queue|event bus|asynchronous events|messages)/),
        messageVolume,
        tier: null
      } as GenericComponent);
    }

    if (!hasType('monitoring') && /\b(monitoring|logging|log analytics|log ingestion|logs)\b/i.test(normalized.compact)) {
      const logIngestionGb = this.detectNumberNear(normalized, /(log ingestion|logs|logging)/, /(gb per month|gb\/month|gb)/);
      const retentionDays = this.detectRetentionDaysNear(normalized, /(logs|logging|monitoring|log retention)/);
      next.push({
        id: 'monitoring-1',
        type: 'monitoring',
        name: 'Azure Monitor',
        providerServiceHint: { azure: 'Azure Monitor / Log Analytics', aws: 'Amazon CloudWatch', gcp: 'Cloud Monitoring' },
        pricingStatus: 'not_implemented',
        confidence: logIngestionGb && retentionDays ? 'high' : 'medium',
        missingFields: [logIngestionGb ? undefined : 'logIngestionGb', retentionDays ? undefined : 'retentionDays'].filter((field): field is string =>
          Boolean(field)
        ),
        assumptions: ['Azure Monitor and Log Analytics pricing can be estimated from log ingestion and retention.'],
        rawText: this.detectSegment(normalized, /(monitoring|logging|log analytics|log ingestion|logs)/),
        logIngestionGb,
        retentionDays
      } as GenericComponent);
    }

    if (!hasType('network') && /\b(internet egress|egress|excluding cdn)\b/i.test(normalized.compact)) {
      const monthlyEgressGb = this.detectDataSizeNear(normalized, /(internet egress|egress)/);
      next.push({
        id: 'network-1',
        type: 'network',
        name: 'Internet egress',
        providerServiceHint: { azure: 'Azure Bandwidth', aws: 'Data Transfer', gcp: 'Network Data Transfer' },
        pricingStatus: 'not_implemented',
        confidence: monthlyEgressGb ? 'high' : 'medium',
        missingFields: monthlyEgressGb ? [] : ['monthlyEgressGb'],
        assumptions: ['Internet egress pricing can be estimated from monthly outbound data transfer.'],
        rawText: this.detectSegment(normalized, /(internet egress|egress|excluding cdn)/),
        monthlyEgressGb
      } as GenericComponent);
    }

    if (!hasType('backup') && this.explicitBackupServiceRequested(normalized)) {
      const retentionDays = this.detectRetentionDaysNear(normalized, /backup/);
      next.push({
        id: 'backup-1',
        type: 'backup',
        name: 'Backup',
        providerServiceHint: { azure: 'Azure Backup', aws: 'AWS Backup', gcp: 'Backup and DR Service' },
        pricingStatus: 'not_implemented',
        confidence: retentionDays ? 'high' : 'medium',
        missingFields: [retentionDays ? undefined : 'retentionDays', 'protectedDataGb'].filter((field): field is string => Boolean(field)),
        assumptions: ['Backup pricing is detected but not implemented in this phase.'],
        rawText: this.detectSegment(normalized, /backup/),
        retentionDays
      } as GenericComponent);
    }

    return next;
  }

  private removeImplicitBackupComponents(components: NormalizedComponent[], normalized: NormalizedText): NormalizedComponent[] {
    if (this.explicitBackupServiceRequested(normalized)) {
      return components;
    }

    return components.filter((component) => component.type !== 'backup');
  }

  private filterClarifyingQuestions(questions: string[], components: NormalizedComponent[]): string[] {
    const hasDatabaseHa = components.some((component) => component.type === 'database' && (component as DatabaseComponent).highAvailability === true);
    const hasCacheTier = components.some((component) => component.type === 'cache' && Boolean((component as CacheComponent).tier));
    const hasLoadBalancerScheme = components.some((component) => component.type === 'load_balancer' && Boolean((component as LoadBalancerComponent).scheme));

    return questions.filter((question) => {
      if (hasDatabaseHa && question === postgresHaQuestion) {
        return false;
      }
      if (hasCacheTier && question === redisTierQuestion) {
        return false;
      }
      if (hasLoadBalancerScheme && question === loadBalancerSchemeQuestion) {
        return false;
      }
      return true;
    });
  }

  private filterGlobalAssumptions(assumptions: string[], components: NormalizedComponent[]): string[] {
    const databaseHasHa = components.some((component) => component.type === 'database' && (component as DatabaseComponent).highAvailability === true);
    const cacheHasTier = components.some((component) => component.type === 'cache' && Boolean((component as CacheComponent).tier));
    const loadBalancerHasScheme = components.some((component) => component.type === 'load_balancer' && Boolean((component as LoadBalancerComponent).scheme));

    return assumptions.filter((assumption) => {
      if (!databaseHasHa && /highly available|high availability|\bha\b/i.test(assumption)) {
        return false;
      }
      if (!cacheHasTier && /production grade|production redis|standard tier|premium tier/i.test(assumption)) {
        return false;
      }
      if (!loadBalancerHasScheme && /http\/s|https? scheme|load balancer uses|scheme by default/i.test(assumption)) {
        return false;
      }
      return true;
    });
  }

  private normalizeText(input: string): NormalizedText {
    const rawLower = input.toLowerCase();
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
    const texts = [normalized.rawLower, normalized.compact, normalized.wordsOnly];
    const explicitNoHa = this.containsAny(texts, [/\b(no|without|disable|disabled)\s+(ha|high availability|highly available)\b/i]);
    if (explicitNoHa) {
      return false;
    }

    return this.containsAny(texts, [
      /\bhighly available\b/i,
      /\bhigh availability\b/i,
      /\bha\b/i,
      /\bzone redundant\b/i,
      /\bzone-redundant\b/i,
      /\bmulti zone\b/i,
      /\bmulti-zone\b/i,
      /\breplicated\b/i,
      /\bproduction database\b/i
    ]);
  }

  private detectRedisTier(normalized: NormalizedText): 'production' | 'basic' | null {
    const texts = [normalized.rawLower, normalized.compact, normalized.wordsOnly];
    if (
      this.containsAny(texts, [
        /\bbasic redis\b/i,
        /\bdev redis\b/i,
        /\bdevelopment redis\b/i,
        /\bnon production redis\b/i,
        /\bnon-production redis\b/i,
        /\bredis tier\s*:\s*basic\b/i,
        /\bcache tier\s*:\s*basic\b/i,
        /\btier\s*:\s*basic\b/i,
        /\btier basic\b/i,
        /\bbasic tier\b/i,
        /\bredis tier\s*:\s*dev(elopment)?\b/i,
        /\bcache tier\s*:\s*dev(elopment)?\b/i,
        /\btier\s*:\s*dev(elopment)?\b/i
      ])
    ) {
      return 'basic';
    }

    if (
      this.containsAny(texts, [
        /\bproduction grade\b/i,
        /\bproduction-grade\b/i,
        /\bproduction redis\b/i,
        /\bproduction cache\b/i,
        /\bproduction tier\b/i,
        /\bstandard redis\b/i,
        /\bstandard tier\b/i,
        /\bpremium redis\b/i,
        /\bpremium tier\b/i,
        /\breplicated redis\b/i,
        /\bhighly available redis\b/i,
        /\bredis tier\s*:\s*production\b/i,
        /\bcache tier\s*:\s*production\b/i,
        /\btier\s*:\s*production\b/i,
        /\btier production\b/i
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

    if (this.containsAny([normalized.rawLower, normalized.compact, normalized.wordsOnly], [/\btcp\b/i, /\budp\b/i, /\blayer 4\b/i, /\bl4\b/i, /\bnetwork load balancer\b/i])) {
      return 'tcp';
    }

    return null;
  }

  private detectDatabaseStorageGb(normalized: NormalizedText): number | null {
    const databaseIndex = normalized.compact.search(/\b(database|postgres|postgresql)\b/i);
    const segment = databaseIndex >= 0 ? normalized.compact.slice(databaseIndex, databaseIndex + 260) : normalized.compact;
    const match =
      segment.match(/(?:storage|data stored|stored data)\s*:?\s*(?:around\s+|approximately\s+)?(\d+(?:\.\d+)?)\s*(tb|gb)\b/i) ??
      segment.match(/(\d+(?:\.\d+)?)\s*(tb|gb)\s*(?:ssd\s*)?(?:storage|disk)\b/i);

    if (!match) {
      return null;
    }

    const value = Number(match[1]);
    return match[2].toLowerCase() === 'tb' ? value * 1024 : value;
  }

  private detectLoadBalancerTarget(normalized: NormalizedText): string | null {
    if (/\bapi gateway\b/i.test(normalized.compact)) {
      return 'API Gateway service';
    }
    if (/\bboth web servers\b/i.test(normalized.compact)) {
      return 'both web servers';
    }
    if (/\bboth servers\b/i.test(normalized.compact)) {
      return 'both servers';
    }
    return null;
  }

  private detectWorkerNodeCount(normalized: NormalizedText): number | null {
    const match =
      normalized.compact.match(/\b(\d+(?:\.\d+)?)\s+(?:(?:linux|ubuntu)\s+){0,3}worker nodes?\b/i) ??
      normalized.compact.match(/\b(\d+(?:\.\d+)?)\s+nodes?\b/i);
    return match ? Number(match[1]) : null;
  }

  private detectWorkerNodeVcpu(normalized: NormalizedText): number | null {
    const segment = this.workerNodeSegment(normalized);
    const match = segment.match(/\b(\d+(?:\.\d+)?)\s*(vcpu|vcpus|cpu|cpus)\b/i);
    return match ? Number(match[1]) : null;
  }

  private detectWorkerNodeMemoryGb(normalized: NormalizedText): number | null {
    const segment = this.workerNodeSegment(normalized);
    const match = segment.match(/\b(\d+(?:\.\d+)?)\s*(gb ram|gb memory|gib ram|gib memory)\b/i);
    return match ? Number(match[1]) : null;
  }

  private detectMonthlyHours(normalized: NormalizedText): number | null {
    const match =
      normalized.compact.match(/\b(\d+(?:\.\d+)?)\s*hours?(?:\s+per\s+month|\s*\/\s*month)?\b/i) ??
      normalized.compact.match(/\bmonthly runtime\s*:\s*(\d+(?:\.\d+)?)\b/i) ??
      normalized.compact.match(/\bcluster runtime\s*:\s*(\d+(?:\.\d+)?)\b/i);
    return match ? Number(match[1]) : null;
  }

  private detectDataSizeNear(normalized: NormalizedText, startPattern: RegExp): number | null {
    const segment = this.detectSegment(normalized, startPattern, 260);
    const match = segment.match(/(\d+(?:\.\d+)?)\s*(tb|gb)\b/i);
    if (!match) {
      return null;
    }
    const value = Number(match[1]);
    return match[2].toLowerCase() === 'tb' ? value * 1024 : value;
  }

  private detectStorageAccessTier(normalized: NormalizedText): string | null {
    const match = normalized.compact.match(/\baccess tier\s*:?\s*(hot|cool|cold|archive)\b/i) ?? normalized.compact.match(/\b(hot|cool|cold|archive)\s+(?:access\s+)?tier\b/i);
    return match ? match[1].toLowerCase() : null;
  }

  private detectStorageRedundancy(normalized: NormalizedText): string | null {
    const match = normalized.compact.match(/\b(ra-gzrs|ra-grs|ragzrs|ragrs|gzrs|grs|zrs|lrs)\b/i);
    if (!match) {
      return null;
    }

    return match[1].toUpperCase().replace('RAGZRS', 'RA-GZRS').replace('RAGRS', 'RA-GRS');
  }

  private detectQueueTier(normalized: NormalizedText): string | null {
    const queueSegment = this.detectSegment(normalized, /(service bus|message queue|event bus|messaging|asynchronous events)/, 260);
    const match =
      queueSegment.match(/\bservice bus\s+(basic|standard|premium)\b/i) ??
      queueSegment.match(/\b(basic|standard|premium)\s+service bus\b/i) ??
      queueSegment.match(/\b(?:sku|tier)\s*:?\s*(basic|standard|premium)\b/i);
    return match ? match[1].toLowerCase() : null;
  }

  private detectNumberNear(normalized: NormalizedText, startPattern: RegExp, unitPattern: RegExp): number | null {
    const segment = this.detectSegment(normalized, startPattern, 240);
    const match = segment.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unitPattern.source}`, 'i'));
    return match ? Number(match[1]) : null;
  }

  private detectMessageCount(normalized: NormalizedText): number | null {
    const match = normalized.compact.match(/(\d+(?:\.\d+)?)\s*(million|m)?\s*messages/i);
    if (!match) {
      return null;
    }
    const value = Number(match[1]);
    return match[2] ? value * 1_000_000 : value;
  }

  private detectRetentionDaysNear(normalized: NormalizedText, startPattern: RegExp): number | null {
    const segment = this.detectSegment(normalized, startPattern, 420);
    const matches = [
      ...segment.matchAll(/(\d+(?:\.\d+)?)\s*days?(?:\s+backup|\s+retention)?|retention(?:\s+should\s+be|\s+is|\s*:)?\s*(\d+(?:\.\d+)?)\s*days?/gi)
    ];
    const match = matches[matches.length - 1];
    if (!match) {
      return null;
    }
    return Number(match[1] ?? match[2]);
  }

  private detectSegment(normalized: NormalizedText, startPattern: RegExp, maxLength = 180): string {
    const match = normalized.compact.match(startPattern);
    if (!match || match.index === undefined) {
      return normalized.compact.slice(0, maxLength);
    }
    return normalized.compact.slice(match.index, match.index + maxLength);
  }

  private explicitBackupServiceRequested(normalized: NormalizedText): boolean {
    return this.containsAny([normalized.rawLower, normalized.compact], [/\bazure backup\b/i, /\bbackup service\b/i, /\bmanaged backup service\b/i]);
  }

  private workerNodeSegment(normalized: NormalizedText): string {
    const start = normalized.compact.search(/\b(each worker node|each node|worker node|worker nodes|nodes)\b/i);
    return start >= 0 ? normalized.compact.slice(start, start + 220) : normalized.compact;
  }

  private removeMissingField(missingFields: string[], field: string): string[] {
    return missingFields.filter((missingField) => missingField !== field);
  }

  private removeAssumptions(assumptions: string[], patterns: RegExp[]): string[] {
    return assumptions.filter((assumption) => !patterns.some((pattern) => pattern.test(assumption)));
  }
}
