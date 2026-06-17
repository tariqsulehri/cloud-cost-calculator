import { Calculator, ClipboardCheck, FileText } from 'lucide-react';

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
    <section className="grid gap-2 rounded-md border border-line bg-white p-2 shadow-card sm:grid-cols-3 xl:grid-cols-1">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isDone = step.key === 'describe' ? hasRequirements : step.key === 'review' ? hasEstimate : false;
        const isActive = step.key === 'describe' ? !hasRequirements : step.key === 'review' ? hasRequirements && !hasEstimate : hasEstimate;
        return (
          <div
            key={step.key}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
              isActive
                ? 'border-azure bg-blue-50 text-azure'
                : isDone
                  ? 'border-emerald-200 bg-emerald-50 text-success'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-white shadow-sm">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Step {index + 1}</div>
              <div className="text-xs font-bold text-navy">{step.title}</div>
              <div className="text-[11px] leading-4 text-slate-600">{step.text}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
