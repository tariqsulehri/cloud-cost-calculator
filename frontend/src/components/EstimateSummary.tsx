import { formatCurrency, pricingSourceLabel } from '../lib/format';
import type { NaturalLanguageEstimateResponse } from '../types/estimate';

interface EstimateSummaryProps {
  estimate: NaturalLanguageEstimateResponse;
}

export function EstimateSummary({ estimate }: EstimateSummaryProps) {
  const quality = estimate.estimateQuality;
  const isPartial = quality?.status === 'partial' || quality?.status === 'blocked';
  const scopeNotes = estimateScopeNotes(estimate);

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-navy">Step 3: Azure Estimate</h2>
          <p className="mt-1 text-sm text-slate-600">
            {quality?.summary ?? 'Only supported Azure VM compute pricing is included.'}
          </p>
        </div>
        {quality ? (
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${qualityBadgeClass(quality.status)}`}>
            {quality.status} · {quality.coveragePercent}% priced
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-4xl font-bold text-teal">{formatCurrency(estimate.totalMonthlyCost, estimate.currency)}</div>
      {isPartial ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          This is not a full platform estimate. The total includes only calculated line items below; excluded services are listed for review.
        </div>
      ) : quality?.status === 'complete' ? (
        <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
          Base estimate is complete for detected services. Some optional Azure meters may still be excluded unless the prompt specifies them.
        </div>
      ) : null}

      {scopeNotes.length > 0 ? (
        <div className="mt-5 rounded-lg border border-line bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-navy">Base estimate scope</h3>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
            {scopeNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-navy">Calculated line items</h3>
        {estimate.calculatedLineItems.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No calculated pricing line items.</p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-lg border border-line">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-navy text-left text-xs font-semibold uppercase text-slate-200">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Qty x Hours</th>
                  <th className="px-4 py-3">Unit price</th>
                  <th className="px-4 py-3">Monthly</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {estimate.calculatedLineItems.map((item) => (
                  <tr key={`${item.serviceName}-${item.skuName}-${item.meterName}`}>
                    <td className="px-4 py-3">{item.serviceName}</td>
                    <td className="px-4 py-3">{item.skuName}</td>
                    <td className="px-4 py-3">
                      {item.usageLabel ?? `${item.quantity} x ${item.hours}`}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(item.unitPrice, estimate.currency)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(item.monthlyCost, estimate.currency)}</td>
                    <td className="px-4 py-3">{pricingSourceLabel(item.pricingSource)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-navy">Detected but pricing not implemented yet</h3>
        <UnpricedItems items={estimate.notImplementedLineItems} emptyText="No not-implemented services detected." />
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-navy">Missing required fields</h3>
        <UnpricedItems items={estimate.missingRequiredFieldLineItems} emptyText="No services are missing required pricing fields." />
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-navy">Unsupported or needs review</h3>
        <UnpricedItems items={estimate.unsupportedLineItems} emptyText="No unsupported services detected." />
      </div>

      <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        Estimate uses Azure public retail pricing where implemented. Actual pricing may vary based on enterprise agreements,
        reservations, savings plans, taxes, region, and Azure calculator rounding.
      </p>
    </section>
  );
}

function estimateScopeNotes(estimate: NaturalLanguageEstimateResponse): string[] {
  const scopePatterns = [/excluded/i, /only/i, /defaults/i, /actual pricing may vary/i];
  const notes = estimate.assumptions.filter((assumption) => scopePatterns.some((pattern) => pattern.test(assumption)));
  return [...new Set(notes)].slice(0, 8);
}

function qualityBadgeClass(status: 'complete' | 'partial' | 'blocked'): string {
  if (status === 'complete') {
    return 'border-emerald-200 bg-emerald-50 text-success';
  }
  if (status === 'partial') {
    return 'border-amber-200 bg-amber-50 text-warning';
  }
  return 'border-red-200 bg-red-50 text-danger';
}

function UnpricedItems({
  items,
  emptyText
}: {
  items: Array<{ componentId: string; serviceName: string; reason: string; rawText?: string }>;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-slate-600">{emptyText}</p>;
  }

  return (
    <div className="mt-2 grid gap-2">
      {items.map((item) => (
        <div key={item.componentId} className="rounded-lg border border-line bg-slate-50 p-3 text-sm">
          <div className="font-semibold text-slate-900">{item.serviceName}</div>
          <div className="mt-1 text-slate-600">{item.reason}</div>
          {item.rawText ? <div className="mt-2 rounded-md border border-line bg-white px-3 py-2 text-xs text-slate-600">{item.rawText}</div> : null}
        </div>
      ))}
    </div>
  );
}
