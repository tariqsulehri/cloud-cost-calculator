import { Calculator, ClipboardCheck, FileText } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { cn } from '../lib/utils';

interface ProcessRailProps {
  hasRequirements: boolean;
  hasEstimate: boolean;
}

const steps = [
  { key: 'describe', title: 'Describe', text: 'Paste cloud needs', icon: FileText },
  { key: 'review', title: 'Review', text: 'Check missing info', icon: ClipboardCheck },
  { key: 'estimate', title: 'Calculate', text: 'See Azure cost', icon: Calculator }
] as const;

export function ProcessRail({ hasRequirements, hasEstimate }: ProcessRailProps) {
  return (
    <Card className="flex h-full flex-col p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Workflow</div>
          <div className="text-[13px] font-bold text-navy">Requirement to estimate</div>
        </div>
        <Badge variant={hasEstimate ? 'success' : hasRequirements ? 'active' : 'muted'}>{hasEstimate ? 'Calculated' : hasRequirements ? 'Review' : 'Input'}</Badge>
      </div>
      <section className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isDone = step.key === 'describe' ? hasRequirements : step.key === 'review' ? hasEstimate : false;
          const isActive = step.key === 'describe' ? !hasRequirements : step.key === 'review' ? hasRequirements && !hasEstimate : hasEstimate;
          const status = isDone ? 'Done' : isActive ? 'Now' : 'Next';
          return (
            <div
              key={step.key}
              title={step.text}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition',
                isActive
                  ? 'border-azure/30 bg-blue-50/70 shadow-sm'
                  : isDone
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-line bg-slate-50/70'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 flex-none items-center justify-center rounded-lg shadow-sm',
                  isActive ? 'bg-brand-accent text-white shadow-glow' : isDone ? 'bg-success text-white' : 'bg-white text-slate-400 border border-line'
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[11px] font-bold text-navy">{step.title}</div>
                <span
                  className={cn(
                    'mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase',
                    isActive ? 'bg-azure/10 text-azure' : isDone ? 'bg-success/10 text-success' : 'bg-white text-slate-500'
                  )}
                >
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </section>
    </Card>
  );
}
