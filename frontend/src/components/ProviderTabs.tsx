import { BadgeDollarSign, BookOpenText, Cloud, CloudCog, GitCompareArrows } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { coverageBadgeVariant } from '../lib/coverageBadge';
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
    logoSrc: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
    iconClass: 'bg-blue-700 text-white shadow-glow',
    cardClass: 'border-blue-300 bg-blue-50/80',
    selectedClass: 'ring-2 ring-blue-400/50 shadow-cardHover',
    icon: CloudCog
  },
  {
    key: 'aws',
    name: 'AWS',
    status: 'Public',
    note: 'Public EC2 prices',
    logoSrc: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
    iconClass: 'bg-amber-100 text-amber-700',
    cardClass: 'border-amber-300 bg-amber-50/80',
    selectedClass: 'ring-2 ring-amber-400/50 shadow-cardHover',
    icon: Cloud
  },
  {
    key: 'gcp',
    name: 'GCP',
    status: 'Early',
    note: 'Proposal rate card',
    logoSrc: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg',
    iconClass: 'bg-emerald-100 text-emerald-700',
    cardClass: 'border-emerald-300 bg-emerald-50/80',
    selectedClass: 'ring-2 ring-emerald-400/50 shadow-cardHover',
    icon: Cloud
  },
  {
    key: 'compare',
    name: 'Compare',
    status: 'Compare',
    note: 'Side by side',
    iconClass: 'bg-violet/10 text-violet',
    cardClass: 'border-violet/30 bg-violet/5',
    selectedClass: 'ring-2 ring-violet/35 shadow-cardHover',
    icon: GitCompareArrows
  }
];

interface ProviderTabsProps {
  selected: ProviderTabKey;
  baseProvider: Provider;
  estimates: Partial<Record<Provider, NaturalLanguageEstimateResponse>>;
  onSelect: (provider: ProviderTabKey) => void;
  onOpenDocs: () => void;
}

export function ProviderTabs({ selected, baseProvider, estimates, onSelect, onOpenDocs }: ProviderTabsProps) {
  return (
    <Card className="flex h-full flex-col justify-between gap-2.5 p-3">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {providers.map((provider) => {
          const Icon = provider.icon;
          const isSelected = selected === provider.key;
          const estimate = provider.key === 'compare' ? null : estimates[provider.key as Provider];
          const coveragePercent = estimate?.estimateQuality?.coveragePercent ?? 0;
          return (
            <button
              key={provider.key}
              type="button"
              onClick={() => onSelect(provider.key as ProviderTabKey)}
              className={cn(
                'group flex min-h-[56px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition',
                provider.cardClass,
                isSelected ? provider.selectedClass : 'hover:-translate-y-0.5 hover:shadow-cardHover'
              )}
              title={provider.key === 'compare' ? 'Compare Azure, AWS, and GCP estimates.' : `${provider.name} estimate view.`}
            >
              <span className={cn('flex h-9 w-9 flex-none items-center justify-center rounded-lg', provider.iconClass)}>
                {'logoSrc' in provider ? <img src={provider.logoSrc} alt="" className="h-5 w-5 object-contain" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] font-bold text-navy">{provider.name}</span>
                  <Badge
                    variant={estimate ? coverageBadgeVariant(coveragePercent) : provider.key === 'azure' ? 'active' : provider.key === 'compare' ? 'muted' : 'warning'}
                    className="px-1.5 py-0 text-[10px]"
                  >
                    {estimate ? `${coveragePercent}%` : provider.status}
                  </Badge>
                </span>
                <span className="mt-0.5 block text-[11px] font-medium leading-4 text-slate-600">
                  {estimate ? formatCurrency(estimate.totalMonthlyCost, estimate.currency) : provider.note}
                </span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenDocs}
          className="group flex min-h-[56px] items-center gap-2.5 rounded-xl border border-sky-300 bg-sky-50/80 px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-cardHover"
          title="Open documentation, badge meanings, and operating guide."
          aria-label="Open documentation guide"
        >
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <BookOpenText className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] font-bold text-navy">Docs</span>
              <Badge variant="active" className="px-1.5 py-0 text-[10px]">
                Guide
              </Badge>
            </span>
            <span className="mt-0.5 block text-[11px] font-medium leading-4 text-slate-600">Guidelines</span>
          </span>
        </button>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-4 text-slate-600">
        <BadgeDollarSign className="h-3.5 w-3.5 flex-none text-azure" aria-hidden="true" />
        Base cloud: {providerLabel(baseProvider)}. Compare maps this base design to the other clouds before pricing.
      </div>
    </Card>
  );
}

function providerLabel(provider: Provider): string {
  const labels: Record<Provider, string> = {
    azure: 'Azure',
    aws: 'AWS',
    gcp: 'GCP'
  };
  return labels[provider];
}
