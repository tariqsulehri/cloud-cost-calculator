import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import { Coins } from 'lucide-react';
import { coverageBadgeClass } from '../lib/coverageBadge';
import { formatCurrency, pricingSourceClass, pricingSourceDescription, pricingSourceLabel } from '../lib/format';
import { InfoBadge } from './InfoBadge';
import type { NaturalLanguageEstimateResponse } from '../types/estimate';

interface EstimateSummaryProps {
  estimate: NaturalLanguageEstimateResponse;
}

export function EstimateSummary({ estimate }: EstimateSummaryProps) {
  const quality = estimate.estimateQuality;
  const isPartial = quality?.status === 'partial' || quality?.status === 'blocked';
  const scopeNotes = estimateScopeNotes(estimate);
  const providerName = providerLabel(estimate.provider);
  const usesEarlyProposal = estimate.calculatedLineItems.some((item) => item.pricingSource === 'early-proposal-rate-card');
  const usesAwsPublicPricing = estimate.calculatedLineItems.some((item) => item.pricingSource === 'aws-public-price-list');
  const chartData = estimate.calculatedLineItems.map((item) => ({
    name: item.serviceName.length > 18 ? `${item.serviceName.slice(0, 17)}…` : item.serviceName,
    fullName: item.serviceName,
    cost: item.monthlyCost
  }));

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-panel shadow-card">
      <div className="relative overflow-hidden bg-brand-header px-5 py-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white/10">
              <Coins className="h-5 w-5 text-tealSoft" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Step 3 · {providerName} estimate</div>
              <div className="mt-1 text-3xl font-extrabold text-white">{formatCurrency(estimate.totalMonthlyCost, estimate.currency)}</div>
              <p className="mt-1 max-w-md text-xs leading-5 text-slate-300">{quality?.summary ?? 'Only supported Azure VM compute pricing is included.'}</p>
            </div>
          </div>
          {quality ? (
            <InfoBadge
              label={`${qualityLabel(quality.status)} · ${quality.coveragePercent}% priced`}
              tooltip={qualityDescription(quality.status)}
              className={coverageBadgeClass(quality.coveragePercent)}
            />
          ) : null}
        </div>
      </div>

      <div className="p-5">
      {isPartial ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-5 text-amber-950">
          This is not a full platform estimate. The total includes only calculated line items below; excluded services are listed for review.
        </div>
      ) : quality?.status === 'complete' ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs leading-5 text-sky-950">
          Base estimate is complete for detected services. Some optional provider meters may still be excluded unless the prompt specifies them.
        </div>
      ) : null}

      {scopeNotes.length > 0 ? (
        <div className="mt-3.5 rounded-lg border border-line bg-slate-50 p-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-navy">Base estimate scope</h3>
          <ul className="mt-1.5 space-y-1 text-xs leading-5 text-slate-700">
            {scopeNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {chartData.length > 0 ? (
        <div className="mt-4 rounded-lg border border-line bg-white p-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-navy">Monthly cost by service</h3>
          <div className="mt-2 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#E2E8F2" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F2' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={48} />
                <ChartTooltip
                  cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                  formatter={(value: number) => formatCurrency(value, estimate.currency)}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                  contentStyle={{ borderRadius: 10, borderColor: '#E2E8F2', fontSize: 12 }}
                />
                <Bar dataKey="cost" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-navy">Calculated line items</h3>
        {estimate.calculatedLineItems.length === 0 ? (
          <p className="mt-1.5 text-xs text-slate-600">No calculated pricing line items.</p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-lg border border-line">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-xs">
              <thead className="bg-navy text-left text-[11px] font-semibold uppercase text-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Service</th>
                  <th className="px-3 py-2.5">SKU</th>
                  <th className="px-3 py-2.5">Qty x Hours</th>
                  <th className="px-3 py-2.5">Unit price</th>
                  <th className="px-3 py-2.5">Monthly</th>
                  <th className="px-3 py-2.5">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {estimate.calculatedLineItems.map((item, index) => (
                  <tr key={`${item.serviceName}-${item.skuName}-${item.meterName}`} className={index % 2 === 1 ? 'bg-slate-50/60' : undefined}>
                    <td className="px-3 py-2.5 font-medium text-navy">{item.serviceName}</td>
                    <td className="px-3 py-2.5">{item.skuName}</td>
                    <td className="px-3 py-2.5">
                      {item.usageLabel ?? `${item.quantity} x ${item.hours}`}
                    </td>
                    <td className="px-3 py-2.5">{formatCurrency(item.unitPrice, estimate.currency)}</td>
                    <td className="px-3 py-2.5 font-bold text-teal">{formatCurrency(item.monthlyCost, estimate.currency)}</td>
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
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-navy">Detected, price not ready</h3>
        <UnpricedItems items={estimate.notImplementedLineItems} emptyText="No services waiting for pricing support." />
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-navy">Missing required fields</h3>
        <UnpricedItems items={estimate.missingRequiredFieldLineItems} emptyText="No services are missing required pricing fields." />
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-navy">Need review or cannot price</h3>
        <UnpricedItems items={estimate.unsupportedLineItems} emptyText="No services need review here." />
      </div>

      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-5 text-amber-900">
        {usesEarlyProposal
          ? 'Estimate uses early proposal planning rates for this provider. Validate with the provider calculator or customer contract pricing before final quote.'
          : usesAwsPublicPricing
            ? 'Estimate uses AWS public on-demand pricing where implemented. Actual pricing may vary based on reservations, savings plans, taxes, region, and AWS calculator rounding.'
            : 'Estimate uses Azure public retail pricing where implemented. Actual pricing may vary based on enterprise agreements, reservations, savings plans, taxes, region, and Azure calculator rounding.'}
      </p>
      </div>
    </section>
  );
}

function providerLabel(provider: 'azure' | 'aws' | 'gcp'): string {
  const labels = {
    azure: 'Azure',
    aws: 'AWS',
    gcp: 'GCP'
  };
  return labels[provider];
}

function estimateScopeNotes(estimate: NaturalLanguageEstimateResponse): string[] {
  const scopePatterns = [/excluded/i, /only/i, /defaults/i, /actual pricing may vary/i];
  const notes = estimate.assumptions.filter((assumption) => scopePatterns.some((pattern) => pattern.test(assumption)));
  return [...new Set(notes)].slice(0, 8);
}

function qualityLabel(status: 'complete' | 'partial' | 'blocked'): string {
  if (status === 'complete') {
    return 'Complete';
  }
  if (status === 'partial') {
    return 'Partial';
  }
  return 'Blocked';
}

function qualityDescription(status: 'complete' | 'partial' | 'blocked'): string {
  if (status === 'complete') {
    return 'All detected services that the app can price are included.';
  }
  if (status === 'partial') {
    return 'Some services are priced, but some are missing or not ready.';
  }
  return 'No useful total yet. Add missing details or choose supported services.';
}

function UnpricedItems({
  items,
  emptyText
}: {
  items: Array<{ componentId: string; serviceName: string; reason: string; rawText?: string }>;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="mt-1.5 text-xs text-slate-600">{emptyText}</p>;
  }

  return (
    <div className="mt-2 grid gap-2">
      {items.map((item) => (
        <div key={item.componentId} className="rounded-lg border border-line bg-slate-50 p-3">
          <div className="font-semibold text-slate-900">{item.serviceName}</div>
          <div className="mt-0.5 text-slate-600">{item.reason}</div>
          {item.rawText ? <div className="mt-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-[11px] text-slate-600">{item.rawText}</div> : null}
        </div>
      ))}
    </div>
  );
}
