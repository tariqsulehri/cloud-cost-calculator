interface AssumptionsPanelProps {
  assumptions: string[];
}

export function AssumptionsPanel({ assumptions }: AssumptionsPanelProps) {
  return (
    <section className="rounded-md border border-line bg-panel p-3 shadow-card">
      <h2 className="text-xs font-semibold uppercase text-navy">Pricing assumptions</h2>
      <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-700">
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
