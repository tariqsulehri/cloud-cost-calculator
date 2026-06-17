interface ClarifyingQuestionsPanelProps {
  questions: string[];
  onAnswer: (question: string, clarification: string) => void;
}

const clarificationOptions: Record<string, Array<{ label: string; clarification: string }>> = {
  'Should PostgreSQL be highly available?': [
    { label: 'Yes, highly available', clarification: 'PostgreSQL high availability: yes.' },
    { label: 'No, single-zone', clarification: 'PostgreSQL high availability: no.' }
  ],
  'Should Redis be basic/dev or production-grade?': [
    { label: 'Production-grade', clarification: 'Redis tier: production.' },
    { label: 'Basic / dev', clarification: 'Redis tier: basic.' }
  ],
  'Is the load balancer HTTP/S or TCP?': [
    { label: 'HTTP/S', clarification: 'Load balancer type: HTTP/S.' },
    { label: 'TCP', clarification: 'Load balancer type: TCP.' }
  ]
};

export function ClarifyingQuestionsPanel({ questions, onAnswer }: ClarifyingQuestionsPanelProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-3 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase text-amber-950">Clarifying questions</h2>
          <p className="mt-0.5 text-xs text-amber-900">Select answers one by one. Each answer is added to the prompt.</p>
        </div>
        <span className="rounded-md border border-amber-200 bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-amber-900">{questions.length} open</span>
      </div>
      <ul className="mt-2 space-y-2 text-xs text-amber-900">
        {questions.map((question) => (
          <li key={question} className="rounded-md border border-amber-200 bg-white/90 p-2.5 shadow-sm">
            <div className="font-semibold text-amber-950">{question}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(clarificationOptions[question] ?? []).map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => onAnswer(question, option.clarification)}
                  className="inline-flex h-8 items-center rounded-md border border-amber-200 bg-white px-2.5 text-[11px] font-semibold text-amber-950 transition hover:border-amber-300 hover:bg-amber-100"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
