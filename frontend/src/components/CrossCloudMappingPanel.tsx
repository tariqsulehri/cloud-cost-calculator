import { AlertTriangle, CheckCircle2, GitCompareArrows } from 'lucide-react';
import { useState } from 'react';
import { buildCrossCloudMappingSummary, type CrossCloudMappingRow, type MappingStatus } from '../lib/crossCloudMapping';
import { cn } from '../lib/utils';
import type { NormalizedInfrastructureRequirement, Provider } from '../types/estimate';

interface CrossCloudMappingPanelProps {
  requirements: NormalizedInfrastructureRequirement;
  baseProvider: Provider;
}

const providerLabels: Record<Provider, string> = {
  azure: 'Azure',
  aws: 'AWS',
  gcp: 'GCP'
};

const statusLabel: Record<MappingStatus, string> = {
  mapped: 'Mapped',
  needs_review: 'Review',
  missing: 'Missing'
};

const statusClass: Record<MappingStatus, string> = {
  mapped: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  needs_review: 'border-amber-300 bg-amber-100 text-amber-900',
  missing: 'border-red-300 bg-red-100 text-red-700'
};

type MappingFilter = 'all' | MappingStatus;

export function CrossCloudMappingPanel({ requirements, baseProvider }: CrossCloudMappingPanelProps) {
  const [filter, setFilter] = useState<MappingFilter>('all');
  const summary = buildCrossCloudMappingSummary(requirements, baseProvider);
  const filteredRows = summary.rows.filter((row) => rowMatchesFilter(row, filter));
  const visibleRows = filteredRows.slice(0, 18);
  const hiddenCount = Math.max(filteredRows.length - visibleRows.length, 0);

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-panel shadow-card">
      <div className="border-b border-lineSoft bg-slate-50/70 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="dashboard-kicker text-violet">
              <GitCompareArrows className="h-3.5 w-3.5" aria-hidden="true" />
              Mapping
            </div>
            <h2 className="mt-2 text-base font-bold text-navy">Automatic cloud mapping</h2>
            <p className="mt-0.5 max-w-3xl text-xs leading-5 text-muted">
              Base cloud: {providerLabels[baseProvider]}. The app maps these answers to equivalent Azure, AWS, and GCP fields before comparison.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
            <Metric label="All" value={summary.rows.length} tone="neutral" active={filter === 'all'} onClick={() => setFilter('all')} />
            <Metric label="Mapped" value={summary.automaticCount} tone="success" active={filter === 'mapped'} onClick={() => setFilter('mapped')} />
            <Metric label="Review" value={summary.needsReviewCount} tone="warning" active={filter === 'needs_review'} onClick={() => setFilter('needs_review')} />
            <Metric label="Missing" value={summary.missingCount} tone="danger" active={filter === 'missing'} onClick={() => setFilter('missing')} />
          </div>
        </div>
      </div>

      <div className="border-b border-lineSoft bg-blue-50 px-5 py-2.5 text-xs leading-5 text-blue-950">
        To see review items, click the amber <span className="font-bold">Review</span> box. Review rows mean the app mapped the service, but a cloud-specific choice should be checked before a client quote.
      </div>

      {filteredRows.length === 0 ? (
        <p className="px-5 py-4 text-xs text-muted">No mapping rows match this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-xs">
            <thead className="bg-navy text-left text-[11px] font-semibold uppercase text-slate-200">
              <tr>
                <th className="px-3 py-2.5">Service</th>
                <th className="px-3 py-2.5">Question</th>
                <th className="px-3 py-2.5">{providerLabels[baseProvider]} value</th>
                <th className="px-3 py-2.5">Azure</th>
                <th className="px-3 py-2.5">AWS</th>
                <th className="px-3 py-2.5">GCP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleRows.map((row, index) => (
                <MappingTableRow key={`${row.componentId}-${row.fieldKey}`} row={row} baseProvider={baseProvider} striped={index % 2 === 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hiddenCount > 0 ? (
        <div className="border-t border-lineSoft bg-slate-50 px-5 py-2.5 text-[11px] text-muted">
          Showing first {visibleRows.length} mapping checks. {hiddenCount} more are still used for calculation context.
        </div>
      ) : null}

      <div className="border-t border-lineSoft bg-amber-50 px-5 py-3 text-xs leading-5 text-amber-950">
        The app does not ask the same questions again for other clouds. It asks again only when a provider-specific choice can change cost materially.
      </div>
    </section>
  );
}

function MappingTableRow({ row, baseProvider, striped }: { row: CrossCloudMappingRow; baseProvider: Provider; striped: boolean }) {
  const needsReview = Object.values(row.providerValues).some((value) => value.status === 'needs_review');
  return (
    <tr className={needsReview ? 'bg-amber-50/35' : striped ? 'bg-slate-50/60' : undefined}>
      <td className="px-3 py-2.5">
        <div className="font-bold text-navy">{row.serviceName}</div>
        <div className="mt-0.5 text-[11px] capitalize text-muted">{row.serviceType.replace(/_/g, ' ')}</div>
      </td>
      <td className="px-3 py-2.5">
        <div className="font-semibold text-navy">{row.question}</div>
        <div className={cn('mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase', impactClass(row.impact))}>
          {row.impact} impact
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="font-semibold text-ink">{row.baseValue}</div>
        <div className="mt-0.5 text-[11px] text-muted">Common: {row.commonValue}</div>
      </td>
      {(['azure', 'aws', 'gcp'] as Provider[]).map((provider) => (
        <td key={provider} className={cn('px-3 py-2.5', provider === baseProvider ? 'bg-blue-50/40' : undefined)}>
          <div className="font-semibold text-ink">{row.providerValues[provider].value}</div>
          <div className={cn('mt-1 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold', statusClass[row.providerValues[provider].status])}>
            {row.providerValues[provider].status === 'mapped' ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
            {statusLabel[row.providerValues[provider].status]}
          </div>
        </td>
      ))}
    </tr>
  );
}

function Metric({
  label,
  value,
  tone,
  active,
  onClick
}: {
  label: string;
  value: number;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  active: boolean;
  onClick: () => void;
}) {
  const toneClass = {
    neutral: 'border-slate-200 bg-white text-slate-700',
    success: 'border-emerald-300 bg-emerald-100 text-emerald-800',
    warning: 'border-amber-300 bg-amber-100 text-amber-900',
    danger: 'border-red-300 bg-red-100 text-red-700'
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('min-w-20 rounded-lg border px-2.5 py-2 text-center transition hover:-translate-y-0.5 hover:shadow-cardHover', toneClass, active ? 'ring-2 ring-violet/30' : undefined)}
    >
      <div className="text-base font-extrabold">{value}</div>
      <div className="text-[10px] font-bold uppercase">{label}</div>
    </button>
  );
}

function rowMatchesFilter(row: CrossCloudMappingRow, filter: MappingFilter): boolean {
  if (filter === 'all') {
    return true;
  }
  return Object.values(row.providerValues).some((value) => value.status === filter);
}

function impactClass(impact: CrossCloudMappingRow['impact']): string {
  if (impact === 'high') {
    return 'border-red-200 bg-red-50 text-danger';
  }
  if (impact === 'medium') {
    return 'border-amber-200 bg-amber-50 text-warning';
  }
  return 'border-slate-200 bg-slate-50 text-muted';
}
