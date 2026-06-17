export function LoadingState() {
  return (
    <section className="rounded-xl border border-line bg-panel p-6 shadow-card">
      <div className="flex items-center gap-3.5">
        <div className="h-9 w-9 flex-none animate-spin rounded-full border-[3px] border-blue-100 border-t-azure" />
        <div>
          <h2 className="text-sm font-bold text-navy">Building estimate</h2>
          <p className="mt-1 text-sm text-slate-600">Fetching Azure retail pricing and calculating monthly totals.</p>
        </div>
      </div>
    </section>
  );
}
