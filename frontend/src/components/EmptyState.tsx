import { CloudCog } from 'lucide-react';

export function EmptyState() {
  return (
    <section className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <div>
        <CloudCog className="mx-auto h-10 w-10 text-azure" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">Ready for an Azure estimate</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          Choose an Azure VM region, instance, quantity, and hours to generate a pay-as-you-go compute estimate.
        </p>
      </div>
    </section>
  );
}
