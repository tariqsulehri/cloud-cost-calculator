import { confidenceClass, formatCurrency, pricingSourceClass, pricingSourceLabel } from '../lib/format';
import type { EstimateResponse } from '../types/estimate';

interface VmCostSummaryProps {
  estimate: EstimateResponse;
}

export function VmCostSummary({ estimate }: VmCostSummaryProps) {
  const item = estimate.lineItems[0];
  const annualCost = item.monthlyCost * 12;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-azure">Azure</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${confidenceClass(estimate.confidence)}`}>
              {estimate.confidence} confidence
            </span>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">Virtual Machines</h2>
          <p className="mt-1 text-sm text-slate-600">
            {item.quantity} {item.skuName} x {item.hours.toLocaleString()} Hours
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${pricingSourceClass(item.pricingSource)}`}>
          {pricingSourceLabel(item.pricingSource)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Metric label="Upfront" value={formatCurrency(0, estimate.currency)} />
        <Metric label="Unit price / hour" value={formatCurrency(item.unitPrice, estimate.currency)} />
        <Metric label="Monthly" value={formatCurrency(item.monthlyCost, estimate.currency)} emphasized />
        <Metric label="Annual" value={formatCurrency(annualCost, estimate.currency)} />
      </div>

      <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        Estimate uses Azure public retail pay-as-you-go VM pricing from Azure Retail Prices API. Actual pricing may vary based on
        enterprise agreements, reservations, savings plans, taxes, region, and Azure calculator rounding.
      </p>
    </section>
  );
}

function Metric({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className={`mt-2 font-semibold ${emphasized ? 'text-2xl text-slate-950' : 'text-lg text-slate-900'}`}>{value}</div>
    </div>
  );
}
