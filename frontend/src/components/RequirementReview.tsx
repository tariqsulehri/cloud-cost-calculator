import { CheckCircle2, Clock3, Globe2, TriangleAlert } from 'lucide-react';
import { ComponentRequirementCard } from './ComponentRequirementCard';
import { InfoBadge } from './InfoBadge';
import { cn } from '../lib/utils';
import type { NormalizedInfrastructureRequirement, Provider } from '../types/estimate';

interface RequirementReviewProps {
  requirements: NormalizedInfrastructureRequirement;
  provider: Provider | 'compare';
  onComponentUpdate: (componentId: string, updates: Record<string, unknown>) => void;
}

export function RequirementReview({ requirements, provider, onComponentUpdate }: RequirementReviewProps) {
  const extractionLabel = requirements.extractionMethod === 'llm' ? 'AI-assisted' : 'Rule-based fallback';
  const providerContext = providerReviewContext(provider, requirements);
  const reviewableComponents = requirements.components.filter((component) => !component.optionalAddon);
  const reviewComponents = reviewableComponents.filter(
    (component) =>
      component.missingFields.length > 0 || ['missing_required_fields', 'unsupported', 'needs_review'].includes(component.pricingStatus)
  );
  const supportedComponents = reviewableComponents.filter(
    (component) => component.pricingStatus === 'supported' && component.missingFields.length === 0
  );
  const notImplementedComponents = reviewableComponents.filter(
    (component) => component.pricingStatus === 'not_implemented' && component.missingFields.length === 0
  );

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-panel shadow-card">
      <div className="border-b border-lineSoft bg-slate-50/60 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-navy">Step 2: Review services</h2>
            <p className="mt-0.5 text-xs text-muted">Check services and fill only missing values.</p>
          </div>
          <InfoBadge
            label={extractionLabel}
            tooltip={
              requirements.extractionMethod === 'llm'
                ? 'AI read your text and found cloud services.'
                : 'The app used simple rules because AI was not available.'
            }
            className="border-violet/20 bg-violet/10 text-violet"
          />
        </div>
      </div>

      <div className="grid gap-2.5 bg-white px-5 py-4 sm:grid-cols-4">
        <SummaryTile icon={Globe2} accent="azure" label={providerContext.regionLabel} value={providerContext.regionValue} description={providerContext.regionDescription} />
        <SummaryTile icon={CheckCircle2} accent="success" label="Ready" value={String(supportedComponents.length)} description="These services have enough details to price." />
        <SummaryTile icon={Clock3} accent="violet" label="Price not ready" value={String(notImplementedComponents.length)} description="The app detected these services, but pricing is not built yet." />
        <SummaryTile
          icon={TriangleAlert}
          accent={reviewComponents.length > 0 ? 'warning' : 'neutral'}
          label="Need info"
          value={String(reviewComponents.length)}
          description="These services need missing details or a quick check."
        />
      </div>

      <div className="px-5 py-4">
        <div className="rounded-lg border border-teal/20 bg-teal/5 px-3.5 py-2.5 text-xs text-slate-800">
          {providerContext.notice}
        </div>
        <ComponentGroup
          title="Supported for pricing"
          components={supportedComponents}
          provider={provider}
          emptyText="No supported pricing components detected yet."
          onComponentUpdate={onComponentUpdate}
        />
        <ComponentGroup
          title="Detected, price not ready"
          components={notImplementedComponents}
          provider={provider}
          emptyText="No unpriced detected services."
          onComponentUpdate={onComponentUpdate}
        />
        {reviewComponents.length > 0 ? (
          <ComponentGroup
            title="Needs review"
            components={reviewComponents}
            provider={provider}
            emptyText="No components need review."
            onComponentUpdate={onComponentUpdate}
          />
        ) : null}
      </div>
    </section>
  );
}

function providerReviewContext(provider: Provider | 'compare', requirements: NormalizedInfrastructureRequirement) {
  if (provider === 'compare') {
    return {
      regionLabel: 'Cloud regions',
      regionValue: `Azure ${requirements.region.providerRegion.azure} / AWS ${requirements.region.providerRegion.aws} / GCP ${requirements.region.providerRegion.gcp}`,
      regionDescription: 'The mapped provider regions used for comparison.',
      notice: 'Compare mode uses one normalized requirement and maps it to Azure, AWS, and GCP. Services marked Need info, Price not ready, or Can\'t price are not included in a provider total.'
    };
  }

  const labels: Record<Provider, string> = {
    azure: 'Azure',
    aws: 'AWS',
    gcp: 'GCP'
  };
  const pricingNote: Record<Provider, string> = {
    azure: 'Azure pricing is active where adapters exist.',
    aws: 'AWS uses early proposal planning rates today.',
    gcp: 'GCP uses early proposal planning rates today.'
  };

  return {
    regionLabel: `${labels[provider]} region`,
    regionValue: requirements.region.providerRegion[provider],
    regionDescription: `The ${labels[provider]} location used for pricing.`,
    notice: `${pricingNote[provider]} Services marked Need info, Price not ready, or Can't price are not included in the total.`
  };
}

const tileAccentClass: Record<'azure' | 'success' | 'violet' | 'warning' | 'neutral', { icon: string; value: string }> = {
  azure: { icon: 'bg-blue-100 text-azure', value: 'text-navy' },
  success: { icon: 'bg-emerald-100 text-success', value: 'text-navy' },
  violet: { icon: 'bg-violet/10 text-violet', value: 'text-navy' },
  warning: { icon: 'bg-amber-100 text-warning', value: 'text-warning' },
  neutral: { icon: 'bg-slate-100 text-graphite', value: 'text-navy' }
};

function SummaryTile({
  icon: Icon,
  label,
  value,
  description,
  accent = 'neutral'
}: {
  icon: typeof Globe2;
  label: string;
  value: string;
  description: string;
  accent?: 'azure' | 'success' | 'violet' | 'warning' | 'neutral';
}) {
  const tone = tileAccentClass[accent];
  return (
    <div title={description} className="stat-card flex items-center gap-2.5">
      <span className={cn('flex h-9 w-9 flex-none items-center justify-center rounded-lg', tone.icon)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[10px] font-bold uppercase tracking-wide text-muted">{label}</div>
        <div className={cn('mt-0.5 truncate text-base font-bold', tone.value)}>{value}</div>
      </div>
    </div>
  );
}

function ComponentGroup({
  title,
  components,
  provider,
  emptyText,
  onComponentUpdate
}: {
  title: string;
  components: NormalizedInfrastructureRequirement['components'];
  provider: Provider | 'compare';
  emptyText: string;
  onComponentUpdate: (componentId: string, updates: Record<string, unknown>) => void;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-navy">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-graphite">{components.length}</span>
      </div>
      {components.length === 0 ? (
        <p className="mt-1.5 text-xs text-muted">{emptyText}</p>
      ) : (
        <div className="mt-2.5 grid gap-2.5">
          {components.map((component) => (
            <ComponentRequirementCard key={component.id} component={component} provider={provider} onUpdate={onComponentUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
