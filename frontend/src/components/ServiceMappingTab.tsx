import { Search, ServerCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage, searchCatalogServices } from '../lib/api';
import type { CatalogService } from '../types/estimate';

const providerLabels: Record<CatalogService['providerId'], string> = {
  azure: 'Azure',
  aws: 'AWS',
  gcp: 'GCP'
};

const providerClass: Record<CatalogService['providerId'], string> = {
  azure: 'border-blue-200 bg-blue-50 text-azure',
  aws: 'border-amber-200 bg-amber-50 text-aws',
  gcp: 'border-emerald-200 bg-emerald-50 text-gcp'
};

export function ServiceMappingTab() {
  const [query, setQuery] = useState('redis');
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    searchCatalogServices(query)
      .then((result) => {
        if (!cancelled) {
          setServices(result);
        }
      })
      .catch((catalogError) => {
        if (!cancelled) {
          setServices([]);
          setError(getApiErrorMessage(catalogError));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const groupedServices = useMemo(() => groupServices(services), [services]);

  return (
    <section className="rounded-lg border border-line bg-white shadow-card">
      <div className="border-b border-line bg-slate-50 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet/20 bg-white px-2.5 py-1 text-xs font-semibold text-violet shadow-sm">
              <ServerCog className="h-3.5 w-3.5" aria-hidden="true" />
              Multi-cloud mapping
            </div>
            <h2 className="mt-3 text-lg font-semibold text-navy">Find equivalent cloud services</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
              Search a service need like Redis, VM, Kubernetes, PostgreSQL, storage, or load balancer. The app shows the mapped Azure, AWS, and GCP service names.
            </p>
          </div>
        </div>
        <label className="mt-4 block max-w-xl">
          <span className="text-sm font-semibold text-graphite">Search service</span>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try Redis, VM, PostgreSQL, Kubernetes"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-azure focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </label>
      </div>

      <div className="p-5">
        {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{error}</div> : null}
        {loading ? <div className="rounded-lg border border-line bg-slate-50 px-4 py-3 text-sm text-muted">Loading mapping...</div> : null}
        {!loading && groupedServices.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-slate-50 px-4 py-8 text-center text-sm text-muted">No service mapping found. Try a different word.</div>
        ) : null}
        <div className="grid gap-4">
          {groupedServices.map((group) => (
            <article key={group.serviceKey} className="rounded-lg border border-line bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-navy">{humanizeServiceKey(group.serviceKey)}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted">Requirement type: {group.componentType.replace(/_/g, ' ')}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-graphite">
                  {group.rows.length}/3 providers mapped
                </span>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {(['azure', 'aws', 'gcp'] as const).map((provider) => {
                  const row = group.byProvider[provider];
                  return (
                    <div key={provider} className={`rounded-lg border p-3 ${providerClass[provider]}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide">{providerLabels[provider]}</span>
                        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">{provider === 'azure' ? 'Pricing active' : 'Mapping only'}</span>
                      </div>
                      <div className="mt-2 text-sm font-bold text-navy">{row?.canonicalName ?? 'Not mapped yet'}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-700">{row?.pricingServiceName ? `Pricing name: ${row.pricingServiceName}` : 'Pricing adapter planned.'}</div>
                      {row?.requiredFields?.length ? <div className="mt-2 text-xs leading-5 text-slate-700">Needs: {row.requiredFields.join(', ')}</div> : null}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function groupServices(services: CatalogService[]) {
  const grouped = new Map<
    string,
    {
      serviceKey: string;
      componentType: CatalogService['componentType'];
      rows: CatalogService[];
      byProvider: Partial<Record<CatalogService['providerId'], CatalogService>>;
    }
  >();

  services.forEach((service) => {
    const current =
      grouped.get(service.serviceKey) ??
      {
        serviceKey: service.serviceKey,
        componentType: service.componentType,
        rows: [],
        byProvider: {}
      };
    current.rows.push(service);
    current.byProvider[service.providerId] = service;
    grouped.set(service.serviceKey, current);
  });

  return [...grouped.values()];
}

function humanizeServiceKey(serviceKey: string): string {
  return serviceKey
    .split(/[._]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
