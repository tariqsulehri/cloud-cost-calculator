import { AlertTriangle, CheckCircle2, GitCompareArrows } from 'lucide-react';
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
  mapped: 'border-emerald-200 bg-emerald-50 text-success',
  needs_review: 'border-amber-200 bg-amber-50 text-warning',
  missing: 'border-red-200 bg-red-50 text-danger'
};

export function CrossCloudMappingPanel({ requirements, baseProvider }: CrossCloudMappingPanelProps) {
  const summary = buildCrossCloudMappingSummary(requirements, baseProvider);
  const visibleRows = summary.rows.slice(0, 18);
  const hiddenCount = Math.max(summary.rows.length - visibleRows.length, 0);

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
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <Metric label="Mapped" value={summary.automaticCount} tone="success" />
            <Metric label="Review" value={summary.needsReviewCount} tone="warning" />
            <Metric label="Missing" value={summary.missingCount} tone="danger" />
          </div>
        </div>
      </div>

      {summary.rows.length === 0 ? (
        <p className="px-5 py-4 text-xs text-muted">No services are ready for cross-cloud mapping yet.</p>
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
  return (
    <tr className={striped ? 'bg-slate-50/60' : undefined}>
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

function Metric({ label, value, tone }: { label: string; value: number; tone: 'success' | 'warning' | 'danger' }) {
  const toneClass = {
    success: 'bg-emerald-50 text-success',
    warning: 'bg-amber-50 text-warning',
    danger: 'bg-red-50 text-danger'
  }[tone];

  return (
    <div className={cn('min-w-20 rounded-lg px-2.5 py-2 text-center', toneClass)}>
      <div className="text-base font-extrabold">{value}</div>
      <div className="text-[10px] font-bold uppercase">{label}</div>
    </div>
  );
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
