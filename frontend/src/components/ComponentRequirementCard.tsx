import { ChevronDown, ChevronRight, CircleAlert, CircleCheck, Clock3 } from 'lucide-react';
import { useState } from 'react';
import { confidenceClass } from '../lib/format';
import type { NormalizedComponent } from '../types/estimate';

interface ComponentRequirementCardProps {
  component: NormalizedComponent;
  onUpdate: (componentId: string, updates: Record<string, unknown>) => void;
}

export function ComponentRequirementCard({ component, onUpdate }: ComponentRequirementCardProps) {
  const [expanded, setExpanded] = useState(component.missingFields.length > 0);
  const Icon = statusIcon(component);

  return (
    <article className="overflow-hidden rounded-lg border border-line bg-white shadow-sm transition hover:border-teal/30 hover:shadow-card">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left"
      >
        <div className="flex min-w-0 gap-3">
          <span className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg border ${statusIconClass(component)}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-navy">{component.name || component.type.replace('_', ' ')}</h3>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-graphite">{component.type.replace(/_/g, ' ')}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">{summaryChips(component)}</div>
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(component)}`}>
            {statusLabel(component)}
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${confidenceClass(component.confidence)}`}>
            {component.confidence}
          </span>
          {expanded ? <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />}
        </div>
      </button>
      {expanded ? (
        <div className="border-t border-line bg-slate-50 px-4 py-4">
          {component.rawText ? (
            <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs leading-5 text-muted">
              <span className="font-semibold text-ink">Evidence:</span> {component.rawText}
            </div>
          ) : null}
          {renderDetails(component)}
          {component.missingFields.length > 0 ? (
            <>
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                Missing: {component.missingFields.join(', ')}
              </div>
              <ReviewEditor component={component} onUpdate={onUpdate} />
            </>
          ) : null}
          {component.assumptions.length > 0 ? (
            <ul className="mt-3 space-y-1 text-xs leading-5 text-muted">
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

function ReviewEditor({ component, onUpdate }: { component: NormalizedComponent; onUpdate: (componentId: string, updates: Record<string, unknown>) => void }) {
  const editableFields = reviewEditableFields(component);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(editableFields.map((field) => [field.key, field.defaultValue ?? '']))
  );

  if (editableFields.length === 0) {
    return null;
  }

  function setField(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleApply() {
    const updates: Record<string, unknown> = {};
    editableFields.forEach((field) => {
      const raw = values[field.key]?.trim() ?? '';
      if (!raw) {
        return;
      }
      updates[field.key] = field.kind === 'number' ? Number(raw) : field.kind === 'boolean' ? raw === 'true' : raw;
    });

    if (Object.keys(updates).length > 0) {
      onUpdate(component.id, updates);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-semibold uppercase text-graphite">Complete missing details</h4>
          <p className="mt-1 text-xs text-muted">Add values here to update this requirement before estimating.</p>
        </div>
        <button
          type="button"
          onClick={handleApply}
          className="inline-flex h-8 items-center justify-center rounded-md bg-navy px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          Apply changes
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {editableFields.map((field) => (
          <label key={field.key} className="block">
            <span className="text-xs font-semibold uppercase text-muted">{field.label}</span>
            {field.kind === 'boolean' ? (
              <select
                value={values[field.key] ?? ''}
                onChange={(event) => setField(field.key, event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-line bg-white px-2 text-sm text-ink outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/10"
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : (
              <input
                type={field.kind === 'number' ? 'number' : 'text'}
                min={field.kind === 'number' ? 0 : undefined}
                value={values[field.key] ?? ''}
                onChange={(event) => setField(field.key, event.target.value)}
                placeholder={field.placeholder}
                className="mt-1 h-9 w-full rounded-md border border-line bg-white px-2 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-teal focus:ring-4 focus:ring-teal/10"
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

function reviewEditableFields(component: NormalizedComponent): Array<{
  key: string;
  label: string;
  kind: 'number' | 'text' | 'boolean';
  placeholder?: string;
  defaultValue?: string;
}> {
  const fieldMeta: Record<string, { label: string; kind: 'number' | 'text' | 'boolean'; placeholder?: string; defaultValue?: string }> = {
    quantity: { label: 'Quantity', kind: 'number', placeholder: '3' },
    vcpu: { label: 'vCPU', kind: 'number', placeholder: '8' },
    memoryGb: { label: 'Memory GB', kind: 'number', placeholder: '32' },
    nodeCount: { label: 'Node count', kind: 'number', placeholder: '4' },
    vcpuPerNode: { label: 'vCPU per node', kind: 'number', placeholder: '8' },
    memoryGbPerNode: { label: 'Memory GB per node', kind: 'number', placeholder: '32' },
    storageGb: { label: 'Storage GB', kind: 'number', placeholder: '1024' },
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
    highAvailability: { label: 'High availability', kind: 'boolean' },
    tier: { label: 'Tier', kind: 'text', placeholder: 'production' },
    scheme: { label: 'Scheme', kind: 'text', placeholder: 'http_s' },
    target: { label: 'Target', kind: 'text', placeholder: component.type === 'load_balancer' ? 'API Gateway service' : undefined },
    dataTransferGb: { label: 'Data transfer GB', kind: 'number', placeholder: '3072' },
    dataStoredGb: { label: 'Data stored GB', kind: 'number', placeholder: '5120' },
    redundancy: { label: 'Redundancy', kind: 'text', placeholder: 'LRS' },
    protectedDataGb: { label: 'Protected data GB', kind: 'number', placeholder: '5120' },
    retentionDays: { label: 'Retention days', kind: 'number', placeholder: '30' }
  };

  return component.missingFields
    .map((field) => ({ key: field, ...fieldMeta[field] }))
    .filter((field): field is { key: string; label: string; kind: 'number' | 'text' | 'boolean'; placeholder?: string; defaultValue?: string } =>
      Boolean(field.label)
    );
}

function summaryChips(component: NormalizedComponent) {
  const rows = compactSummary(component);
  if (rows.length === 0) {
    return <span className="text-muted">No key values detected</span>;
  }

  return rows.map(([label, value]) => (
    <span key={label} className="rounded-md border border-line bg-white/90 px-2 py-1 shadow-sm">
      <span className="font-medium text-ink">{label}:</span> {formatValue(value)}
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

function statusLabel(component: NormalizedComponent): string {
  if (component.missingFields.length > 0 || component.pricingStatus === 'missing_required_fields' || component.pricingStatus === 'needs_review') {
    return 'needs review';
  }
  if (component.pricingStatus === 'not_implemented') {
    return 'not implemented';
  }
  if (component.pricingStatus === 'supported') {
    return 'supported';
  }
  return 'unsupported';
}

function statusClass(component: NormalizedComponent): string {
  const label = statusLabel(component);
  if (label === 'supported') {
    return 'border-emerald-200 bg-emerald-50 text-success';
  }
  if (label === 'not implemented') {
    return 'border-violet/20 bg-violet/10 text-violet';
  }
  if (label === 'needs review') {
    return 'border-amber-200 bg-amber-50 text-warning';
  }
  return 'border-red-200 bg-red-50 text-danger';
}

function statusIcon(component: NormalizedComponent) {
  const label = statusLabel(component);
  if (label === 'supported') {
    return CircleCheck;
  }
  if (label === 'not implemented') {
    return Clock3;
  }
  return CircleAlert;
}

function statusIconClass(component: NormalizedComponent): string {
  const label = statusLabel(component);
  if (label === 'supported') {
    return 'border-emerald-200 bg-emerald-50 text-success';
  }
  if (label === 'not implemented') {
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
