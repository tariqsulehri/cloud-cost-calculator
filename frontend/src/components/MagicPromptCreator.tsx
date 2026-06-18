import { Check, Search, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage, searchCatalogServices } from '../lib/api';
import { serviceQuestionCatalog, type PricingQuestion } from '../lib/crossCloudMapping';
import type { CatalogService, Provider } from '../types/estimate';

interface MagicPromptCreatorProps {
  initialProvider: Provider;
  onClose: () => void;
  onUsePrompt: (prompt: string) => void;
}

type SelectedService = CatalogService & {
  localId: string;
};

const providerLabels: Record<Provider, string> = {
  azure: 'Azure',
  aws: 'AWS',
  gcp: 'GCP'
};

const providerClass: Record<Provider, string> = {
  azure: 'border-blue-300 bg-blue-50 text-blue-800',
  aws: 'border-amber-300 bg-amber-50 text-amber-900',
  gcp: 'border-emerald-300 bg-emerald-50 text-emerald-800'
};

const regionDefaults: Record<Provider, string> = {
  azure: 'East US',
  aws: 'us-east-1',
  gcp: 'us-east1'
};

const answerDefaults: Record<string, string> = {
  quantity: '2',
  monthlyHours: '730',
  operatingSystem: 'Linux',
  storageType: 'SSD',
  highAvailability: 'Yes',
  tier: 'production',
  accessTier: 'Hot',
  redundancy: 'Zone redundant',
  scheme: 'HTTP/S',
  memoryGb: '2',
  dataTransferGb: '1024',
  retentionDays: '30'
};

const numericQuestionKeys = new Set([
  'quantity',
  'vcpu',
  'memoryGb',
  'monthlyHours',
  'nodeCount',
  'vcpuPerNode',
  'memoryGbPerNode',
  'storageGb',
  'dataStoredGb',
  'dataTransferGb',
  'requestCount',
  'messageVolume',
  'logIngestionGb',
  'monthlyEgressGb',
  'monthlyDataProcessedGb',
  'protectedDataGb',
  'retentionDays',
  'diskCount',
  'diskSizeGb',
  'vcpuSeconds',
  'memoryGbSeconds'
]);

const selectOptions: Record<string, string[]> = {
  operatingSystem: ['Linux', 'Windows', 'Ubuntu Linux', 'Red Hat Enterprise Linux'],
  storageType: ['SSD', 'Premium SSD', 'Standard SSD', 'HDD'],
  highAvailability: ['Yes', 'No'],
  tier: ['production', 'basic/dev', 'standard', 'premium'],
  accessTier: ['Hot', 'Cool', 'Archive'],
  redundancy: ['Local redundant', 'Zone redundant', 'Geo redundant'],
  scheme: ['HTTP/S', 'TCP', 'UDP'],
  diskTier: ['Premium SSD', 'Standard SSD', 'Standard HDD', 'Ultra / high performance']
};

const numericExamples: Record<string, string> = {
  quantity: '2',
  vcpu: '4',
  memoryGb: '16',
  monthlyHours: '730',
  nodeCount: '3',
  vcpuPerNode: '8',
  memoryGbPerNode: '32',
  storageGb: '512',
  dataStoredGb: '1024',
  dataTransferGb: '1024',
  requestCount: '20000000',
  messageVolume: '10000000',
  logIngestionGb: '200',
  monthlyEgressGb: '1024',
  monthlyDataProcessedGb: '1024',
  protectedDataGb: '1024',
  retentionDays: '30',
  diskCount: '2',
  diskSizeGb: '256',
  vcpuSeconds: '100000',
  memoryGbSeconds: '200000'
};

export function MagicPromptCreator({ initialProvider, onClose, onUsePrompt }: MagicPromptCreatorProps) {
  const [provider, setProvider] = useState<Provider>(initialProvider);
  const [region, setRegion] = useState(regionDefaults[initialProvider]);
  const [environment, setEnvironment] = useState('Production');
  const [pricingModel, setPricingModel] = useState('Pay-as-you-go / on-demand');
  const [serviceSearch, setServiceSearch] = useState('');
  const [services, setServices] = useState<CatalogService[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    searchCatalogServices(serviceSearch, { provider })
      .then((result) => {
        if (!cancelled) {
          setServices(result.slice(0, 30));
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
  }, [provider, serviceSearch]);

  const generatedPrompt = useMemo(
    () => buildPrompt(provider, region, environment, pricingModel, selectedServices, answers),
    [answers, environment, pricingModel, provider, region, selectedServices]
  );

  function handleProviderChange(nextProvider: Provider) {
    setProvider(nextProvider);
    setRegion(regionDefaults[nextProvider]);
    setEnvironment('Production');
    setPricingModel('Pay-as-you-go / on-demand');
    setServiceSearch('');
    setServices([]);
    setSelectedServices([]);
    setAnswers({});
  }

  function handleServiceSelect(service: CatalogService) {
    if (selectedServices.some((selected) => selected.id === service.id)) {
      return;
    }

    const localId = `${service.id}-${Date.now()}`;
    const selectedService = { ...service, localId };
    setSelectedServices((current) => [...current, selectedService]);
    setAnswers((current) => ({
      ...current,
      ...Object.fromEntries(
        questionsForService(selectedService).map((question) => [
          answerKey(localId, question.key),
          current[answerKey(localId, question.key)] ?? defaultAnswerFor(selectedService, question)
        ])
      )
    }));
  }

  function handleRemoveService(localId: string) {
    setSelectedServices((current) => current.filter((service) => service.localId !== localId));
    setAnswers((current) =>
      Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${localId}:`)))
    );
  }

  function handleAnswerChange(localId: string, questionKey: string, value: string) {
    setAnswers((current) => ({ ...current, [answerKey(localId, questionKey)]: value }));
  }

  function handleUsePrompt() {
    onUsePrompt(generatedPrompt);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-2 sm:p-3" role="dialog" aria-modal="true" aria-label="Magic requirement builder">
      <div className="mx-auto flex h-full max-h-[calc(100vh-24px)] max-w-6xl flex-col overflow-hidden rounded-xl border border-line bg-white shadow-command">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lineSoft bg-slate-50 px-4 py-2.5">
          <div>
            <div className="dashboard-kicker text-violet">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Magic Requirement Builder
            </div>
            <h2 className="mt-1 text-base font-bold text-navy">Build a professional requirement prompt</h2>
            <p className="text-xs text-muted">Select services, answer pricing questions, then use the generated prompt.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-xs font-bold text-graphite transition hover:border-danger/30 hover:text-danger"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-3">
          <div className="grid h-full min-h-0 items-stretch gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="flex h-full min-h-0 flex-col rounded-xl border border-line bg-slate-50/70 p-3">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase text-graphite">Cloud</span>
                <select
                  value={provider}
                  onChange={(event) => handleProviderChange(event.target.value as Provider)}
                  className="mt-1 h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-ink outline-none transition focus:border-azure focus:ring-4 focus:ring-blue-100"
                >
                  {(['azure', 'aws', 'gcp'] as Provider[]).map((item) => (
                    <option key={item} value={item}>
                      {providerLabels[item]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-2.5 block">
                <span className="text-[11px] font-semibold uppercase text-graphite">Region <span className="text-danger">*</span></span>
                <input
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  required
                  className="mt-1 h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-ink outline-none transition focus:border-azure focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="mt-2.5 block">
                <span className="text-[11px] font-semibold uppercase text-graphite">Environment</span>
                <select
                  value={environment}
                  onChange={(event) => setEnvironment(event.target.value)}
                  className="mt-1 h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-ink outline-none transition focus:border-azure focus:ring-4 focus:ring-blue-100"
                >
                  <option>Production</option>
                  <option>Development</option>
                  <option>Test / QA</option>
                  <option>Disaster recovery</option>
                </select>
              </label>

              <label className="mt-2.5 block">
                <span className="text-[11px] font-semibold uppercase text-graphite">Pricing model</span>
                <select
                  value={pricingModel}
                  onChange={(event) => setPricingModel(event.target.value)}
                  className="mt-1 h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-ink outline-none transition focus:border-azure focus:ring-4 focus:ring-blue-100"
                >
                  <option>Pay-as-you-go / on-demand</option>
                  <option>Reserved / committed use</option>
                  <option>Savings plan</option>
                  <option>Client contract pricing</option>
                </select>
              </label>

              <label className="mt-2.5 block">
                <span className="text-[11px] font-semibold uppercase text-graphite">Search service</span>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    value={serviceSearch}
                    onChange={(event) => setServiceSearch(event.target.value)}
                    placeholder={`Search ${providerLabels[provider]} services`}
                    className="h-8 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-azure focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </label>

              <div className="mt-2 min-h-0 flex-1 overflow-y-auto rounded-lg border border-line bg-white shadow-sm scrollbar-thin" role="listbox" aria-label={`${providerLabels[provider]} services`}>
                {loading ? <div className="px-3 py-2 text-xs text-muted">Loading services...</div> : null}
                {error ? <div className="px-3 py-2 text-xs text-danger">{error}</div> : null}
                {!loading && !error && services.length === 0 ? <div className="px-3 py-2 text-xs text-muted">No service found. Try another word.</div> : null}
                {!loading && !error
                  ? services.map((service) => {
                      const selected = selectedServices.some((item) => item.id === service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleServiceSelect(service)}
                          className={`flex w-full items-start justify-between gap-3 border-b border-line px-3 py-1.5 text-left text-[11px] last:border-b-0 transition ${
                            selected ? 'bg-blue-50 text-azure' : 'bg-white text-graphite hover:bg-slate-50'
                          }`}
                          role="option"
                          aria-selected={selected}
                        >
                          <span>
                            <span className="block font-semibold">{service.canonicalName}</span>
                            <span className="mt-0.5 block text-[11px] leading-4 text-muted">{service.componentType.replace(/_/g, ' ')}</span>
                          </span>
                          {selected ? <Check className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" /> : null}
                        </button>
                      );
                    })
                  : null}
              </div>
            </aside>

            <div className="grid min-h-0 items-stretch gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-blue-200 bg-white">
                <div className="flex min-h-[60px] flex-col justify-center border-b border-blue-100 bg-blue-50 px-4 py-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900">Selected services</h3>
                  <p className="mt-0.5 text-[11px] leading-4 text-blue-800">Fill required values first. Optional values can stay blank.</p>
                </div>
                {selectedServices.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center text-xs text-muted">
                    <Sparkles className="mb-2 h-6 w-6 text-violet" aria-hidden="true" />
                    Select one or more services from the catalog.
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                    {selectedServices.map((service) => (
                      <SelectedServiceCard
                        key={service.localId}
                        service={service}
                        answers={answers}
                        onAnswerChange={handleAnswerChange}
                        onRemove={handleRemoveService}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-violet/20 bg-slate-50/70">
                <div className="flex min-h-[60px] flex-col justify-center border-b border-violet/15 bg-violet/5 px-4 py-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-violet">Generated prompt</h3>
                  <p className="mt-1 text-[11px] leading-4 text-slate-600">This text will be pasted into Step 1.</p>
                </div>
                <div className="flex min-h-0 flex-1 flex-col p-3">
                  <textarea
                    value={generatedPrompt}
                    readOnly
                    rows={14}
                    className="min-h-0 flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs leading-5 text-ink outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleUsePrompt}
                    disabled={selectedServices.length === 0}
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-3.5 text-xs font-bold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Use prompt
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectedServiceCard({
  service,
  answers,
  onAnswerChange,
  onRemove
}: {
  service: SelectedService;
  answers: Record<string, string>;
  onAnswerChange: (localId: string, questionKey: string, value: string) => void;
  onRemove: (localId: string) => void;
}) {
  const questions = questionsForService(service);
  const requiredQuestions = questions.filter((question) => question.required);
  const optionalQuestions = questions.filter((question) => !question.required);

  return (
    <article className="rounded-lg border border-line bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-navy">{service.canonicalName}</h4>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${providerClass[service.providerId]}`}>{providerLabels[service.providerId]}</span>
          </div>
          <p className="mt-0.5 text-[11px] leading-4 text-muted">
            {service.componentType.replace(/_/g, ' ')}
            {service.pricingServiceName ? ` · Pricing name: ${service.pricingServiceName}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(service.localId)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[11px] font-bold text-red-700 transition hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Remove
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {requiredQuestions.map((question) => (
          <QuestionInput
            key={question.key}
            service={service}
            question={question}
            value={answers[answerKey(service.localId, question.key)] ?? ''}
            onChange={onAnswerChange}
          />
        ))}
      </div>

      {optionalQuestions.length > 0 ? (
        <details className="mt-3 rounded-lg border border-line bg-slate-50 px-3 py-2">
          <summary className="cursor-pointer text-xs font-bold text-graphite">Optional pricing details</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {optionalQuestions.map((question) => (
              <QuestionInput
                key={question.key}
                service={service}
                question={question}
                value={answers[answerKey(service.localId, question.key)] ?? ''}
                onChange={onAnswerChange}
              />
            ))}
          </div>
        </details>
      ) : null}
    </article>
  );
}

function QuestionInput({
  service,
  question,
  value,
  onChange
}: {
  service: SelectedService;
  question: PricingQuestion;
  value: string;
  onChange: (localId: string, questionKey: string, value: string) => void;
}) {
  const inputConfig = questionInputConfig(service, question);

  return (
    <label className="block">
      <span className="text-[11px] font-bold text-slate-700">
        {shortQuestionLabel(question)} {question.required ? <span className="text-danger">*</span> : null}
      </span>
      {inputConfig.kind === 'select' ? (
        <select
          value={value}
          onChange={(event) => onChange(service.localId, question.key, event.target.value)}
          required={question.required}
          className="mt-1 h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-ink outline-none transition focus:border-azure focus:ring-4 focus:ring-blue-100"
        >
          {!question.required ? <option value="">Not specified</option> : null}
          {inputConfig.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={inputConfig.kind}
          min={inputConfig.kind === 'number' ? 0 : undefined}
          step={inputConfig.kind === 'number' ? 'any' : undefined}
          inputMode={inputConfig.kind === 'number' ? 'decimal' : undefined}
          value={value}
          onChange={(event) => onChange(service.localId, question.key, event.target.value)}
          placeholder={inputConfig.placeholder}
          required={question.required}
          className="mt-1 h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-ink outline-none transition focus:border-azure focus:ring-4 focus:ring-blue-100"
        />
      )}
      <span className="mt-0.5 block text-[10px] leading-4 text-muted">{question.help}</span>
    </label>
  );
}

function questionInputConfig(
  service: SelectedService,
  question: PricingQuestion
): { kind: 'number'; placeholder: string } | { kind: 'text'; placeholder: string } | { kind: 'select'; options: string[] } {
  if (question.key === 'engine') {
    if (service.componentType === 'cache') {
      return { kind: 'select', options: ['Redis', 'Memcached'] };
    }
    if (service.componentType === 'database') {
      return { kind: 'select', options: ['PostgreSQL', 'MySQL', 'SQL Server', 'MariaDB'] };
    }
  }

  if (selectOptions[question.key]) {
    return { kind: 'select', options: selectOptions[question.key] };
  }

  if (numericQuestionKeys.has(question.key)) {
    return {
      kind: 'number',
      placeholder: `${question.required ? 'Required' : 'Optional'} e.g. ${numericExamples[question.key] ?? '10'}`
    };
  }

  return {
    kind: 'text',
    placeholder: `${question.required ? 'Required' : 'Optional'} e.g. ${textExampleFor(service, question)}`
  };
}

function shortQuestionLabel(question: PricingQuestion): string {
  const labels: Record<string, string> = {
    quantity: 'Server count',
    vcpu: 'vCPU',
    memoryGb: 'Memory (GB)',
    operatingSystem: 'Operating system',
    monthlyHours: 'Monthly hours',
    nodeCount: 'Node count',
    vcpuPerNode: 'vCPU / node',
    memoryGbPerNode: 'Memory / node (GB)',
    engine: 'Engine',
    storageGb: 'Storage (GB)',
    storageType: 'Storage type',
    highAvailability: 'High availability',
    dataStoredGb: 'Stored data (GB)',
    accessTier: 'Access tier',
    redundancy: 'Redundancy',
    dataTransferGb: 'Transfer (GB)',
    requestCount: 'Requests / month',
    scheme: 'Traffic type',
    target: 'Traffic target',
    messageVolume: 'Messages / month',
    tier: 'Tier',
    logIngestionGb: 'Log ingestion (GB)',
    retentionDays: 'Retention days',
    monthlyEgressGb: 'Internet egress (GB)',
    monthlyDataProcessedGb: 'Data processed (GB)',
    protectedDataGb: 'Protected data (GB)',
    diskCount: 'Disk count',
    diskSizeGb: 'Disk size (GB)',
    diskTier: 'Disk tier',
    vcpuSeconds: 'vCPU seconds',
    memoryGbSeconds: 'Memory GB seconds'
  };

  return labels[question.key] ?? question.label.replace(/^How many\s+/i, '').replace(/^How much\s+/i, '');
}

function questionsForService(service: SelectedService): PricingQuestion[] {
  const catalogQuestions = serviceQuestionCatalog[service.componentType]?.commonQuestions ?? [];
  if (catalogQuestions.length > 0) {
    return catalogQuestions;
  }

  return service.requiredFields.map((field) => ({
    key: field,
    label: humanizeField(field),
    impact: 'medium',
    required: true,
    help: 'Required by the selected catalog service.'
  }));
}

function defaultAnswerFor(service: SelectedService, question: PricingQuestion): string {
  if (question.key === 'engine') {
    if (service.componentType === 'cache') {
      return 'Redis';
    }
    if (service.componentType === 'database') {
      return 'PostgreSQL';
    }
  }

  if (question.key === 'storageGb' && service.componentType === 'database') {
    return '512';
  }

  return answerDefaults[question.key] ?? '';
}

function textExampleFor(service: SelectedService, question: PricingQuestion): string {
  if (question.key === 'target') {
    return service.providerId === 'aws' ? 'ECS service' : service.providerId === 'azure' ? 'App Service or VM' : 'Cloud Run service';
  }
  if (question.key.toLowerCase().includes('service')) {
    return service.providerId === 'aws' ? 'ECS' : service.providerId === 'azure' ? 'App Service' : 'Cloud Run';
  }
  return 'production workload';
}

function buildPrompt(
  provider: Provider,
  region: string,
  environment: string,
  pricingModel: string,
  services: SelectedService[],
  answers: Record<string, string>
): string {
  const providerLabel = providerLabels[provider];
  if (services.length === 0) {
    return `I need a monthly cloud cost estimate for ${providerLabel} in ${region || regionDefaults[provider]}.\nEnvironment: ${environment}.\nPricing model: ${pricingModel}.\n\nSelect services to build the requirement.`;
  }

  const lines = [
    `I need a monthly cloud cost estimate for ${providerLabel} in ${region || regionDefaults[provider]}.`,
    `Environment: ${environment}.`,
    `Pricing model: ${pricingModel}.`,
    '',
    'Please identify the cloud services, required pricing parameters, assumptions, calculated monthly cost, and any services not included in the total.',
    '',
    'Services and sizing:'
  ];

  services.forEach((service, index) => {
    lines.push('');
    lines.push(`${index + 1}. ${service.canonicalName}`);
    lines.push(`- Cloud provider: ${providerLabels[service.providerId]}`);
    lines.push(`- Service type: ${service.componentType.replace(/_/g, ' ')}`);
    if (service.pricingServiceName) {
      lines.push(`- Pricing service name: ${service.pricingServiceName}`);
    }

    const answeredQuestions = questionsForService(service)
      .map((question) => ({
        question,
        value: answers[answerKey(service.localId, question.key)]?.trim()
      }))
      .filter((item) => item.value && item.value.toLowerCase() !== 'not specified');

    answeredQuestions.forEach(({ question, value }) => {
      lines.push(`- ${question.label}: ${value}`);
    });

    const missingRequired = questionsForService(service)
      .filter((question) => question.required)
      .filter((question) => {
        const value = answers[answerKey(service.localId, question.key)]?.trim();
        return !value || value.toLowerCase() === 'not specified';
      });

    if (missingRequired.length > 0) {
      lines.push(`- Open required values: ${missingRequired.map((question) => question.label).join(', ')}`);
    }
  });

  lines.push('');
  lines.push('Use public on-demand pricing unless another pricing model is specified. If a service cannot be calculated, show it clearly as not calculated and explain what is missing.');

  return lines.join('\n');
}

function answerKey(localId: string, questionKey: string): string {
  return `${localId}:${questionKey}`;
}

function humanizeField(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
