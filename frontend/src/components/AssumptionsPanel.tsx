interface AssumptionsPanelProps {
  assumptions: string[];
}

export function AssumptionsPanel({ assumptions }: AssumptionsPanelProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-card">
      <h2 className="text-base font-semibold text-navy">Pricing assumptions</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {assumptions.map((assumption) => (
          <li key={assumption} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-teal" />
            <span>{assumption}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
