import { Bot, SendHorizonal } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { NaturalLanguageEstimateResponse, NormalizedInfrastructureRequirement } from '../types/estimate';

interface AiHelpTabProps {
  requirements: NormalizedInfrastructureRequirement | null;
  estimate: NaturalLanguageEstimateResponse | null;
}

const sampleQuestions = [
  'What is missing before I calculate?',
  'Which services are not priced?',
  'Explain this estimate for a client.',
  'Can I compare AWS and GCP now?'
];

export function AiHelpTab({ requirements, estimate }: AiHelpTabProps) {
  const [question, setQuestion] = useState(sampleQuestions[0]);
  const answer = useMemo(() => answerQuestion(question, requirements, estimate), [question, requirements, estimate]);

  return (
    <section className="rounded-md border border-line bg-white shadow-card">
      <div className="border-b border-line bg-slate-50 px-4 py-3">
        <div className="dashboard-kicker text-violet">
          <Bot className="h-3.5 w-3.5" aria-hidden="true" />
          AI help preview
        </div>
        <h2 className="mt-2 text-base font-semibold text-navy">Ask about the estimate</h2>
        <p className="mt-0.5 max-w-3xl text-xs leading-5 text-muted">
          This first version gives safe answers from the current review and estimate. Full AI chat can be connected later. It will not invent prices.
        </p>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-md border border-line bg-slate-50 p-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-graphite">Question</span>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
              className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-xs leading-5 text-ink outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/15"
            />
          </label>
          <button
            type="button"
            onClick={() => setQuestion(question.trim() || sampleQuestions[0])}
            className="mt-2 inline-flex h-9 items-center gap-2 rounded-md bg-violet px-3 text-xs font-semibold text-white transition hover:bg-plum"
          >
            <SendHorizonal className="h-4 w-4" aria-hidden="true" />
            Draft answer
          </button>

          <div className="mt-3 rounded-md border border-violet/20 bg-white p-3">
            <h3 className="text-xs font-semibold uppercase text-navy">Answer</h3>
            <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-slate-700">{answer}</p>
          </div>
        </div>

        <aside className="rounded-md border border-line bg-white p-3">
          <h3 className="text-xs font-semibold uppercase text-navy">Quick questions</h3>
          <div className="mt-2 grid gap-1.5">
            {sampleQuestions.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setQuestion(sample)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-[11px] font-semibold leading-4 text-graphite transition hover:border-violet/30 hover:bg-violet/5 hover:text-violet"
              >
                {sample}
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-amber-950">
            Future AI chat should use requirements, mapping, estimate lines, assumptions, and documentation. It should never create a price that is not calculated.
          </div>
        </aside>
      </div>
    </section>
  );
}

function answerQuestion(question: string, requirements: NormalizedInfrastructureRequirement | null, estimate: NaturalLanguageEstimateResponse | null): string {
  const text = question.toLowerCase();
  const missingCount = requirements?.components.reduce((sum, component) => sum + component.missingFields.length, 0) ?? 0;
  const notPricedCount =
    (estimate?.notImplementedLineItems.length ?? 0) + (estimate?.unsupportedLineItems.length ?? 0) + (estimate?.missingRequiredFieldLineItems.length ?? 0);

  if (!requirements) {
    return 'Start with the Describe step. Click Find services first, then I can explain missing fields, mapped services, and estimate status.';
  }

  if (text.includes('missing')) {
    if (missingCount === 0) {
      return 'No missing fields are detected in the current review. You can calculate the Azure cost if at least one supported pricing service is ready.';
    }
    const missing = requirements.components
      .filter((component) => component.missingFields.length > 0)
      .map((component) => `${component.name}: ${component.missingFields.join(', ')}`)
      .join('\n');
    return `These fields need input before a better estimate:\n${missing}`;
  }

  if (text.includes('not priced') || text.includes('not price') || text.includes('price')) {
    if (!estimate) {
      return "No estimate is calculated yet. In review, services marked Price not ready or Can't price will not be included in the Azure total.";
    }
    if (notPricedCount === 0) {
      return 'The current estimate has no unpriced items listed. Still review assumptions because optional Azure meters may be excluded.';
    }
    return `There are ${notPricedCount} item(s) not included in the total. Check the sections named Detected, price not ready, Missing required fields, and Need review or cannot price.`;
  }

  if (text.includes('client') || text.includes('explain')) {
    const total = estimate ? `${estimate.currency} ${estimate.totalMonthlyCost.toLocaleString()}` : 'not calculated yet';
    return `Client summary:\nThis is an early proposal estimate using public Azure pricing. Current monthly total is ${total}. It is not a final bill. Services without pricing are shown separately, and client discounts are not included.`;
  }

  if (text.includes('aws') || text.includes('gcp') || text.includes('compare')) {
    return 'AWS, GCP, and Compare tabs are planned. Today the app can show service mapping for Azure, AWS, and GCP, but only Azure cost calculation is active.';
  }

  return 'I can help explain missing details, unpriced services, client summary, and AWS/GCP status. Full AI chat can be added later with guardrails.';
}
