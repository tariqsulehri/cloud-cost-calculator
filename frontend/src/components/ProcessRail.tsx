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
    <section className="grid gap-3 rounded-lg border border-line bg-white p-3 shadow-card md:grid-cols-3">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isDone = step.key === 'describe' ? hasRequirements : step.key === 'review' ? hasEstimate : false;
        const isActive = step.key === 'describe' ? !hasRequirements : step.key === 'review' ? hasRequirements && !hasEstimate : hasEstimate;
        return (
          <div
            key={step.key}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
              isActive
                ? 'border-azure bg-blue-50 text-azure'
                : isDone
                  ? 'border-emerald-200 bg-emerald-50 text-success'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-white shadow-sm">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide">Step {index + 1}</div>
              <div className="text-sm font-bold text-navy">{step.title}</div>
              <div className="text-xs leading-5 text-slate-600">{step.text}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
