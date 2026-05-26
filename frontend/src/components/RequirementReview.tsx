import { ComponentRequirementCard } from './ComponentRequirementCard';
import type { NormalizedInfrastructureRequirement } from '../types/estimate';

interface RequirementReviewProps {
  requirements: NormalizedInfrastructureRequirement;
  onComponentUpdate: (componentId: string, updates: Record<string, unknown>) => void;
}

export function RequirementReview({ requirements, onComponentUpdate }: RequirementReviewProps) {
  const extractionLabel = requirements.extractionMethod === 'llm' ? 'AI-assisted' : 'Rule-based fallback';
  const reviewComponents = requirements.components.filter(
    (component) =>
      component.missingFields.length > 0 || ['missing_required_fields', 'unsupported', 'needs_review'].includes(component.pricingStatus)
  );
  const supportedComponents = requirements.components.filter(
    (component) => component.pricingStatus === 'supported' && component.missingFields.length === 0
  );
  const notImplementedComponents = requirements.components.filter(
    (component) => component.pricingStatus === 'not_implemented' && component.missingFields.length === 0
  );

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
      <div className="border-b border-line bg-slate-50 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-navy">Step 2: Review Detected Requirements</h2>
            <p className="mt-1 text-sm text-muted">Confirm extracted Azure services before calculation. Expand rows to inspect evidence and assumptions.</p>
          </div>
          <span className="rounded-full border border-violet/20 bg-violet/10 px-3 py-1 text-xs font-semibold text-violet">{extractionLabel}</span>
        </div>
      </div>

      <div className="grid gap-3 bg-white px-5 py-4 sm:grid-cols-4">
        <SummaryTile label="Azure region" value={requirements.region.providerRegion.azure} />
        <SummaryTile label="Supported" value={String(supportedComponents.length)} />
        <SummaryTile label="Not implemented" value={String(notImplementedComponents.length)} />
        <SummaryTile label="Needs review" value={String(reviewComponents.length)} tone={reviewComponents.length > 0 ? 'warning' : 'neutral'} />
      </div>

      <div className="px-5 py-5">
        <div className="rounded-lg border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-slate-800">
          Cloud focus: Azure pricing only. Unsupported and not implemented services are detected for review, but excluded from the estimate total.
        </div>
        <ComponentGroup
          title="Supported for pricing"
          components={supportedComponents}
          emptyText="No supported pricing components detected yet."
          onComponentUpdate={onComponentUpdate}
        />
        <ComponentGroup
          title="Detected but pricing not implemented"
          components={notImplementedComponents}
          emptyText="No unpriced detected services."
          onComponentUpdate={onComponentUpdate}
        />
        {reviewComponents.length > 0 ? (
          <ComponentGroup title="Needs review" components={reviewComponents} emptyText="No components need review." onComponentUpdate={onComponentUpdate} />
        ) : null}
      </div>
    </section>
  );
}

function SummaryTile({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'warning' }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 px-4 py-3 shadow-sm">
      <div className="text-xs font-semibold uppercase text-muted">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${tone === 'warning' ? 'text-warning' : 'text-navy'}`}>{value}</div>
    </div>
  );
}

function ComponentGroup({
  title,
  components,
  emptyText,
  onComponentUpdate
}: {
  title: string;
  components: NormalizedInfrastructureRequirement['components'];
  emptyText: string;
  onComponentUpdate: (componentId: string, updates: Record<string, unknown>) => void;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-graphite">{components.length}</span>
      </div>
      {components.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{emptyText}</p>
      ) : (
        <div className="mt-3 grid gap-3">
          {components.map((component) => (
            <ComponentRequirementCard key={component.id} component={component} onUpdate={onComponentUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
