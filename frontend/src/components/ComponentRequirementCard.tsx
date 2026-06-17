import { ChevronDown, ChevronRight, CircleAlert, CircleCheck, Clock3, WandSparkles } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { confidenceClass, confidenceDescription, confidenceLabel } from '../lib/format';
import { reviewStatusForComponent, type ReviewStatus } from '../lib/pricingReadiness';
import { InfoBadge } from './InfoBadge';
import type { NormalizedComponent, Provider } from '../types/estimate';

interface ComponentRequirementCardProps {
  component: NormalizedComponent;
  provider: Provider | 'compare';
  onUpdate: (componentId: string, updates: Record<string, unknown>) => void;
}

type ReviewFieldKind = 'number' | 'text' | 'boolean' | 'select';

interface ReviewFieldOption {
  label: string;
  value: string;
}

interface ReviewField {
  key: string;
  label: string;
  kind: ReviewFieldKind;
  placeholder?: string;
  defaultValue?: string;
  currentValue?: string;
  hint?: string;
  options?: ReviewFieldOption[];
}

export function ComponentRequirementCard({ component, provider, onUpdate }: ComponentRequirementCardProps) {
  const [expanded, setExpanded] = useState(component.missingFields.length > 0);
  const status = reviewStatusForComponent(component, provider);
  const Icon = statusIcon(status);

  return (
    <article className="overflow-visible rounded-xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-teal/30 hover:shadow-cardHover">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-3 px-3.5 py-3.5 text-left"
      >
        <div className="flex min-w-0 gap-2.5">
          <span className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg border ${statusIconClass(status)}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-bold text-navy">{component.name || component.type.replace('_', ' ')}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-graphite">{component.type.replace(/_/g, ' ')}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-muted">{summaryChips(component)}</div>
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <InfoBadge label={statusLabel(status)} tooltip={statusDescription(status)} className={statusClass(status)} />
          <InfoBadge label={confidenceLabel(component.confidence)} tooltip={confidenceDescription(component.confidence)} className={confidenceClass(component.confidence)} />
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden="true" /> : <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />}
        </div>
      </button>
      {expanded ? (
        <div className="border-t border-lineSoft bg-slate-50/70 px-3.5 py-3.5">
          {component.rawText ? (
            <div className="rounded-lg border border-line bg-white px-3 py-2 text-[11px] leading-5 text-muted">
              <span className="font-semibold text-ink">Evidence:</span> {component.rawText}
            </div>
          ) : null}
          {renderDetails(component)}
          {component.missingFields.length > 0 ? (
            <>
              <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-900">
                Missing: {component.missingFields.join(', ')}
              </div>
              <ReviewEditor component={component} provider={provider} onUpdate={onUpdate} />
            </>
          ) : null}
          {component.assumptions.length > 0 ? (
            <ul className="mt-2.5 space-y-1 text-[11px] leading-5 text-muted">
              {component.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ReviewEditor({
  component,
  provider,
  onUpdate
}: {
  component: NormalizedComponent;
  provider: Provider | 'compare';
  onUpdate: (componentId: string, updates: Record<string, unknown>) => void;
}) {
  const editableFields = reviewEditableFields(component, provider);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(editableFields.map((field) => [field.key, field.currentValue ?? '']))
  );
  const suggestedValues = Object.fromEntries(
    editableFields.filter((field) => field.defaultValue).map((field) => [field.key, field.defaultValue as string])
  );
  const hasSuggestedValues = Object.keys(suggestedValues).length > 0;

  if (editableFields.length === 0) {
    return null;
  }

  function setField(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSuggestionTab(field: ReviewField, event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) {
    if (event.key !== 'Tab' || event.shiftKey || !field.defaultValue || values[field.key]?.trim()) {
      return;
    }

    setField(field.key, field.defaultValue);
  }

  function handleApply() {
    const updates = parseUpdates(editableFields, values);

    if (Object.keys(updates).length > 0) {
      onUpdate(component.id, updates);
    }
  }

  function handleApplySuggestions() {
    const updates = parseUpdates(editableFields, {
      ...values,
      ...suggestedValues
    });

    if (Object.keys(updates).length > 0) {
      onUpdate(component.id, updates);
    }
  }

  return (
    <div className="mt-2.5 rounded-lg border border-slate-200 bg-white p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-[11px] font-bold uppercase text-graphite">Complete missing details</h4>
          <p className="mt-0.5 text-[11px] text-muted">Use detected values or proposal defaults, then estimate.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasSuggestedValues ? (
            <button
              type="button"
              onClick={handleApplySuggestions}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-teal/30 bg-teal/10 px-3 text-xs font-semibold text-teal transition hover:bg-teal/15"
              title="Apply the suggested proposal defaults shown in this form."
            >
              <WandSparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Use suggestions
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex h-8 items-center justify-center rounded-lg bg-navy px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Apply changes
          </button>
        </div>
      </div>
      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
        {editableFields.map((field) => (
          <label key={field.key} className="block">
            <span className="text-[10px] font-semibold uppercase text-muted">{field.label}</span>
            {field.kind === 'boolean' || field.kind === 'select' ? (
              <>
                <select
                  aria-label={field.label}
                  value={values[field.key] ?? ''}
                  onChange={(event) => setField(field.key, event.target.value)}
                  onKeyDown={(event) => handleSuggestionTab(field, event)}
                  className="mt-1 h-8 w-full rounded-md border border-line bg-white px-2 text-xs text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/10"
                >
                  <option value="">Select</option>
                  {field.kind === 'boolean' ? (
                    <>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </>
                  ) : (
                    field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>
                {field.hint ? <FieldHint field={field} /> : null}
              </>
            ) : (
              <>
                <input
                  aria-label={field.label}
                  type={field.kind === 'number' ? 'number' : 'text'}
                  min={field.kind === 'number' ? 0 : undefined}
                  value={values[field.key] ?? ''}
                  onChange={(event) => setField(field.key, event.target.value)}
                  onKeyDown={(event) => handleSuggestionTab(field, event)}
                  placeholder={field.placeholder}
                  className="mt-1 h-8 w-full rounded-md border border-line bg-white px-2 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-teal focus:ring-4 focus:ring-teal/10"
                />
                {field.hint ? <FieldHint field={field} /> : null}
              </>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

function FieldHint({ field }: { field: ReviewField }) {
  return (
    <span className="mt-1 block text-[11px] leading-4 text-muted">
      {field.hint}
      {field.defaultValue ? ' Press Tab to use the suggestion.' : null}
    </span>
  );
}

function parseUpdates(editableFields: ReviewField[], values: Record<string, string>): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  editableFields.forEach((field) => {
    const raw = values[field.key]?.trim() ?? '';
    if (!raw) {
      return;
    }
    updates[field.key] = field.kind === 'number' ? Number(raw) : field.kind === 'boolean' ? raw === 'true' : raw;
  });
  return updates;
}

function reviewEditableFields(component: NormalizedComponent, provider: Provider | 'compare'): ReviewField[] {
  const suggestion = suggestedDefaults(component);
  const fieldMeta: Record<string, Omit<ReviewField, 'key' | 'currentValue'>> = {
    quantity: { label: 'Quantity', kind: 'number', placeholder: '3', defaultValue: suggestion.quantity, hint: 'Proposal default: 1 when the count is not stated.' },
    vcpu: { label: 'vCPU', kind: 'number', placeholder: '8', defaultValue: suggestion.vcpu, hint: 'Proposal default: small production size. Change if the customer gave sizing.' },
    memoryGb: { label: 'Memory GB', kind: 'number', placeholder: '32', defaultValue: suggestion.memoryGb, hint: 'Proposal default: paired with suggested vCPU.' },
    nodeCount: { label: 'Node count', kind: 'number', placeholder: '4', defaultValue: suggestion.nodeCount, hint: 'Proposal default: 2 worker nodes for baseline availability.' },
    vcpuPerNode: { label: 'vCPU per node', kind: 'number', placeholder: '8', defaultValue: suggestion.vcpuPerNode, hint: 'Proposal default: medium node size.' },
    memoryGbPerNode: { label: 'Memory GB per node', kind: 'number', placeholder: '32', defaultValue: suggestion.memoryGbPerNode, hint: 'Proposal default: medium node memory.' },
    storageGb: { label: 'Storage GB', kind: 'number', placeholder: '1024', defaultValue: suggestion.storageGb, hint: 'Proposal default: 256 GB when storage is not stated.' },
    storageType: {
      label: `${providerLabel(provider)} storage type`,
      kind: 'select',
      defaultValue: suggestion.storageType,
      hint: storageTypeHint(provider),
      options: storageTypeOptions(provider)
    },
    operatingSystem: {
      label: 'Operating system',
      kind: 'text',
      placeholder: 'linux',
      defaultValue: ['compute', 'kubernetes'].includes(component.type) ? 'linux' : undefined
    },
    imageType: {
      label: 'Image',
      kind: 'text',
      placeholder: 'ubuntu',
      defaultValue: ['compute', 'kubernetes'].includes(component.type) ? 'ubuntu' : undefined
    },
    highAvailability: {
      label: 'High availability',
      kind: 'boolean',
      defaultValue: suggestion.highAvailability,
      hint: 'Production suggestion: Yes. Dev/test suggestion: No.'
    },
    tier: {
      label: 'Tier',
      kind: 'text',
      placeholder: 'production',
      defaultValue: suggestion.tier,
      hint: component.type === 'cache' ? 'Production: HA/SLA, higher cost. Dev/basic: cheaper, downtime risk.' : undefined
    },
    scheme: { label: 'Scheme', kind: 'text', placeholder: 'http_s', defaultValue: suggestion.scheme, hint: 'HTTP/S is used for web apps and ingress. TCP is used for network load balancing.' },
    target: { label: 'Target', kind: 'text', placeholder: component.type === 'load_balancer' ? 'API Gateway service' : undefined },
    dataTransferGb: { label: 'Data transfer GB', kind: 'number', placeholder: '3072' },
    monthlyTransferGb: {
      label: 'Monthly transfer GB',
      kind: 'number',
      placeholder: '1024',
      defaultValue: suggestion.monthlyTransferGb,
      hint: 'Proposal default: 1024 GB (1 TB). Change it when the customer gives expected CDN traffic.'
    },
    dataStoredGb: { label: 'Data stored GB', kind: 'number', placeholder: '5120' },
    accessTier: { label: 'Access tier', kind: 'text', placeholder: 'hot', defaultValue: suggestion.accessTier, hint: 'Hot is common for frequently used files. Cool/archive is cheaper for rarely used data.' },
    redundancy: { label: 'Redundancy', kind: 'text', placeholder: 'LRS', defaultValue: suggestion.redundancy, hint: 'LRS is the lowest-cost baseline. Use ZRS/GRS when resilience is required.' },
    protectedDataGb: { label: 'Protected data GB', kind: 'number', placeholder: '5120' },
    retentionDays: { label: 'Retention days', kind: 'number', placeholder: '30', defaultValue: suggestion.retentionDays, hint: 'Proposal default: 30 days.' },
    diskCount: { label: 'Disk count', kind: 'number', placeholder: '2' },
    diskSizeGb: { label: 'Disk size GB', kind: 'number', placeholder: '128' },
    diskTier: { label: 'Disk tier', kind: 'text', placeholder: 'standard-ssd' },
    gatewayCount: { label: 'Gateway count', kind: 'number', placeholder: '1' },
    monthlyDataProcessedGb: { label: 'Processed GB', kind: 'number', placeholder: '500' },
    publicIpCount: { label: 'Public IP count', kind: 'number', placeholder: '2' },
    ipSku: { label: 'IP SKU', kind: 'text', placeholder: 'standard' },
    endpointCount: { label: 'Endpoint count', kind: 'number', placeholder: '3' },
    dnsZoneCount: { label: 'DNS zones', kind: 'number', placeholder: '1' },
    dnsQueriesMillion: { label: 'DNS queries M', kind: 'number', placeholder: '10' },
    operationsCount: { label: 'Operations', kind: 'number', placeholder: '100000' },
    firewallCount: { label: 'Firewall count', kind: 'number', placeholder: '1' },
    firewallTier: { label: 'Firewall tier', kind: 'text', placeholder: 'standard' },
    instanceCount: { label: 'Instance count', kind: 'number', placeholder: '2' },
    planTier: { label: 'Plan tier', kind: 'text', placeholder: 'standard' },
    requestCount: { label: 'Requests', kind: 'number', placeholder: '10000000' },
    vcpuSeconds: { label: 'vCPU seconds', kind: 'number', placeholder: '360000' },
    memoryGbSeconds: { label: 'GB seconds', kind: 'number', placeholder: '720000' }
  };

  return component.missingFields
    .map((field) => ({
      key: field,
      ...fieldMeta[field],
      currentValue: stringifyFieldValue(component[field])
    }))
    .filter((field) => Boolean(field.label))
    .map((field) => ({
      key: field.key,
      label: field.label as string,
      kind: field.kind as ReviewFieldKind,
      placeholder: field.placeholder,
      defaultValue: field.defaultValue,
      currentValue: field.currentValue,
      hint: field.hint,
      options: field.options
    }));
}

function providerLabel(provider: Provider | 'compare'): string {
  const labels: Record<Provider | 'compare', string> = {
    azure: 'Azure',
    aws: 'AWS',
    gcp: 'GCP',
    compare: 'Cloud'
  };
  return labels[provider];
}

function storageTypeOptions(provider: Provider | 'compare'): ReviewFieldOption[] {
  if (provider === 'azure') {
    return [
      { label: 'SSD (Azure Premium/Standard SSD)', value: 'ssd' },
      { label: 'HDD / standard disk', value: 'hdd' }
    ];
  }

  if (provider === 'aws') {
    return [
      { label: 'SSD (AWS gp3/io2)', value: 'ssd' },
      { label: 'HDD / magnetic', value: 'hdd' }
    ];
  }

  if (provider === 'gcp') {
    return [
      { label: 'SSD persistent disk', value: 'ssd' },
      { label: 'Standard persistent disk', value: 'hdd' }
    ];
  }

  return [
    { label: 'SSD', value: 'ssd' },
    { label: 'HDD / standard disk', value: 'hdd' }
  ];
}

function storageTypeHint(provider: Provider | 'compare'): string {
  if (provider === 'azure') {
    return 'For Azure, SSD is common for PostgreSQL Flexible Server. Use HDD only when the customer asks for low-cost standard storage.';
  }

  if (provider === 'aws') {
    return 'For AWS, SSD maps to common RDS storage like gp3. Use HDD only for low-cost legacy storage needs.';
  }

  if (provider === 'gcp') {
    return 'For GCP, SSD maps to SSD persistent disk. Standard disk is cheaper but slower.';
  }

  return 'Choose SSD for normal production databases. Choose HDD/standard when low cost is more important than performance.';
}

function suggestedDefaults(component: NormalizedComponent): Record<string, string | undefined> {
  const context = `${component.rawText ?? ''} ${component.name ?? ''} ${component.type ?? ''}`.toLowerCase();
  const isDev = /\b(dev|development|test|testing|sandbox|poc|demo|non-production|non production)\b/.test(context);
  const isProduction = /\b(prod|production|live|critical|highly available|high availability|ha|zone redundant)\b/.test(context);

  if (component.type === 'compute') {
    return {
      quantity: '1',
      vcpu: isProduction ? '4' : '2',
      memoryGb: isProduction ? '16' : '8',
      operatingSystem: 'linux',
      imageType: 'ubuntu'
    };
  }

  if (component.type === 'kubernetes') {
    return {
      nodeCount: isProduction ? '3' : '2',
      vcpuPerNode: isProduction ? '4' : '2',
      memoryGbPerNode: isProduction ? '16' : '8',
      operatingSystem: 'linux',
      imageType: 'ubuntu'
    };
  }

  if (component.type === 'database') {
    return {
      vcpu: isProduction ? '4' : '2',
      memoryGb: isProduction ? '16' : '8',
      storageGb: '256',
      storageType: 'ssd',
      highAvailability: isProduction && !isDev ? 'true' : 'false'
    };
  }

  if (component.type === 'cache') {
    return {
      memoryGb: '2',
      tier: isProduction && !isDev ? 'production' : 'basic',
      highAvailability: isProduction && !isDev ? 'true' : 'false'
    };
  }

  if (component.type === 'load_balancer') {
    return {
      scheme: /\b(tcp|udp|network)\b/.test(context) ? 'tcp' : 'http_s'
    };
  }

  if (component.type === 'cdn') {
    return {
      monthlyTransferGb: '1024'
    };
  }

  if (component.type === 'object_storage') {
    return {
      dataStoredGb: '1024',
      accessTier: 'hot',
      redundancy: isProduction && !isDev ? 'ZRS' : 'LRS'
    };
  }

  if (component.type === 'backup' || component.type === 'monitoring') {
    return {
      retentionDays: '30'
    };
  }

  return {};
}

function stringifyFieldValue(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  return String(value);
}

function summaryChips(component: NormalizedComponent) {
  const rows = compactSummary(component);
  if (rows.length === 0) {
    return <span className="text-muted">No key values detected</span>;
  }

  return rows.map(([label, value]) => (
    <span key={label} className="rounded-full border border-line bg-white px-2 py-0.5 shadow-sm">
      <span className="font-semibold text-ink">{label}:</span> {formatValue(value)}
    </span>
  ));
}

function compactSummary(component: NormalizedComponent): Array<[string, unknown]> {
  if (component.type === 'compute') {
    const rows: Array<[string, unknown]> = [
      ['qty', component.quantity],
      ['vCPU', component.vcpu],
      ['RAM', component.memoryGb ? `${component.memoryGb} GB` : null],
      ['OS', component.operatingSystem ?? component.os]
    ];
    return rows.filter(([, value]) => hasValue(value));
  }
  if (component.type === 'database') {
    const rows: Array<[string, unknown]> = [
      ['engine', component.engine],
      ['vCPU', component.vcpu],
      ['storage', component.storageGb ? `${component.storageGb} GB` : null],
      ['HA', component.highAvailability]
    ];
    return rows.filter(([, value]) => hasValue(value));
  }
  if (component.type === 'cache') {
    const rows: Array<[string, unknown]> = [
      ['engine', component.engine],
      ['memory', component.memoryGb ? `${component.memoryGb} GB` : null],
      ['tier', component.tier]
    ];
    return rows.filter(([, value]) => hasValue(value));
  }
  if (component.type === 'cdn') {
    const rows: Array<[string, unknown]> = [['transfer', component.monthlyTransferGb ?? component.dataTransferGb]];
    return rows.filter(([, value]) => hasValue(value));
  }
  if (component.type === 'load_balancer') {
    const rows: Array<[string, unknown]> = [
      ['target', component.target ?? component.targets],
      ['scheme', component.scheme]
    ];
    return rows.filter(([, value]) => hasValue(value));
  }
  return [];
}

function renderDetails(component: NormalizedComponent) {
  if (component.type === 'compute') {
    return <ComputeRequirementDetails component={component} />;
  }
  if (component.type === 'database') {
    return <DatabaseRequirementDetails component={component} />;
  }
  if (component.type === 'cache') {
    return <CacheRequirementDetails component={component} />;
  }
  if (component.type === 'cdn') {
    return <CdnRequirementDetails component={component} />;
  }
  if (component.type === 'load_balancer') {
    return <LoadBalancerRequirementDetails component={component} />;
  }
  return <GenericRequirementDetails component={component} />;
}

function ComputeRequirementDetails({ component }: { component: NormalizedComponent }) {
  return (
    <DetailsGrid
      component={component}
      rows={[
        ['role', component.role ?? component.name],
        ['quantity', component.quantity],
        ['vcpu', component.vcpu],
        ['memoryGb', component.memoryGb],
        ['operatingSystem', component.operatingSystem ?? component.os],
        ['imageType', component.imageType ?? component.image],
        ['monthlyHours', component.monthlyHours]
      ]}
    />
  );
}

function DatabaseRequirementDetails({ component }: { component: NormalizedComponent }) {
  return (
    <DetailsGrid
      component={component}
      rows={[
        ['engine', component.engine],
        ['managed', component.managed],
        ['vcpu', component.vcpu],
        ['memoryGb', component.memoryGb],
        ['storageGb', component.storageGb],
        ['storageType', component.storageType],
        ['highAvailability', component.highAvailability],
        ['backupRetentionDays', component.backupRetentionDays, true]
      ]}
    />
  );
}

function CacheRequirementDetails({ component }: { component: NormalizedComponent }) {
  return (
    <DetailsGrid
      component={component}
      rows={[
        ['engine', component.engine],
        ['memoryGb', component.memoryGb],
        ['tier', component.tier],
        ['highAvailability', component.highAvailability, true]
      ]}
    />
  );
}

function CdnRequirementDetails({ component }: { component: NormalizedComponent }) {
  return (
    <DetailsGrid
      component={component}
      rows={[
        ['usage', component.usage ?? component.purpose],
        ['monthlyTransferGb', component.monthlyTransferGb ?? component.dataTransferGb],
        ['requestCount', component.requestCount, true]
      ]}
    />
  );
}

function LoadBalancerRequirementDetails({ component }: { component: NormalizedComponent }) {
  return (
    <DetailsGrid
      component={component}
      rows={[
        ['target', component.target ?? component.targets],
        ['scheme', component.scheme],
        ['publicFacing', component.publicFacing, true]
      ]}
    />
  );
}

function GenericRequirementDetails({ component }: { component: NormalizedComponent }) {
  const displayEntries = Object.entries(component).filter(
    ([key, value]) =>
      !['id', 'type', 'name', 'providerServiceHint', 'pricingStatus', 'confidence', 'missingFields', 'assumptions', 'rawText'].includes(key) &&
      value !== null &&
      value !== undefined &&
      value !== ''
  );

  return <DetailsGrid component={component} rows={displayEntries.map(([key, value]) => [key, value])} />;
}

function DetailsGrid({
  component,
  rows
}: {
  component: NormalizedComponent;
  rows: Array<[string, unknown, boolean?]>;
}) {
  const visibleRows = rows.filter(([key, value, optional]) => !optional || hasValue(value) || component.missingFields.includes(key));

  return (
    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
      {visibleRows.map(([key, value]) => (
        <div key={key}>
          <dt className="text-xs font-semibold uppercase text-muted">{key}</dt>
          <dd className="mt-0.5 text-ink">{formatValue(value, component.missingFields.includes(key))}</dd>
        </div>
      ))}
    </dl>
  );
}

function statusLabel(status: ReviewStatus): string {
  const labels: Record<ReviewStatus, string> = {
    supported: 'Ready',
    notImplemented: 'Price not ready',
    needsReview: 'Need info',
    unsupported: "Can't price"
  };
  return labels[status];
}

function statusDescription(status: ReviewStatus): string {
  const descriptions: Record<ReviewStatus, string> = {
    supported: 'All needed details are present. This service can be priced.',
    notImplemented: 'The app detected this service, but pricing for it is not built yet.',
    needsReview: 'Some required details are missing. Add them before estimating.',
    unsupported: 'This service or setup cannot be priced by the app right now.'
  };
  return descriptions[status];
}

function statusClass(status: ReviewStatus): string {
  if (status === 'supported') {
    return 'border-emerald-200 bg-emerald-50 text-success';
  }
  if (status === 'notImplemented') {
    return 'border-violet/20 bg-violet/10 text-violet';
  }
  if (status === 'needsReview') {
    return 'border-amber-200 bg-amber-50 text-warning';
  }
  return 'border-red-200 bg-red-50 text-danger';
}

function statusIcon(status: ReviewStatus) {
  if (status === 'supported') {
    return CircleCheck;
  }
  if (status === 'notImplemented') {
    return Clock3;
  }
  return CircleAlert;
}

function statusIconClass(status: ReviewStatus): string {
  if (status === 'supported') {
    return 'border-emerald-200 bg-emerald-50 text-success';
  }
  if (status === 'notImplemented') {
    return 'border-violet/20 bg-violet/10 text-violet';
  }
  return 'border-amber-200 bg-amber-50 text-warning';
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

function formatValue(value: unknown, isMissing = false): string {
  if (!hasValue(value)) {
    if (isMissing) {
      return 'Not detected';
    }
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
