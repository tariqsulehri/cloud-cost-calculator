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

export function confidenceLabel(confidence: Confidence): string {
  const labels: Record<Confidence, string> = {
    high: 'High match',
    medium: 'Medium match',
    low: 'Low match'
  };
  return labels[confidence];
}

export function confidenceDescription(confidence: Confidence): string {
  const descriptions: Record<Confidence, string> = {
    high: 'The app found clear details. This item is likely correct.',
    medium: 'Some details are guessed or incomplete. Please check this item.',
    low: 'The app is not sure. Review this item before using the estimate.'
  };
  return descriptions[confidence];
}

export function pricingSourceLabel(source: PricingSource): string {
  return source === 'azure-retail-prices-api' ? 'Azure price' : 'Fallback';
}

export function pricingSourceDescription(source: PricingSource): string {
  return source === 'azure-retail-prices-api'
    ? 'Price came from the Azure public pricing API.'
    : 'The exact Azure price was not found. Review before using this cost.';
}

export function pricingSourceClass(source: PricingSource): string {
  return source === 'azure-retail-prices-api'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-slate-100 text-slate-700 border-slate-300';
}
