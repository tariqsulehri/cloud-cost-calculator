export function LoadingState() {
  return (
    <section className="rounded-lg border border-line bg-panel p-6 shadow-card">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-100 border-t-azure" />
        <div>
          <h2 className="text-sm font-semibold text-navy">Building estimate</h2>
          <p className="mt-1 text-sm text-slate-600">Fetching Azure retail pricing and calculating monthly totals.</p>
        </div>
      </div>
    </section>
  );
}
