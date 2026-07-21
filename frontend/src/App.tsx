import { useRef, useState } from 'react';
import { Bot, Calculator, CloudCog, GitCompareArrows, ServerCog } from 'lucide-react';
import { AiHelpTab } from './components/AiHelpTab';
import { AwsCatalogOpsTab } from './components/AwsCatalogOpsTab';
import { CalculateEstimateButton } from './components/CalculateEstimateButton';
import { ClarifyingQuestionsPanel } from './components/ClarifyingQuestionsPanel';
import { CompareEstimates } from './components/CompareEstimates';
import { CrossCloudMappingPanel } from './components/CrossCloudMappingPanel';
import { DocumentationTab } from './components/DocumentationTab';
import { ErrorAlert } from './components/ErrorAlert';
import { EstimateSummary } from './components/EstimateSummary';
import { LoadingState } from './components/LoadingState';
import { MagicPromptCreator } from './components/MagicPromptCreator';
import { OptionalAddOnsPanel } from './components/OptionalAddOnsPanel';
import { ProcessRail } from './components/ProcessRail';
import { ProviderTabs, type ProviderTabKey } from './components/ProviderTabs';
import { RequirementReview } from './components/RequirementReview';
import { RequirementTextInput } from './components/RequirementTextInput';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { CalculationCompletedModal } from './components/CalculationCompletedModal';
import { PricingReadinessDialog, getRecommendedDefaults } from './components/PricingReadinessDialog';
import { AiArchitectureAdvisorModal } from './components/AiArchitectureAdvisorModal';
import { ServiceMappingTab } from './components/ServiceMappingTab';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { createNaturalLanguageEstimate, extractRequirements, getApiErrorMessage, refineRequirements } from './lib/api';
import { withCrossCloudMappingAssumption } from './lib/crossCloudMapping';
import { isEstimableComponent } from './lib/pricingReadiness';
import { ProposalGenerator } from './lib/ProposalGenerator';
import type { NaturalLanguageEstimateResponse, NormalizedInfrastructureRequirement, Provider } from './types/estimate';

const exampleRequirement = `I need 2 web servers with 4 vCPU and 16GB RAM each, running Linux Ubuntu.
A managed PostgreSQL database with 8 vCPU and 32GB RAM, 500GB SSD storage.
Redis cache with 2GB memory.
A CDN for static assets, 1TB data transfer per month.
Load balancer across both servers.
All in US East region.`;

type WorkspaceTab = 'estimate' | 'mapping' | 'ops' | 'docs' | 'ai';

const workspaceTabs: Array<{
  key: WorkspaceTab;
  label: string;
  helper: string;
  icon: typeof Calculator;
}> = [
  {
    key: 'estimate',
    label: 'Estimate',
    helper: 'Azure cost',
    icon: Calculator
  },
  {
    key: 'mapping',
    label: 'Service Mapping',
    helper: 'Cloud matches',
    icon: GitCompareArrows
  },
  {
    key: 'ops',
    label: 'Operations',
    helper: 'Price sync',
    icon: ServerCog
  },
  {
    key: 'ai',
    label: 'AI Help',
    helper: 'Plain English',
    icon: Bot
  }
];

function App() {
  const [requirementText, setRequirementText] = useState(exampleRequirement);
  const [requirements, setRequirements] = useState<NormalizedInfrastructureRequirement | null>(null);
  const [extractedPrompt, setExtractedPrompt] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<Partial<Record<Provider, NaturalLanguageEstimateResponse>>>({});
  const [loading, setLoading] = useState<'extract' | 'estimate' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('estimate');
  const [selectedProvider, setSelectedProvider] = useState<ProviderTabKey>('azure');
  const [baseProvider, setBaseProvider] = useState<Provider>('azure');
  const [showMagicPromptCreator, setShowMagicPromptCreator] = useState(false);
  const [showAiAdvisorModal, setShowAiAdvisorModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showReadinessDialog, setShowReadinessDialog] = useState(false);
  const requirementTextRef = useRef(exampleRequirement);
  const extractRequestRef = useRef(0);

  const hasCurrentExtraction = Boolean(requirements && extractedPrompt === requirementText);
  const hasEstimablePricing = Boolean(hasCurrentExtraction && requirements?.components.some((component) => isEstimableComponent(component, selectedProvider)));
  const activeProvider = selectedProvider === 'compare' ? baseProvider : selectedProvider;
  const activeEstimate = selectedProvider === 'compare' ? null : estimates[activeProvider];
  const hasAnyEstimate = Object.values(estimates).some(Boolean);

  function handleAutoFixComponent(componentId: string, defaults: Record<string, unknown>) {
    handleComponentUpdate(componentId, defaults);
  }

  function handleAutoFixAll() {
    if (!requirements) return;
    for (const comp of requirements.components) {
      if (comp.missingFields.length > 0 || comp.pricingStatus === 'missing_required_fields') {
        const defaults = getRecommendedDefaults(comp);
        handleComponentUpdate(comp.id, defaults);
      }
    }
  }

  function handleExportProposal() {
    const providers: Provider[] = ['azure', 'aws', 'gcp'];
    const proposalEstimates = [];

    for (const p of providers) {
      const est = estimates[p];
      if (!est) continue;
      const monthlyCost = est.totalMonthlyCost;
      proposalEstimates.push({
        provider: p,
        providerLabel: providerLabel(p),
        region: est.region,
        monthlyCost,
        annualCost: monthlyCost * 12,
        oneYearRiMonthlyCost: monthlyCost * 0.7,
        threeYearRiMonthlyCost: monthlyCost * 0.5,
        confidence: est.confidence,
        lineItemsCount: est.calculatedLineItems.length,
        lineItems: est.calculatedLineItems.map((item) => ({
          category: item.category,
          serviceName: item.serviceName,
          skuName: item.skuName,
          monthlyCost: item.monthlyCost,
          assumption: item.assumption
        })),
        assumptions: est.assumptions
      });
    }

    const markdown = ProposalGenerator.generateMarkdownProposal({
      requirementsSummary: requirementText,
      estimates: proposalEstimates
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cloud-cost-proposal.md';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleProviderSelect(provider: ProviderTabKey) {
    setSelectedProvider(provider);
    if (provider !== 'compare') {
      setBaseProvider(provider);
    }
  }

  function handleRequirementTextChange(value: string) {
    requirementTextRef.current = value;
    setRequirementText(value);
    setRequirements(null);
    setExtractedPrompt(null);
    setEstimates({});
    setError(null);
  }

  function handleMagicPromptUse(prompt: string) {
    handleRequirementTextChange(prompt);
  }

  async function handleExtract() {
    const promptSnapshot = requirementTextRef.current;
    const requestId = extractRequestRef.current + 1;
    extractRequestRef.current = requestId;
    setLoading('extract');
    setError(null);
    setRequirements(null);
    setExtractedPrompt(null);
    setEstimates({});

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
      if (selectedProvider === 'compare') {
        const results = await Promise.all(
          (['azure', 'aws', 'gcp'] as Provider[]).map((provider) =>
            createNaturalLanguageEstimate({
              provider,
              requirements: withCrossCloudMappingAssumption(requirements, baseProvider, provider)
            })
          )
        );
        setEstimates((current) => ({
          ...current,
          ...Object.fromEntries(results.map((result) => [result.provider, result]))
        }));
      } else {
        const result = await createNaturalLanguageEstimate({
          provider: selectedProvider,
          requirements: withCrossCloudMappingAssumption(requirements, activeProvider, selectedProvider)
        });
        setEstimates((current) => ({ ...current, [selectedProvider]: result }));
      }
      setShowCompletionModal(true);
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
    setEstimates({});
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
    setEstimates({});
  }

  function handleOptionalAddOnUpsert(component: NormalizedInfrastructureRequirement['components'][number]) {
    setRequirements((current) => {
      if (!current) {
        return current;
      }

      const exists = current.components.some((item) => item.id === component.id);
      return {
        ...current,
        components: exists ? current.components.map((item) => (item.id === component.id ? component : item)) : [...current.components, component]
      };
    });
    setEstimates({});
  }

  function handleOptionalAddOnRemove(componentId: string) {
    setRequirements((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        components: current.components.filter((component) => component.id !== componentId)
      };
    });
    setEstimates({});
  }

  function handleComponentRemove(componentId: string) {
    handleOptionalAddOnRemove(componentId);
  }

  return (
    <main className="min-h-screen bg-mist text-ink">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-2xl bg-brand-header px-6 py-6 shadow-command">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-azure/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-teal/15 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-brand-accent shadow-glow">
                <CloudCog className="h-6 w-6 text-white" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">Cloud Cost Calculator</h1>
                <p className="mt-0.5 max-w-3xl text-sm leading-5 text-slate-300">
                  Public cloud pricing estimates without sign-in, plus service review and multi-cloud mapping.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-tealSoft/30 bg-tealSoft/10 px-3 py-1.5 text-xs font-bold text-tealSoft">
                <span className="h-1.5 w-1.5 rounded-full bg-tealSoft" />
                Azure pricing active
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200">AWS public EC2 pricing</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200">GCP early proposal</span>
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          <ProviderTabs
            selected={selectedProvider}
            baseProvider={baseProvider}
            estimates={estimates}
            onSelect={handleProviderSelect}
            onOpenDocs={() => setWorkspaceTab('docs')}
          />
          <ProcessRail hasRequirements={Boolean(requirements)} hasEstimate={hasAnyEstimate} />
        </div>

        <Tabs value={workspaceTab} onValueChange={(value) => setWorkspaceTab(value as WorkspaceTab)}>
          <TabsList className="grid w-full grid-cols-4">
            {workspaceTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.key} value={tab.key} className="justify-start px-3.5">
                  <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
                  <span className="min-w-0 text-left">
                    <span className="block truncate">{tab.label}</span>
                    <span className="block truncate text-[10px] font-medium text-muted group-data-[state=active]:text-white/80">{tab.helper}</span>
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {workspaceTab === 'estimate' ? (
          <div className="grid items-start gap-4 lg:grid-cols-[390px_minmax(0,1fr)]">
            <RequirementTextInput
              value={requirementText}
              loading={loading === 'extract'}
              provider={activeProvider}
              onChange={handleRequirementTextChange}
              onExtract={handleExtract}
              onRefine={(value, provider) => refineRequirements(value, { provider })}
              onOpenMagicPrompt={() => setShowMagicPromptCreator(true)}
              onOpenAiAdvisor={() => setShowAiAdvisorModal(true)}
            />

            <div className="space-y-4">
              {error ? <ErrorAlert message={error} /> : null}
              {loading ? <LoadingState /> : null}
              {requirements ? (
                <>
                  <RequirementReview
                    requirements={requirements}
                    provider={selectedProvider}
                    onComponentUpdate={handleComponentUpdate}
                    onComponentRemove={handleComponentRemove}
                    onOpenReadinessDialog={() => setShowReadinessDialog(true)}
                  />
                  {selectedProvider === 'azure' ? (
                    <OptionalAddOnsPanel
                      components={requirements.components}
                      onUpsert={handleOptionalAddOnUpsert}
                      onRemove={handleOptionalAddOnRemove}
                    />
                  ) : null}
                  {selectedProvider === 'compare' ? <CrossCloudMappingPanel requirements={requirements} baseProvider={baseProvider} /> : null}
                  <ClarifyingQuestionsPanel questions={requirements.clarifyingQuestions} onAnswer={handleClarificationAnswer} />
                  <AssumptionsPanel assumptions={requirements.globalAssumptions} />
                  <div className="flex justify-end">
                    <CalculateEstimateButton
                      loading={loading === 'estimate'}
                      disabled={!hasEstimablePricing}
                      label={selectedProvider === 'compare' ? 'Calculate all providers' : `Calculate ${providerLabel(activeProvider)} cost`}
                      onClick={handleEstimate}
                    />
                  </div>
                </>
              ) : (
                <section className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center shadow-sm">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent shadow-glow">
                    <Calculator className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-base font-bold text-navy">Start by finding services</h2>
                  <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted">
                    Paste the requirement on the left, then click Find services. The app will show what can be priced and what needs more information.
                  </p>
                </section>
              )}
              {selectedProvider === 'compare' ? <CompareEstimates estimates={estimates} /> : null}
              {activeEstimate && selectedProvider !== 'compare' ? <EstimateSummary estimate={activeEstimate} /> : null}
            </div>
          </div>
        ) : null}

        {workspaceTab === 'mapping' ? <ServiceMappingTab /> : null}
        {workspaceTab === 'ops' ? <AwsCatalogOpsTab /> : null}
        {workspaceTab === 'docs' ? <DocumentationTab /> : null}
        {workspaceTab === 'ai' ? <AiHelpTab requirements={requirements} estimate={activeEstimate ?? estimates.azure ?? null} /> : null}
      </div>

      {showMagicPromptCreator ? (
        <MagicPromptCreator initialProvider={activeProvider} onClose={() => setShowMagicPromptCreator(false)} onUsePrompt={handleMagicPromptUse} />
      ) : null}

      <CalculationCompletedModal
        isOpen={showCompletionModal}
        estimate={activeEstimate ?? estimates.azure ?? estimates.aws ?? estimates.gcp ?? null}
        provider={activeProvider}
        onClose={() => setShowCompletionModal(false)}
        onViewDetails={() => {
          setSelectedProvider('compare');
        }}
        onExportProposal={() => {
          handleExportProposal();
        }}
      />

      {showAiAdvisorModal ? (
        <AiArchitectureAdvisorModal
          initialProvider={activeProvider}
          onClose={() => setShowAiAdvisorModal(false)}
          onApplyPrompt={(packedPrompt) => {
            setRequirementText(packedPrompt);
            handleRequirementTextChange(packedPrompt);
          }}
        />
      ) : null}

      <PricingReadinessDialog
        isOpen={showReadinessDialog}
        requirements={requirements}
        provider={activeProvider}
        onClose={() => setShowReadinessDialog(false)}
        onAutoFixComponent={handleAutoFixComponent}
        onAutoFixAll={handleAutoFixAll}
        onRemoveComponent={handleComponentRemove}
      />
    </main>
  );
}

function providerLabel(provider: Provider): string {
  const labels: Record<Provider, string> = {
    azure: 'Azure',
    aws: 'AWS',
    gcp: 'GCP'
  };
  return labels[provider];
}

export default App;

function hasReviewValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
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
