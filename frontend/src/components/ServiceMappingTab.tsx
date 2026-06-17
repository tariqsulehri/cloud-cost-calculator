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
    <section className="rounded-lg border border-line bg-white shadow-card">
      <div className="border-b border-line bg-slate-50 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet/20 bg-white px-2.5 py-1 text-xs font-semibold text-violet shadow-sm">
              <ServerCog className="h-3.5 w-3.5" aria-hidden="true" />
              Multi-cloud mapping
            </div>
            <h2 className="mt-3 text-lg font-semibold text-navy">Select a cloud service</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
              Choose a provider, then select a real service name from the catalog. The app shows the matching Azure, AWS, and GCP services.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <label className="block">
            <span className="text-sm font-semibold text-graphite">Cloud provider</span>
            <select
              value={selectedProvider}
              onChange={(event) => handleProviderChange(event.target.value as ProviderId)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-ink outline-none transition focus:border-azure focus:ring-4 focus:ring-blue-100"
            >
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {providerLabels[provider]}
                </option>
              ))}
            </select>
          </label>

          <div>
            <label className="block">
              <span className="text-sm font-semibold text-graphite">Search and select service</span>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  value={serviceSearch}
                  onChange={(event) => handleServiceSearch(event.target.value)}
                  placeholder={`Search ${providerLabels[selectedProvider]} services`}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-azure focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </label>

            <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-line bg-white shadow-sm" role="listbox" aria-label={`${providerLabels[selectedProvider]} services`}>
              {loadingProviderServices ? <div className="px-3 py-3 text-sm text-muted">Loading services...</div> : null}
              {!loadingProviderServices && providerServices.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted">No service found. Try another catalog word.</div>
              ) : null}
              {!loadingProviderServices
                ? providerServices.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceSelect(service)}
                        className={`flex w-full items-start justify-between gap-3 border-b border-line px-3 py-2 text-left text-sm last:border-b-0 transition ${
                          isSelected ? 'bg-blue-50 text-azure' : 'bg-white text-graphite hover:bg-slate-50'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span>
                          <span className="block font-semibold">{service.canonicalName}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-muted">{humanizeServiceKey(service.serviceKey)}</span>
                        </span>
                        {isSelected ? <Check className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" /> : null}
                      </button>
                    );
                  })
                : null}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{error}</div> : null}
        {loadingEquivalents ? <div className="rounded-lg border border-line bg-slate-50 px-4 py-3 text-sm text-muted">Loading equivalent services...</div> : null}
        {!selectedService && !loadingEquivalents ? (
          <div className="rounded-lg border border-dashed border-line bg-slate-50 px-4 py-8 text-center text-sm text-muted">
            Select a service above to see the equivalent cloud services.
          </div>
        ) : null}
        {selectedService && !loadingEquivalents && groupedServices.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-slate-50 px-4 py-8 text-center text-sm text-muted">
            No mapping found for this selected service.
          </div>
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
                {providers.map((provider) => {
                  const row = group.byProvider[provider];
                  return (
                    <div key={provider} className={`rounded-lg border p-3 ${providerClass[provider]}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide">{providerLabels[provider]}</span>
                        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">{provider === 'azure' ? 'Pricing active' : 'Mapping only'}</span>
                      </div>
                      <div className="mt-2 text-sm font-bold text-navy">{row?.canonicalName ?? 'Not mapped yet'}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-700">{row?.pricingServiceName ? `Pricing name: ${row.pricingServiceName}` : 'Pricing adapter planned.'}</div>
                      {row?.serviceKey === 'network.private' ? (
                        <div className="mt-2 text-xs leading-5 text-slate-700">
                          Cost note: base private network is usually low or no direct charge. Price NAT, VPN, peering, firewall, public IP, and egress separately.
                        </div>
                      ) : row?.requiredFields?.length ? (
                        <div className="mt-2 text-xs leading-5 text-slate-700">Needs: {row.requiredFields.join(', ')}</div>
                      ) : null}
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
