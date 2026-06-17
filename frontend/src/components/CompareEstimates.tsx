import { AlertTriangle, CheckCircle2, CircleDollarSign, GitCompareArrows } from 'lucide-react';
import { useState } from 'react';
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
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-graphite">
                      {quality?.coveragePercent ?? 0}% priced
                    </div>
                  </div>
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
                <h3 className="text-xs font-bold uppercase tracking-wide text-navy">Detailed service costs</h3>
                <p className="mt-0.5 text-[11px] text-muted">Every calculated line item included in each provider total.</p>
              </div>
              {calculatedRows.length === 0 ? (
                <p className="p-3.5 text-xs text-muted">No calculated line items yet.</p>
              ) : (
                <div className="overflow-x-auto">
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
                      {calculatedRows.map((item, index) => (
                        <tr key={`${item.provider}-${item.serviceName}-${item.skuName}-${item.meterName}-${index}`} className={index % 2 === 1 ? 'bg-slate-50/60' : undefined}>
                          <td className="px-3 py-2.5 font-bold text-navy">{providerLabels[item.provider]}</td>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-navy">{item.serviceName}</div>
                            <div className="mt-0.5 text-[11px] text-muted">{item.category}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div>{item.skuName}</div>
                            <div className="mt-0.5 text-[11px] text-muted">{item.meterName}</div>
                          </td>
                          <td className="px-3 py-2.5">{item.usageLabel ?? `${item.quantity} x ${item.hours}`}</td>
                          <td className="px-3 py-2.5 font-bold text-teal">{formatCurrency(item.monthlyCost, estimates[item.provider]?.currency ?? 'USD')}</td>
                          <td className="px-3 py-2.5">
                            <InfoBadge
                              label={pricingSourceLabel(item.pricingSource)}
                              tooltip={pricingSourceDescription(item.pricingSource)}
                              className={pricingSourceClass(item.pricingSource)}
                              align="left"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                  <label className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-graphite">
                    <input
                      type="checkbox"
                      checked={showRoughGuidance}
                      onChange={(event) => setShowRoughGuidance(event.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-violet focus:ring-violet"
                    />
                    Show similar cost idea
                  </label>
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
    </section>
  );
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
