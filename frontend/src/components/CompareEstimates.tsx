import { AlertTriangle, CheckCircle2, CircleDollarSign, Download, FileText, GitCompareArrows, Maximize2, X } from 'lucide-react';
import { useState } from 'react';
import { coverageBadgeClass } from '../lib/coverageBadge';
import { formatCurrency, pricingSourceClass, pricingSourceDescription, pricingSourceLabel } from '../lib/format';
import { InfoBadge } from './InfoBadge';
import type { NaturalLanguageEstimateResponse, NormalizedComponentType, Provider } from '../types/estimate';

const providerLabels: Record<Provider, string> = {
  azure: 'Azure',
  aws: 'AWS',
  gcp: 'GCP'
};

const providerNotes: Record<Provider, string> = {
  azure: 'Public Azure pricing where implemented',
  aws: 'Early proposal rate card',
  gcp: 'Early proposal rate card'
};

interface CompareEstimatesProps {
  estimates: Partial<Record<Provider, NaturalLanguageEstimateResponse>>;
}

export function CompareEstimates({ estimates }: CompareEstimatesProps) {
  const [showRoughGuidance, setShowRoughGuidance] = useState(false);
  const [showGuidanceInCostTable, setShowGuidanceInCostTable] = useState(false);
  const [showLandscapeTable, setShowLandscapeTable] = useState(false);
  const providers: Provider[] = ['azure', 'aws', 'gcp'];
  const available = providers.filter((provider) => estimates[provider]);
  const calculatedRows = available.flatMap((provider) =>
    (estimates[provider]?.calculatedLineItems ?? []).map((item) => ({
      provider,
      ...item
    }))
  );
  const excludedRows = available.flatMap((provider) => {
    const estimate = estimates[provider];
    if (!estimate) {
      return [];
    }

    return [
      ...estimate.notImplementedLineItems.map((item) => ({ provider, status: 'Price not ready', ...item })),
      ...estimate.missingRequiredFieldLineItems.map((item) => ({ provider, status: 'Need info', ...item })),
      ...estimate.unsupportedLineItems.map((item) => ({ provider, status: "Can't price", ...item }))
    ];
  });
  const coverageValues = available.map((provider) => estimates[provider]?.estimateQuality?.coveragePercent ?? 0);
  const hasCoverageGap = coverageValues.length > 1 && Math.max(...coverageValues) - Math.min(...coverageValues) >= 10;
  const showGuidanceRows = showRoughGuidance && showGuidanceInCostTable;
  const detailedCostRows = [
    ...calculatedRows.map((item, index) => ({
      id: `calculated-${item.provider}-${item.serviceName}-${item.skuName}-${item.meterName}-${index}`,
      provider: item.provider,
      serviceName: item.serviceName,
      category: item.category,
      sku: item.skuName,
      meter: item.meterName,
      usage: item.usageLabel ?? `${item.quantity} x ${item.hours}`,
      monthly: formatCurrency(item.monthlyCost, estimates[item.provider]?.currency ?? 'USD'),
      source: pricingSourceLabel(item.pricingSource),
      sourceDescription: pricingSourceDescription(item.pricingSource),
      sourceClass: pricingSourceClass(item.pricingSource),
      isGuidance: false
    })),
    ...(showGuidanceRows
      ? excludedRows.map((item, index) => {
          const guidance = roughGuidanceFor(item.type, item.provider);
          return {
            id: `guidance-${item.provider}-${item.componentId}-${index}`,
            provider: item.provider,
            serviceName: item.serviceName,
            category: item.status,
            sku: 'Similar service guide',
            meter: 'Pricing adapter not ready',
            usage: guidance.note,
            monthly: guidance.range,
            source: 'Guide only (not in total)',
            sourceDescription: 'Approximate planning range. This row is excluded from official calculated totals.',
            sourceClass: 'border-amber-200 bg-amber-50 text-amber-900',
            isGuidance: true
          };
        })
      : [])
  ];
  const planningTotals = providers.reduce<Partial<Record<Provider, { low: number; high: number; itemCount: number }>>>((totals, provider) => {
    const estimate = estimates[provider];
    if (!estimate || !showGuidanceRows) {
      return totals;
    }

    const guidanceTotal = excludedRows
      .filter((row) => row.provider === provider)
      .map((row) => parseGuidanceRange(roughGuidanceFor(row.type, provider).range))
      .filter((range): range is { low: number; high: number } => Boolean(range))
      .reduce<{ low: number; high: number; itemCount: number }>(
        (sum, range) => ({
          low: sum.low + range.low,
          high: sum.high + range.high,
          itemCount: sum.itemCount + 1
        }),
        { low: 0, high: 0, itemCount: 0 }
      );

    if (guidanceTotal.itemCount > 0) {
      totals[provider] = {
        low: estimate.totalMonthlyCost + guidanceTotal.low,
        high: estimate.totalMonthlyCost + guidanceTotal.high,
        itemCount: guidanceTotal.itemCount
      };
    }

    return totals;
  }, {});

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-panel shadow-card">
      <div className="border-b border-lineSoft bg-slate-50/70 px-5 py-4">
        <div className="dashboard-kicker text-violet">
          <GitCompareArrows className="h-3.5 w-3.5" aria-hidden="true" />
          Compare
        </div>
        <h2 className="mt-2 text-base font-bold text-navy">Cloud cost comparison</h2>
        <p className="mt-0.5 max-w-3xl text-xs leading-5 text-muted">
          Compare totals only when coverage is similar. Partial totals exclude services that are missing or not priced.
        </p>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-3">
        {providers.map((provider) => {
          const estimate = estimates[provider];
          const quality = estimate?.estimateQuality;
          const coveragePercent = quality?.coveragePercent ?? 0;
          const planningTotal = planningTotals[provider];
          const excludedCount = estimate
            ? estimate.notImplementedLineItems.length + estimate.unsupportedLineItems.length + estimate.missingRequiredFieldLineItems.length
            : 0;

          return (
            <article key={provider} className="rounded-lg border border-line bg-white p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-navy">{providerLabels[provider]}</h3>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted">{providerNotes[provider]}</p>
                </div>
                {quality?.status === 'complete' ? (
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                )}
              </div>

              {estimate ? (
                <>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div className="text-2xl font-extrabold text-navy">{formatCurrency(estimate.totalMonthlyCost, estimate.currency)}</div>
                    <div className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${coverageBadgeClass(coveragePercent)}`}>
                      {coveragePercent}% priced
                    </div>
                  </div>
                  {planningTotal ? (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-amber-950">
                      <div className="font-bold">Planning total incl. guidance</div>
                      <div className="mt-0.5 text-sm font-extrabold">
                        {formatPlanningRange(planningTotal.low, planningTotal.high, estimate.currency)}
                      </div>
                      <div className="mt-0.5">Includes {planningTotal.itemCount} approximate item(s). Official total above is unchanged.</div>
                    </div>
                  ) : null}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                      <div className="font-bold text-navy">{quality?.pricedComponentCount ?? 0}/{quality?.totalComponentCount ?? 0}</div>
                      <div className="text-muted">services priced</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                      <div className="font-bold text-navy">{excludedCount}</div>
                      <div className="text-muted">excluded</div>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] leading-4 text-slate-600">{quality?.summary}</p>
                </>
              ) : (
                <div className="mt-4 flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed border-line bg-slate-50 px-3 text-center text-xs text-muted">
                  <CircleDollarSign className="mb-2 h-5 w-5 text-slate-400" aria-hidden="true" />
                  Not calculated yet.
                </div>
              )}
            </article>
          );
        })}
      </div>

      {available.length > 0 ? (
        <div className="border-t border-lineSoft p-4">
          {hasCoverageGap ? (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-5 text-amber-950">
              Coverage is not equal across providers. A lower total can mean fewer services were priced, not a cheaper design.
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              <div className="border-b border-lineSoft bg-slate-50 px-3.5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-navy">Detailed service costs</h3>
                    <p className="mt-0.5 text-[11px] text-muted">Every calculated line item included in each provider total.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLandscapeTable(true)}
                      disabled={detailedCostRows.length === 0}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[11px] font-bold text-graphite transition hover:border-violet/30 hover:text-violet disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                      View landscape
                    </button>
                    <button
                      type="button"
                      onClick={() => exportExcelFile(detailedCostRows)}
                      disabled={detailedCostRows.length === 0}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[11px] font-bold text-graphite transition hover:border-teal/30 hover:text-teal disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      Export Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => exportPdfView(detailedCostRows)}
                      disabled={detailedCostRows.length === 0}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[11px] font-bold text-graphite transition hover:border-danger/30 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      Export PDF
                    </button>
                  </div>
                </div>
              </div>
              {detailedCostRows.length === 0 ? (
                <p className="p-3.5 text-xs text-muted">No calculated line items yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <DetailedCostTable rows={detailedCostRows} />
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-line bg-white">
              <div className="border-b border-lineSoft bg-slate-50 px-3.5 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-navy">Not calculated</h3>
                    <p className="mt-0.5 text-[11px] text-muted">These services are excluded from totals.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-graphite">
                      <input
                        type="checkbox"
                        checked={showRoughGuidance}
                        onChange={(event) => {
                          setShowRoughGuidance(event.target.checked);
                          if (!event.target.checked) {
                            setShowGuidanceInCostTable(false);
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-violet focus:ring-violet"
                      />
                      Show similar cost idea
                    </label>
                    {showRoughGuidance ? (
                      <label className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-950">
                        <input
                          type="checkbox"
                          checked={showGuidanceInCostTable}
                          onChange={(event) => setShowGuidanceInCostTable(event.target.checked)}
                          className="h-3.5 w-3.5 rounded border-amber-300 text-warning focus:ring-warning"
                        />
                        Also show in cost table
                      </label>
                    ) : null}
                  </div>
                </div>
              </div>
              {excludedRows.length === 0 ? (
                <p className="p-3.5 text-xs text-muted">No excluded services in calculated providers.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-line text-xs">
                    <thead className="bg-slate-100 text-left text-[11px] font-bold uppercase text-graphite">
                      <tr>
                        <th className="px-3 py-2.5">Cloud</th>
                        <th className="px-3 py-2.5">Service</th>
                        <th className="px-3 py-2.5">Reason</th>
                        {showRoughGuidance ? <th className="px-3 py-2.5">Similar cost / remarks</th> : null}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {excludedRows.map((item, index) => (
                        <tr key={`${item.provider}-${item.componentId}-${index}`} className={index % 2 === 1 ? 'bg-slate-50/60' : undefined}>
                          <td className="px-3 py-2.5 font-bold text-navy">{providerLabels[item.provider]}</td>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-navy">{item.serviceName}</div>
                            <div className="mt-0.5 text-[11px] text-warning">{item.status}</div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">{item.reason}</td>
                          {showRoughGuidance ? (
                            <td className="px-3 py-2.5">
                              <RoughGuidance type={item.type} provider={item.provider} />
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {available.length > 1 ? (
        <div className="border-t border-lineSoft bg-amber-50 px-5 py-3 text-xs leading-5 text-amber-950">
          AWS and GCP are early proposal estimates. Use them for first-pass comparison only, then validate with live provider calculators or client contract pricing.
        </div>
      ) : null}

      {showLandscapeTable ? <LandscapeCostModal rows={detailedCostRows} estimates={estimates} onClose={() => setShowLandscapeTable(false)} /> : null}
    </section>
  );
}

type DetailedCostRow = {
  id: string;
  provider: Provider;
  serviceName: string;
  category: string;
  sku: string;
  meter: string;
  usage: string;
  monthly: string;
  source: string;
  sourceDescription: string;
  sourceClass: string;
  isGuidance: boolean;
};

function DetailedCostTable({ rows }: { rows: DetailedCostRow[] }) {
  return (
    <table className="min-w-full divide-y divide-line text-xs">
      <thead className="bg-navy text-left text-[11px] font-semibold uppercase text-slate-200">
        <tr>
          <th className="px-3 py-2.5">Cloud</th>
          <th className="px-3 py-2.5">Service</th>
          <th className="px-3 py-2.5">SKU / Meter</th>
          <th className="px-3 py-2.5">Usage</th>
          <th className="px-3 py-2.5">Monthly</th>
          <th className="px-3 py-2.5">Source</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {rows.map((row, index) => (
          <tr key={row.id} className={row.isGuidance ? 'bg-amber-50/70' : index % 2 === 1 ? 'bg-slate-50/60' : undefined}>
            <td className="px-3 py-2.5 font-bold text-navy">{providerLabels[row.provider]}</td>
            <td className="px-3 py-2.5">
              <div className="font-semibold text-navy">{row.serviceName}</div>
              <div className={row.isGuidance ? 'mt-0.5 text-[11px] font-semibold text-warning' : 'mt-0.5 text-[11px] text-muted'}>{row.category}</div>
            </td>
            <td className="px-3 py-2.5">
              <div>{row.sku}</div>
              <div className={row.isGuidance ? 'mt-0.5 text-[11px] text-amber-800' : 'mt-0.5 text-[11px] text-muted'}>{row.meter}</div>
            </td>
            <td className="px-3 py-2.5 text-slate-700">{row.usage}</td>
            <td className={row.isGuidance ? 'px-3 py-2.5 font-bold text-warning' : 'px-3 py-2.5 font-bold text-teal'}>{row.monthly}</td>
            <td className="px-3 py-2.5">
              <InfoBadge label={row.source} tooltip={row.sourceDescription} className={row.sourceClass} align="left" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LandscapeCostModal({
  rows,
  estimates,
  onClose
}: {
  rows: DetailedCostRow[];
  estimates: Partial<Record<Provider, NaturalLanguageEstimateResponse>>;
  onClose: () => void;
}) {
  const providers: Provider[] = ['azure', 'aws', 'gcp'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Landscape cost table">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-command">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lineSoft bg-slate-50 px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-navy">Detailed service costs</h2>
            <p className="text-xs text-muted">Landscape cloud view. Guidance rows are not included in official totals.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportExcelFile(rows)}
              disabled={rows.length === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-xs font-bold text-graphite transition hover:border-teal/30 hover:text-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => exportPdfView(rows)}
              disabled={rows.length === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-xs font-bold text-graphite transition hover:border-danger/30 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Export PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-xs font-bold text-graphite transition hover:border-danger/30 hover:text-danger"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Close
            </button>
          </div>
        </div>
        <LandscapeTotalsBar providers={providers} estimates={estimates} position="top" />
        <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-4">
          <div className="grid min-w-[1180px] grid-cols-3 gap-3">
            {providers.map((provider) => {
              const providerRows = rows.filter((row) => row.provider === provider);
              const estimate = estimates[provider];
              return (
                <section key={provider} className="overflow-hidden rounded-lg border border-line bg-white">
                  <div className="border-b border-lineSoft bg-navy px-3 py-2.5 text-white">
                    <div className="text-[11px] font-bold uppercase text-slate-300">Cloud</div>
                    <div className="mt-0.5 flex items-end justify-between gap-3">
                      <h3 className="text-sm font-extrabold">{providerLabels[provider]}</h3>
                      <div className="text-right text-sm font-extrabold">{estimate ? formatCurrency(estimate.totalMonthlyCost, estimate.currency) : 'Not calculated'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_118px] border-b border-lineSoft bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                    <div className="px-3 py-2">Service Details</div>
                    <div className="border-l border-lineSoft px-3 py-2 text-right">Monthly</div>
                  </div>
                  {providerRows.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-muted">No calculated rows for this cloud.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {providerRows.map((row) => (
                        <LandscapeServiceRow key={row.id} row={row} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
        <LandscapeTotalsBar providers={providers} estimates={estimates} position="bottom" />
      </div>
    </div>
  );
}

function LandscapeServiceRow({ row }: { row: DetailedCostRow }) {
  return (
    <div className={row.isGuidance ? 'grid grid-cols-[minmax(0,1fr)_118px] bg-amber-50/80 text-xs' : 'grid grid-cols-[minmax(0,1fr)_118px] text-xs'}>
      <div className="min-w-0 px-3 py-2.5">
        <div className="font-bold text-navy">{row.serviceName}</div>
        <div className={row.isGuidance ? 'mt-0.5 text-[11px] font-semibold text-warning' : 'mt-0.5 text-[11px] text-muted'}>{row.category}</div>
        <div className="mt-2 grid gap-1 text-[11px] leading-4 text-slate-700">
          <div>
            <span className="font-bold text-slate-500">SKU / Meter: </span>
            {row.sku}
          </div>
          <div className="text-slate-500">{row.meter}</div>
          <div>
            <span className="font-bold text-slate-500">Usage: </span>
            {row.usage}
          </div>
          <div>
            <span className="font-bold text-slate-500">Source: </span>
            {row.source}
          </div>
        </div>
      </div>
      <div className={row.isGuidance ? 'border-l border-amber-200 px-3 py-2.5 text-right font-extrabold text-warning' : 'border-l border-lineSoft px-3 py-2.5 text-right font-extrabold text-teal'}>
        {row.monthly}
      </div>
    </div>
  );
}

function LandscapeTotalsBar({
  providers,
  estimates,
  position
}: {
  providers: Provider[];
  estimates: Partial<Record<Provider, NaturalLanguageEstimateResponse>>;
  position: 'top' | 'bottom';
}) {
  return (
    <div className="border-b border-lineSoft bg-white px-4 py-2 last:border-b-0 last:border-t">
      <div className="grid min-w-[760px] grid-cols-3 gap-3">
        {providers.map((provider) => {
          const estimate = estimates[provider];
          return (
            <div key={`${position}-${provider}`} className="rounded-lg border border-line bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-bold uppercase text-slate-500">{providerLabels[provider]} total</div>
              <div className="mt-0.5 text-base font-extrabold text-navy">{estimate ? formatCurrency(estimate.totalMonthlyCost, estimate.currency) : 'Not calculated'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function exportExcelFile(rows: DetailedCostRow[]) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
    th { background: #0f172a; color: white; text-align: left; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; }
    .guidance { background: #fef3c7; }
  </style>
</head>
<body>
  <h2>Cloud cost comparison</h2>
  <p>Guidance rows are approximate and not included in official totals.</p>
  ${exportTableHtml(rows)}
</body>
</html>`;
  downloadTextFile('cloud-cost-comparison.xls', html, 'application/vnd.ms-excel;charset=utf-8');
}

function exportPdfView(rows: DetailedCostRow[]) {
  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) {
    return;
  }

  printWindow.document.write(`<!doctype html>
<html>
<head>
  <title>Cloud cost comparison</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    body { font-family: Arial, sans-serif; color: #0f172a; }
    h1 { margin: 0 0 4px; font-size: 20px; }
    p { margin: 0 0 14px; font-size: 12px; color: #475569; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #0f172a; color: white; text-align: left; }
    th, td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; }
    .guidance { background: #fef3c7; }
  </style>
</head>
<body>
  <h1>Cloud cost comparison</h1>
  <p>Guidance rows are approximate and not included in official totals.</p>
  ${exportTableHtml(rows)}
  <script>
    window.onload = () => {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}

function exportTableHtml(rows: DetailedCostRow[]): string {
  return `<table>
    <thead>
      <tr>
        <th>Cloud</th>
        <th>Service</th>
        <th>Category</th>
        <th>SKU</th>
        <th>Meter</th>
        <th>Usage</th>
        <th>Monthly</th>
        <th>Source</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr class="${row.isGuidance ? 'guidance' : ''}">
            <td>${escapeHtml(providerLabels[row.provider])}</td>
            <td>${escapeHtml(row.serviceName)}</td>
            <td>${escapeHtml(row.category)}</td>
            <td>${escapeHtml(row.sku)}</td>
            <td>${escapeHtml(row.meter)}</td>
            <td>${escapeHtml(row.usage)}</td>
            <td>${escapeHtml(row.monthly)}</td>
            <td>${escapeHtml(row.source)}</td>
          </tr>`
        )
        .join('')}
    </tbody>
  </table>`;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function RoughGuidance({ type, provider }: { type: NormalizedComponentType; provider: Provider }) {
  const guidance = roughGuidanceFor(type, provider);
  return (
    <div className="min-w-44 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-amber-950">
      <div className="font-bold">Similar service: {guidance.range}</div>
      <div className="mt-0.5">{guidance.note}</div>
      <div className="mt-1 font-semibold text-amber-800">Remark: guide only, not included in total.</div>
    </div>
  );
}

function parseGuidanceRange(range: string): { low: number; high: number } | null {
  const values = range.match(/\d[\d,]*(?:\.\d+)?/g)?.map((value) => Number(value.replace(/,/g, ''))) ?? [];
  if (values.length < 2 || values.some((value) => Number.isNaN(value))) {
    return null;
  }
  return { low: values[0], high: values[1] };
}

function formatPlanningRange(low: number, high: number, currency: string): string {
  return `${formatCurrency(low, currency)} - ${formatCurrency(high, currency)}`;
}

function roughGuidanceFor(type: NormalizedComponentType, provider: Provider): { range: string; note: string } {
  const providerLabel = providerLabels[provider];
  const common: Partial<Record<NormalizedComponentType, { range: string; note: string }>> = {
    compute: { range: 'US$60-700/mo', note: 'Similar VM cost depends on vCPU, RAM, count, and hours.' },
    kubernetes: { range: 'US$250-1,500/mo', note: 'Similar cluster cost is usually worker nodes plus control plane/support charges.' },
    database: { range: 'US$150-1,200/mo', note: 'Similar managed DB cost depends on vCPU, storage, HA, and backup.' },
    cache: { range: 'US$40-500/mo', note: 'Similar Redis cost depends on memory size, tier, and HA.' },
    object_storage: { range: 'US$20-150 per TB/mo', note: 'Similar storage cost excludes requests, replication, and egress.' },
    storage: { range: 'US$20-150 per TB/mo', note: 'Similar storage cost depends on tier, redundancy, and operations.' },
    block_storage: { range: 'US$40-220 per TB/mo', note: 'Similar disk cost depends on SSD/HDD tier and performance.' },
    file_storage: { range: 'US$60-300 per TB/mo', note: 'Similar file storage cost depends on performance tier and redundancy.' },
    cdn: { range: 'US$80-350 per TB', note: 'Similar CDN cost depends on transfer region, requests, and security features.' },
    load_balancer: { range: 'US$20-250/mo', note: 'Similar load balancer cost depends on type, capacity units, and data.' },
    queue: { range: 'US$5-100/mo', note: 'Similar messaging cost depends on request/message volume and tier.' },
    monitoring: { range: 'US$50-800/mo', note: 'Similar monitoring cost depends mainly on log GB and retention.' },
    backup: { range: 'US$25-180 per TB/mo', note: 'Similar backup cost depends on protected data and retention.' },
    security: { range: 'US$100-1,500/mo', note: 'Similar security service cost depends on firewall/WAF tier and traffic.' },
    network: { range: 'US$30-600/mo', note: 'Similar network cost depends on gateways, endpoints, and processed data.' },
    serverless: { range: 'US$10-500/mo', note: 'Similar serverless cost depends on CPU, memory seconds, and requests.' }
  };

  return common[type] ?? { range: 'Planning range needed', note: `Add sizing to estimate a similar ${providerLabel} service.` };
}
