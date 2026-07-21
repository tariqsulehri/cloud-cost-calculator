import { CheckCircle2, Download, FileText, X } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import type { NaturalLanguageEstimateResponse, Provider } from '../types/estimate';

interface CalculationCompletedModalProps {
  isOpen: boolean;
  estimate: NaturalLanguageEstimateResponse | null;
  provider: Provider;
  onClose: () => void;
  onViewDetails: () => void;
  onExportProposal: () => void;
}

const providerLabels: Record<Provider, string> = {
  azure: 'Azure',
  aws: 'AWS',
  gcp: 'GCP'
};

export function CalculationCompletedModal({
  isOpen,
  estimate,
  provider,
  onClose,
  onViewDetails,
  onExportProposal
}: CalculationCompletedModalProps) {
  if (!isOpen || !estimate) return null;

  const monthlyCost = estimate.totalMonthlyCost;
  const annualCost = monthlyCost * 12;
  const quality = estimate.estimateQuality;
  const pricedCount = quality?.pricedComponentCount ?? estimate.calculatedLineItems.length;
  const totalCount = quality?.totalComponentCount ?? estimate.calculatedLineItems.length;
  const coveragePercent = quality?.coveragePercent ?? 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-command">
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/20 shadow-inner">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Price Calculation Completed</h2>
              <p className="text-xs text-emerald-100">
                {providerLabels[provider]} estimate calculated for {estimate.region}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Main Price Card */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Calculated Monthly Total</div>
            <div className="mt-1 text-3xl font-extrabold text-navy">
              {formatCurrency(monthlyCost, estimate.currency)}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-600">
              Estimated Annual Cost: <span className="font-bold text-navy">{formatCurrency(annualCost, estimate.currency)}</span>
            </div>
          </div>

          {/* Coverage & Priced Breakdown */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-line bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-muted">Priced Coverage</div>
              <div className="mt-0.5 text-base font-extrabold text-navy">{coveragePercent}%</div>
              <div className="mt-0.5 text-[11px] text-muted">
                {pricedCount} of {totalCount} component(s) priced
              </div>
            </div>
            <div className="rounded-lg border border-line bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-muted">Pricing Confidence</div>
              <div className="mt-0.5 text-base font-extrabold capitalize text-navy">{estimate.confidence}</div>
              <div className="mt-0.5 text-[11px] text-muted">Based on live public meters</div>
            </div>
          </div>

          {/* Assumptions Brief */}
          {estimate.assumptions.length > 0 && (
            <div className="mt-4 rounded-lg border border-lineSoft bg-slate-50 px-3.5 py-2.5 text-[11px] leading-4 text-muted">
              <span className="font-bold text-navy">Key Note: </span>
              {estimate.assumptions[0]}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-lineSoft bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewDetails();
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-xs font-bold text-navy shadow-sm transition hover:bg-slate-100"
          >
            View Full Details
          </button>

          <button
            type="button"
            onClick={() => {
              onExportProposal();
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-purple-600 bg-purple-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700"
          >
            <FileText className="h-4 w-4" />
            Export Proposal (.md)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-navy px-4 text-xs font-bold text-white shadow-sm transition hover:bg-navy/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
