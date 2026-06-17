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
    <Card className="p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase text-muted">Workflow</div>
          <div className="text-xs font-bold text-navy">Requirement to estimate</div>
        </div>
        <Badge variant={hasEstimate ? 'success' : hasRequirements ? 'active' : 'muted'}>{hasEstimate ? 'Calculated' : hasRequirements ? 'Review' : 'Input'}</Badge>
      </div>
      <section className="grid gap-1.5 sm:grid-cols-3 xl:grid-cols-1">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isDone = step.key === 'describe' ? hasRequirements : step.key === 'review' ? hasEstimate : false;
        const isActive = step.key === 'describe' ? !hasRequirements : step.key === 'review' ? hasRequirements && !hasEstimate : hasEstimate;
        const status = isDone ? 'Done' : isActive ? 'Now' : 'Next';
        return (
          <div
            key={step.key}
            className={cn(
              'relative flex items-center gap-2 rounded-md border px-2.5 py-2',
              isActive
                ? 'border-blue-200 bg-blue-50/80 text-azure'
                : isDone
                  ? 'border-emerald-200 bg-emerald-50/80 text-success'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
            )}
          >
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-white shadow-sm">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-bold uppercase text-slate-500">Step {index + 1}</div>
                <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-bold">{status}</span>
              </div>
              <div className="truncate text-xs font-bold text-navy">{step.title}</div>
              <div className="truncate text-[11px] leading-4 text-slate-600">{step.text}</div>
            </div>
          </div>
        );
      })}
      </section>
    </Card>
  );
}
