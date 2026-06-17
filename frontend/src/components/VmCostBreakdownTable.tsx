import {
  confidenceClass,
  confidenceDescription,
  confidenceLabel,
  formatCurrency,
  pricingSourceClass,
  pricingSourceDescription,
  pricingSourceLabel
} from '../lib/format';
import { InfoBadge } from './InfoBadge';
import type { EstimateLineItem } from '../types/estimate';

interface VmCostBreakdownTableProps {
  lineItems: EstimateLineItem[];
  currency: string;
}

export function VmCostBreakdownTable({ lineItems, currency }: VmCostBreakdownTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">VM cost breakdown</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Service</th>
              <th className="px-5 py-3">Instance</th>
              <th className="px-5 py-3">Meter</th>
              <th className="px-5 py-3 text-right">Quantity</th>
              <th className="px-5 py-3 text-right">Hours</th>
              <th className="px-5 py-3 text-right">Unit price</th>
              <th className="px-5 py-3 text-right">Monthly</th>
              <th className="px-5 py-3">Confidence</th>
              <th className="px-5 py-3">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lineItems.map((item) => (
              <tr key={`${item.serviceName}-${item.skuName}-${item.meterName}`} className="align-top">
                <td className="px-5 py-4 font-medium text-slate-950">{item.serviceName}</td>
                <td className="px-5 py-4 text-slate-700">{item.skuName}</td>
                <td className="px-5 py-4 text-slate-700">
                  <div>{item.meterName}</div>
                  <div className="mt-1 text-xs text-slate-500">Raw SKU: {item.rawSkuName ?? 'n/a'}</div>
                </td>
                <td className="px-5 py-4 text-right text-slate-700">{item.quantity}</td>
                <td className="px-5 py-4 text-right text-slate-700">{item.hours.toLocaleString()}</td>
                <td className="px-5 py-4 text-right text-slate-700">{formatCurrency(item.unitPrice, currency)}</td>
                <td className="px-5 py-4 text-right font-semibold text-slate-950">{formatCurrency(item.monthlyCost, currency)}</td>
                <td className="px-5 py-4">
                  <InfoBadge label={confidenceLabel(item.confidence)} tooltip={confidenceDescription(item.confidence)} className={confidenceClass(item.confidence)} align="left" />
                </td>
                <td className="px-5 py-4">
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
    </section>
  );
}
