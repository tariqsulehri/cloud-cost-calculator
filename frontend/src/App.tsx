import { useRef, useState } from 'react';
import { Bot, Calculator, GitCompareArrows } from 'lucide-react';
import { AiHelpTab } from './components/AiHelpTab';
import { CalculateEstimateButton } from './components/CalculateEstimateButton';
import { ClarifyingQuestionsPanel } from './components/ClarifyingQuestionsPanel';
import { ErrorAlert } from './components/ErrorAlert';
import { EstimateSummary } from './components/EstimateSummary';
import { LoadingState } from './components/LoadingState';
import { ProcessRail } from './components/ProcessRail';
import { ProviderTabs } from './components/ProviderTabs';
import { RequirementReview } from './components/RequirementReview';
import { RequirementTextInput } from './components/RequirementTextInput';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { ServiceMappingTab } from './components/ServiceMappingTab';
import { createNaturalLanguageEstimate, extractRequirements, getApiErrorMessage, refineRequirements } from './lib/api';
import type { NaturalLanguageEstimateResponse, NormalizedInfrastructureRequirement } from './types/estimate';

const exampleRequirement = `I need 2 web servers with 4 vCPU and 16GB RAM each, running Linux Ubuntu.
A managed PostgreSQL database with 8 vCPU and 32GB RAM, 500GB SSD storage.
Redis cache with 2GB memory.
A CDN for static assets, 1TB data transfer per month.
Load balancer across both servers.
All in US East region.`;

type WorkspaceTab = 'estimate' | 'mapping' | 'ai';

const workspaceTabs: Array<{
  key: WorkspaceTab;
  label: string;
  helper: string;
  icon: typeof Calculator;
}> = [
  {
    key: 'estimate',
    label: 'Estimate',
    helper: 'Review and calculate Azure cost',
    icon: Calculator
  },
  {
    key: 'mapping',
    label: 'Service Mapping',
    helper: 'Find Azure, AWS, and GCP matches',
    icon: GitCompareArrows
  },
  {
    key: 'ai',
    label: 'AI Help',
    helper: 'Explain status in simple words',
    icon: Bot
  }
];

function App() {
  const [requirementText, setRequirementText] = useState(exampleRequirement);
  const [requirements, setRequirements] = useState<NormalizedInfrastructureRequirement | null>(null);
  const [extractedPrompt, setExtractedPrompt] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<NaturalLanguageEstimateResponse | null>(null);
  const [loading, setLoading] = useState<'extract' | 'estimate' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('estimate');
  const requirementTextRef = useRef(exampleRequirement);
  const extractRequestRef = useRef(0);

  const hasCurrentExtraction = Boolean(requirements && extractedPrompt === requirementText);
  const hasEstimablePricing = Boolean(hasCurrentExtraction && requirements?.components.some(isEstimableComponent));

  function handleRequirementTextChange(value: string) {
    requirementTextRef.current = value;
    setRequirementText(value);
    setRequirements(null);
    setExtractedPrompt(null);
    setEstimate(null);
    setError(null);
  }

  async function handleExtract() {
    const promptSnapshot = requirementTextRef.current;
    const requestId = extractRequestRef.current + 1;
    extractRequestRef.current = requestId;
    setLoading('extract');
    setError(null);
    setRequirements(null);
    setExtractedPrompt(null);
    setEstimate(null);

    try {
      const result = await extractRequirements(promptSnapshot);
      if (requestId !== extractRequestRef.current || promptSnapshot !== requirementTextRef.current) {
        return;
      }
      setRequirements(result);
      setExtractedPrompt(promptSnapshot);
    } catch (extractError) {
      if (requestId !== extractRequestRef.current) {
        return;
      }
      setError(getApiErrorMessage(extractError));
    } finally {
      if (requestId === extractRequestRef.current) {
        setLoading(null);
      }
    }
  }

  async function handleEstimate() {
    if (!requirements || !hasEstimablePricing) {
      return;
    }

    setLoading('estimate');
    setError(null);

    try {
      const result = await createNaturalLanguageEstimate({
        provider: 'azure',
        requirements
      });
      setEstimate(result);
    } catch (estimateError) {
      setError(getApiErrorMessage(estimateError));
    } finally {
      setLoading(null);
    }
  }

  function handleClarificationAnswer(question: string, clarification: string) {
    const nextRequirementText = requirementText.includes(clarification) ? requirementText : `${requirementText.trim()}\n${clarification}`;
    requirementTextRef.current = nextRequirementText;
    setRequirementText(nextRequirementText);
    setExtractedPrompt(nextRequirementText);
    setRequirements((current) => (current ? applyClarification(current, question, clarification) : current));
    setEstimate(null);
  }

  function handleComponentUpdate(componentId: string, updates: Record<string, unknown>) {
    setRequirements((current) => {
      if (!current) {
        return current;
      }

      const components = current.components.map((component) => {
        if (component.id !== componentId) {
          return component;
        }

        const missingFields = component.missingFields.filter((field) => !hasReviewValue(updates[field]));
        return {
          ...component,
          ...updates,
          missingFields,
          pricingStatus:
            component.pricingStatus === 'missing_required_fields' && missingFields.length === 0
              ? component.type === 'compute'
                ? 'supported'
                : 'not_implemented'
              : component.pricingStatus
        };
      });

      return { ...current, components };
    });
    setEstimate(null);
  }

  return (
    <main className="min-h-screen bg-mist text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-lg border border-slate-800 bg-navy px-5 py-5 shadow-command">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="h-1 w-12 rounded-full bg-tealSoft" />
              <h1 className="mt-3 text-2xl font-bold text-white">Cloud Cost Calculator</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">
                Review infrastructure needs, fix missing details, and calculate cloud cost. Azure pricing is active now; AWS, GCP, and combined comparison are planned from the service mapping.
              </p>
            </div>
            <span className="rounded-full border border-tealSoft/30 bg-tealSoft/10 px-3 py-1 text-xs font-semibold text-tealSoft">FinOps review workspace</span>
          </div>
        </header>

        <ProviderTabs />
        <ProcessRail hasRequirements={Boolean(requirements)} hasEstimate={Boolean(estimate)} />

        <nav className="grid gap-3 rounded-lg border border-line bg-white p-2 shadow-card md:grid-cols-3" aria-label="Workspace tabs">
          {workspaceTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = workspaceTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setWorkspaceTab(tab.key)}
                className={`flex min-h-16 items-center gap-3 rounded-md border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-azure bg-blue-50 text-azure shadow-sm'
                    : 'border-transparent bg-white text-graphite hover:border-slate-200 hover:bg-slate-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 flex-none" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-bold">{tab.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted">{tab.helper}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {workspaceTab === 'estimate' ? (
          <div className="grid gap-6 lg:grid-cols-[430px_minmax(0,1fr)]">
            <RequirementTextInput
              value={requirementText}
              loading={loading === 'extract'}
              onChange={handleRequirementTextChange}
              onExtract={handleExtract}
              onRefine={refineRequirements}
            />

            <div className="space-y-5">
              {error ? <ErrorAlert message={error} /> : null}
              {loading ? <LoadingState /> : null}
              {requirements ? (
                <>
                  <RequirementReview requirements={requirements} onComponentUpdate={handleComponentUpdate} />
                  <ClarifyingQuestionsPanel questions={requirements.clarifyingQuestions} onAnswer={handleClarificationAnswer} />
                  <AssumptionsPanel assumptions={requirements.globalAssumptions} />
                  <CalculateEstimateButton
                    loading={loading === 'estimate'}
                    disabled={!hasEstimablePricing}
                    onClick={handleEstimate}
                  />
                </>
              ) : (
                <section className="rounded-lg border border-dashed border-line bg-panel p-8 text-center shadow-card">
                  <h2 className="text-lg font-semibold text-navy">Start by finding services</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Paste the requirement on the left, then click Find services. The app will show what can be priced and what needs more information.
                  </p>
                </section>
              )}
              {estimate ? <EstimateSummary estimate={estimate} /> : null}
            </div>
          </div>
        ) : null}

        {workspaceTab === 'mapping' ? <ServiceMappingTab /> : null}
        {workspaceTab === 'ai' ? <AiHelpTab requirements={requirements} estimate={estimate} /> : null}
      </div>
    </main>
  );
}

export default App;

function hasReviewValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

function isEstimableComponent(component: NormalizedInfrastructureRequirement['components'][number]): boolean {
  if (component.pricingStatus === 'missing_required_fields' || component.pricingStatus === 'unsupported' || component.pricingStatus === 'needs_review') {
    return false;
  }

  if (component.type === 'compute') {
    return component.pricingStatus === 'supported';
  }

  if (component.type === 'kubernetes') {
    return typeof component.nodeCount === 'number' && typeof component.vcpuPerNode === 'number' && typeof component.memoryGbPerNode === 'number';
  }

  if (component.type === 'database') {
    return (
      component.engine === 'postgresql' &&
      typeof component.vcpu === 'number' &&
      typeof component.storageGb === 'number' &&
      typeof component.highAvailability === 'boolean'
    );
  }

  if (component.type === 'cache') {
    return component.engine === 'redis' && typeof component.memoryGb === 'number' && typeof component.tier === 'string';
  }

  if (component.type === 'object_storage') {
    return typeof component.dataStoredGb === 'number' && typeof component.accessTier === 'string' && typeof component.redundancy === 'string';
  }

  if (component.type === 'cdn') {
    return typeof component.dataTransferGb === 'number' || typeof component.monthlyTransferGb === 'number' || typeof component.requestCount === 'number';
  }

  if (component.type === 'load_balancer') {
    return component.scheme === 'http_s';
  }

  if (component.type === 'queue') {
    return typeof component.tier === 'string' && typeof component.messageVolume === 'number';
  }

  if (component.type === 'monitoring') {
    return typeof component.logIngestionGb === 'number';
  }

  if (component.type === 'network') {
    return typeof component.monthlyEgressGb === 'number';
  }

  return false;
}

function applyClarification(
  requirements: NormalizedInfrastructureRequirement,
  question: string,
  clarification: string
): NormalizedInfrastructureRequirement {
  const components = requirements.components.map((component) => {
    if (question === 'Should PostgreSQL be highly available?' && component.type === 'database') {
      const highAvailability = /:\s*yes/i.test(clarification);
      const missingFields = component.missingFields.filter((field) => field !== 'highAvailability');
      return {
        ...component,
        highAvailability,
        missingFields,
        pricingStatus: component.pricingStatus === 'missing_required_fields' && missingFields.length === 0 ? 'not_implemented' : component.pricingStatus
      };
    }

    if (question === 'Should Redis be basic/dev or production-grade?' && component.type === 'cache') {
      const tier = clarification.includes('production') ? 'production' : 'basic';
      const missingFields = component.missingFields.filter((field) => field !== 'tier');
      return {
        ...component,
        tier,
        missingFields,
        pricingStatus: component.pricingStatus === 'missing_required_fields' && missingFields.length === 0 ? 'not_implemented' : component.pricingStatus
      };
    }

    if (question === 'Is the load balancer HTTP/S or TCP?' && component.type === 'load_balancer') {
      const scheme = clarification.includes('HTTP/S') ? 'http_s' : 'tcp';
      const azureService = scheme === 'http_s' ? 'Azure Application Gateway' : 'Azure Load Balancer';
      const missingFields = component.missingFields.filter((field) => field !== 'scheme');
      return {
        ...component,
        scheme,
        azureService,
        providerServiceHint: {
          ...component.providerServiceHint,
          azure: azureService
        },
        missingFields,
        pricingStatus: component.pricingStatus === 'missing_required_fields' && missingFields.length === 0 ? 'not_implemented' : component.pricingStatus
      };
    }

    return component;
  });

  return {
    ...requirements,
    components,
    clarifyingQuestions: requirements.clarifyingQuestions.filter((candidate) => candidate !== question)
  };
}
