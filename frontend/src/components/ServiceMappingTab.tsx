import { Check, Search, ServerCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage, searchCatalogServices } from '../lib/api';
import type { CatalogService } from '../types/estimate';

type ProviderId = CatalogService['providerId'];

const providers: ProviderId[] = ['azure', 'aws', 'gcp'];

const providerLabels: Record<ProviderId, string> = {
  azure: 'Azure',
  aws: 'AWS',
  gcp: 'GCP'
};

const providerClass: Record<ProviderId, string> = {
  azure: 'border-blue-200 bg-blue-50 text-azure',
  aws: 'border-amber-200 bg-amber-50 text-aws',
  gcp: 'border-emerald-200 bg-emerald-50 text-gcp'
};

export function ServiceMappingTab() {
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('aws');
  const [serviceSearch, setServiceSearch] = useState('');
  const [providerServices, setProviderServices] = useState<CatalogService[]>([]);
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null);
  const [equivalentServices, setEquivalentServices] = useState<CatalogService[]>([]);
  const [loadingProviderServices, setLoadingProviderServices] = useState(false);
  const [loadingEquivalents, setLoadingEquivalents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingProviderServices(true);
    setError(null);

    searchCatalogServices(serviceSearch, { provider: selectedProvider })
      .then((result) => {
        if (!cancelled) {
          setProviderServices(result);
        }
      })
      .catch((catalogError) => {
        if (!cancelled) {
          setProviderServices([]);
          setError(getApiErrorMessage(catalogError));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProviderServices(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProvider, serviceSearch]);

  useEffect(() => {
    if (!selectedService) {
      setEquivalentServices([]);
      return;
    }

    let cancelled = false;
    setLoadingEquivalents(true);
    setError(null);

    searchCatalogServices(selectedService.serviceKey)
      .then((result) => {
        if (!cancelled) {
          setEquivalentServices(result);
        }
      })
      .catch((catalogError) => {
        if (!cancelled) {
          setEquivalentServices([]);
          setError(getApiErrorMessage(catalogError));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingEquivalents(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedService]);

  const groupedServices = useMemo(() => groupServices(equivalentServices), [equivalentServices]);

  function handleProviderChange(provider: ProviderId) {
    setSelectedProvider(provider);
    setServiceSearch('');
    setSelectedService(null);
    setEquivalentServices([]);
  }

  function handleServiceSearch(value: string) {
    setServiceSearch(value);
    setSelectedService(null);
    setEquivalentServices([]);
  }

  function handleServiceSelect(service: CatalogService) {
    setSelectedService(service);
    setServiceSearch(service.canonicalName);
  }

  return (
    <section className="rounded-xl border border-line bg-white shadow-card">
      <div className="border-b border-lineSoft bg-slate-50/60 px-5 py-4">
        <div className="dashboard-kicker text-violet">
          <ServerCog className="h-3.5 w-3.5" aria-hidden="true" />
          Multi-cloud mapping
        </div>
        <h2 className="mt-2.5 text-base font-bold text-navy">Select a cloud service</h2>
        <p className="mt-0.5 max-w-3xl text-xs leading-5 text-muted">
          Choose a provider, then select a real service name from the catalog. The app shows the matching Azure, AWS, and GCP services.
        </p>
      </div>

      <div className="grid items-start gap-4 p-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-line bg-slate-50/70 p-3.5">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-graphite">Cloud provider</span>
            <select
              value={selectedProvider}
              onChange={(event) => handleProviderChange(event.target.value as ProviderId)}
              className="mt-1.5 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-ink outline-none transition focus:border-azure focus:ring-4 focus:ring-blue-100"
            >
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {providerLabels[provider]}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block">
            <span className="text-xs font-semibold uppercase text-graphite">Search service</span>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                value={serviceSearch}
                onChange={(event) => handleServiceSearch(event.target.value)}
                placeholder={`Search ${providerLabels[selectedProvider]} services`}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-azure focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </label>

          <div className="mt-2 max-h-[420px] overflow-y-auto rounded-lg border border-line bg-white shadow-sm scrollbar-thin" role="listbox" aria-label={`${providerLabels[selectedProvider]} services`}>
            {loadingProviderServices ? <div className="px-3 py-2 text-xs text-muted">Loading services...</div> : null}
            {!loadingProviderServices && providerServices.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted">No service found. Try another catalog word.</div>
            ) : null}
            {!loadingProviderServices
              ? providerServices.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceSelect(service)}
                      className={`flex w-full items-start justify-between gap-3 border-b border-line px-3 py-1.5 text-left text-xs last:border-b-0 transition ${
                        isSelected ? 'bg-blue-50 text-azure' : 'bg-white text-graphite hover:bg-slate-50'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span>
                        <span className="block font-semibold">{service.canonicalName}</span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-muted">{humanizeServiceKey(service.serviceKey)}</span>
                      </span>
                      {isSelected ? <Check className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" /> : null}
                    </button>
                  );
                })
              : null}
          </div>
        </aside>

        <div>
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-danger">{error}</div> : null}
          {loadingEquivalents ? <div className="rounded-lg border border-line bg-slate-50 px-3.5 py-2.5 text-xs text-muted">Loading equivalent services...</div> : null}
          {!selectedService && !loadingEquivalents ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-slate-50/70 px-4 py-6 text-center text-xs text-muted">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/10 text-violet">
                <ServerCog className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3">Select a service on the left to see the equivalent cloud services.</p>
            </div>
          ) : null}
          {selectedService && !loadingEquivalents && groupedServices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-slate-50 px-4 py-5 text-center text-xs text-muted">
              No mapping found for this selected service.
            </div>
          ) : null}

          <div className="grid gap-3">
            {groupedServices.map((group) => (
              <article key={group.serviceKey} className="rounded-xl border border-line bg-slate-50 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-navy">{humanizeServiceKey(group.serviceKey)}</h3>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted">Requirement type: {group.componentType.replace(/_/g, ' ')}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-graphite">
                    {group.rows.length}/3 providers mapped
                  </span>
                </div>

                <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                  {providers.map((provider) => {
                    const row = group.byProvider[provider];
                    return (
                      <div key={provider} className={`rounded-lg border p-3 ${providerClass[provider]}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase">{providerLabels[provider]}</span>
                          <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold">{provider === 'azure' ? 'Pricing active' : 'Mapping only'}</span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-navy">{row?.canonicalName ?? 'Not mapped yet'}</div>
                        <div className="mt-0.5 text-[11px] leading-4 text-slate-700">{row?.pricingServiceName ? `Pricing name: ${row.pricingServiceName}` : 'Pricing adapter planned.'}</div>
                        {row?.serviceKey === 'network.private' ? (
                          <div className="mt-1.5 text-[11px] leading-4 text-slate-700">
                            Cost note: base private network is usually low or no direct charge. Price NAT, VPN, peering, firewall, public IP, and egress separately.
                          </div>
                        ) : row?.requiredFields?.length ? (
                          <div className="mt-1.5 text-[11px] leading-4 text-slate-700">Needs: {row.requiredFields.join(', ')}</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
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
      byProvider: Partial<Record<ProviderId, CatalogService>>;
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
