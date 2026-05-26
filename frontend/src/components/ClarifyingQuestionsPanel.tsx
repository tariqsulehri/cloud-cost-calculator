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
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-amber-950">Clarifying questions</h2>
          <p className="mt-1 text-sm text-amber-900">Select answers one by one. Each answer is added to your prompt for the next extraction.</p>
        </div>
        <span className="rounded-full border border-amber-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-amber-900">{questions.length} open</span>
      </div>
      <ul className="mt-4 space-y-3 text-sm text-amber-900">
        {questions.map((question) => (
          <li key={question} className="rounded-lg border border-amber-200 bg-white/90 p-3 shadow-sm">
            <div className="font-semibold text-amber-950">{question}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(clarificationOptions[question] ?? []).map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => onAnswer(question, option.clarification)}
                  className="inline-flex h-9 items-center rounded-lg border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-950 transition hover:border-amber-300 hover:bg-amber-100"
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
