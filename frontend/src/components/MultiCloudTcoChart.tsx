import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../lib/format';
import type { NaturalLanguageEstimateResponse, Provider } from '../types/estimate';

interface MultiCloudTcoChartProps {
  estimates: Partial<Record<Provider, NaturalLanguageEstimateResponse>>;
}

const providerColors: Record<Provider, string> = {
  azure: '#1d4ed8',
  aws: '#d97706',
  gcp: '#059669'
};

const providerLabels: Record<Provider, string> = {
  azure: 'Azure',
  aws: 'AWS',
  gcp: 'GCP'
};

export function MultiCloudTcoChart({ estimates }: MultiCloudTcoChartProps) {
  const [expanded, setExpanded] = useState(false);
  const providers: Provider[] = ['azure', 'aws', 'gcp'];
  const activeEstimates = providers.map((p) => ({ provider: p, est: estimates[p] })).filter((item) => Boolean(item.est));

  if (activeEstimates.length === 0) return null;

  // Compact bar comparison
  const comparisonBarData = activeEstimates.map(({ provider, est }) => {
    const monthly = est!.totalMonthlyCost;
    return {
      name: providerLabels[provider],
      OnDemand: Math.round(monthly),
      '1Yr Plan': Math.round(monthly * 0.7),
      '3Yr Plan': Math.round(monthly * 0.5)
    };
  });

  // Compact 36-month timeline
  const tcoTimelineData = [1, 6, 12, 18, 24, 30, 36].map((month) => {
    const point: Record<string, number> = { month };
    for (const { provider, est } of activeEstimates) {
      const monthly = est!.totalMonthlyCost;
      point[providerLabels[provider]] = Math.round((monthly * 0.5 * month) / 1000);
    }
    return point;
  });

  return (
    <div className="rounded-xl border border-line bg-white shadow-sm overflow-hidden transition">
      {/* Smart Collapsible Header Toggle */}
      <button
        type="button"
        onClick={() => setExpanded((curr) => !curr)}
        className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-xs font-bold">
            📊
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-navy">
            Visual Analytics & 3-Yr TCO Projection Charts
          </span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
            {expanded ? 'Expanded' : 'Compact View'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-azure">
          <span>{expanded ? 'Hide Charts' : 'Show Smart Charts'}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded Smart Compact Charts Grid */}
      {expanded ? (
        <div className="grid gap-4 p-4 lg:grid-cols-2 border-t border-lineSoft bg-slate-50/40">
          {/* Chart 1: Mini Provider Comparison */}
          <div className="rounded-lg border border-line bg-white p-3.5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Monthly Spend Comparison</h4>
              <span className="text-[10px] text-muted">On-Demand vs Committed</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonBarData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, 'USD')} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                  <Bar dataKey="OnDemand" fill="#1e293b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="1Yr Plan" fill="#0284c7" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="3Yr Plan" fill="#059669" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Mini 36-Month Cumulative TCO */}
          <div className="rounded-lg border border-line bg-white p-3.5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-bold text-navy uppercase tracking-wider">3-Year Cumulative TCO ($k)</h4>
              <span className="text-[10px] text-muted">Month 1 to 36</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tcoTimelineData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} unit="m" />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}k`} />
                  <Tooltip formatter={(value: number) => `$${value}k`} labelFormatter={(m) => `Month ${m}`} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                  {activeEstimates.map(({ provider }) => (
                    <Line
                      key={provider}
                      type="monotone"
                      dataKey={providerLabels[provider]}
                      stroke={providerColors[provider]}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
