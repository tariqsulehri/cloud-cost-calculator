import { BadgeDollarSign, Cloud, CloudCog, GitCompareArrows } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

const providers = [
  {
    key: 'azure',
    name: 'Azure',
    status: 'Active',
    note: 'Pricing works now',
    className: 'border-azure bg-blue-50 text-azure',
    icon: CloudCog
  },
  {
    key: 'aws',
    name: 'AWS',
    status: 'Planned',
    note: 'Use mapping next',
    className: 'border-amber-200 bg-amber-50 text-aws',
    icon: Cloud
  },
  {
    key: 'gcp',
    name: 'GCP',
    status: 'Planned',
    note: 'Use mapping next',
    className: 'border-emerald-200 bg-emerald-50 text-gcp',
    icon: Cloud
  },
  {
    key: 'compare',
    name: 'Compare',
    status: 'Planned',
    note: 'Azure vs AWS vs GCP',
    className: 'border-violet/20 bg-violet/10 text-violet',
    icon: GitCompareArrows
  }
];

export function ProviderTabs() {
  return (
    <Card className="p-2">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {providers.map((provider) => {
          const Icon = provider.icon;
          const isActive = provider.key === 'azure';
          return (
            <button
              key={provider.key}
              type="button"
              disabled={!isActive}
              className={cn(
                'flex min-h-14 items-center gap-2 rounded-md border px-3 py-2 text-left transition disabled:cursor-not-allowed',
                isActive ? `${provider.className} shadow-sm hover:shadow-card` : `${provider.className} opacity-75`
              )}
              title={isActive ? 'Azure pricing is available now.' : `${provider.name} pricing is planned. It is not calculated yet.`}
            >
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-white/80 shadow-sm">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold">{provider.name}</span>
                  <Badge variant={isActive ? 'active' : 'muted'} className="border-white/60 bg-white/80 px-1.5 py-0 text-[10px]">
                    {provider.status}
                  </Badge>
                </span>
                <span className="mt-0.5 block text-[11px] font-medium leading-4 text-slate-700">{provider.note}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] leading-4 text-slate-700">
        <BadgeDollarSign className="h-3.5 w-3.5 flex-none text-azure" aria-hidden="true" />
        Current calculator total uses Azure only. AWS, GCP, and combined comparison will use the service mapping after pricing adapters are added.
      </div>
    </Card>
  );
}
