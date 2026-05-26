import type { Confidence, PricingSource } from '../types/estimate';

export function formatCurrency(value: number, currency = 'USD'): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency
  });
}

export function confidenceClass(confidence: Confidence): string {
  const styles: Record<Confidence, string> = {
    high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
    low: 'bg-red-50 text-red-700 border-red-200'
  };
  return styles[confidence];
}

export function pricingSourceLabel(source: PricingSource): string {
  return source === 'azure-retail-prices-api' ? 'Azure Retail Prices API' : 'Fallback';
}

export function pricingSourceClass(source: PricingSource): string {
  return source === 'azure-retail-prices-api'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-slate-100 text-slate-700 border-slate-300';
}
