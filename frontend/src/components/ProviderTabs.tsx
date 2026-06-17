import { BadgeDollarSign, Cloud, CloudCog, GitCompareArrows } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { formatCurrency } from '../lib/format';
import { cn } from '../lib/utils';
import type { NaturalLanguageEstimateResponse, Provider } from '../types/estimate';

export type ProviderTabKey = Provider | 'compare';

const providers = [
  {
    key: 'azure',
    name: 'Azure',
    status: 'Live',
    note: 'Azure API pricing',
    iconClass: 'bg-brand-accent text-white shadow-glow',
    cardClass: 'border-azure/30 bg-blue-50/60',
    icon: CloudCog
  },
  {
    key: 'aws',
    name: 'AWS',
    status: 'Early',
    note: 'Proposal rate card',
    iconClass: 'bg-amber-100 text-aws',
    cardClass: 'border-line bg-white',
    icon: Cloud
  },
  {
    key: 'gcp',
    name: 'GCP',
    status: 'Early',
    note: 'Proposal rate card',
    iconClass: 'bg-emerald-100 text-gcp',
    cardClass: 'border-line bg-white',
    icon: Cloud
  },
  {
    key: 'compare',
    name: 'Compare',
    status: 'Compare',
    note: 'Side by side',
    iconClass: 'bg-violet/10 text-violet',
    cardClass: 'border-line bg-white',
    icon: GitCompareArrows
  }
];

interface ProviderTabsProps {
  selected: ProviderTabKey;
  estimates: Partial<Record<Provider, NaturalLanguageEstimateResponse>>;
  onSelect: (provider: ProviderTabKey) => void;
}

export function ProviderTabs({ selected, estimates, onSelect }: ProviderTabsProps) {
  return (
    <Card className="flex h-full flex-col justify-between gap-3 p-3">
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {providers.map((provider) => {
          const Icon = provider.icon;
          const isSelected = selected === provider.key;
          const estimate = provider.key === 'compare' ? null : estimates[provider.key as Provider];
          return (
            <button
              key={provider.key}
              type="button"
              onClick={() => onSelect(provider.key as ProviderTabKey)}
              className={cn(
                'group flex min-h-16 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition',
                provider.cardClass,
                isSelected ? 'ring-2 ring-azure/35 shadow-cardHover' : 'hover:-translate-y-0.5 hover:shadow-cardHover'
              )}
              title={provider.key === 'compare' ? 'Compare Azure, AWS, and GCP estimates.' : `${provider.name} estimate view.`}
            >
              <span className={cn('flex h-10 w-10 flex-none items-center justify-center rounded-lg', provider.iconClass)}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] font-bold text-navy">{provider.name}</span>
                  <Badge variant={provider.key === 'azure' ? 'active' : provider.key === 'compare' ? 'muted' : 'warning'} className="px-1.5 py-0 text-[10px]">
                    {estimate ? `${estimate.estimateQuality?.coveragePercent ?? 0}%` : provider.status}
                  </Badge>
                </span>
                <span className="mt-0.5 block text-[11px] font-medium leading-4 text-slate-600">
                  {estimate ? formatCurrency(estimate.totalMonthlyCost, estimate.currency) : provider.note}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-4 text-slate-600">
        <BadgeDollarSign className="h-3.5 w-3.5 flex-none text-azure" aria-hidden="true" />
        Azure uses public pricing where implemented. AWS and GCP use early proposal rates until live pricing adapters are added.
      </div>
    </Card>
  );
}
