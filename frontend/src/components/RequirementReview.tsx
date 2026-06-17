import { ComponentRequirementCard } from './ComponentRequirementCard';
import { InfoBadge } from './InfoBadge';
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
    <section className="overflow-hidden rounded-md border border-line bg-panel shadow-card">
      <div className="border-b border-line bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-navy">Step 2: Review services</h2>
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

      <div className="grid gap-2 bg-white px-4 py-3 sm:grid-cols-4">
        <SummaryTile label="Azure region" value={requirements.region.providerRegion.azure} description="The Azure location used for pricing." />
        <SummaryTile label="Ready" value={String(supportedComponents.length)} description="These services have enough details to price." />
        <SummaryTile label="Price not ready" value={String(notImplementedComponents.length)} description="The app detected these services, but pricing is not built yet." />
        <SummaryTile
          label="Need info"
          value={String(reviewComponents.length)}
          description="These services need missing details or a quick check."
          tone={reviewComponents.length > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <div className="px-4 py-4">
        <div className="rounded-md border border-teal/20 bg-teal/5 px-3 py-2 text-xs text-slate-800">
          Azure pricing is active now. Services marked Need info, Price not ready, or Can't price are not included in the total.
        </div>
        <ComponentGroup
          title="Supported for pricing"
          components={supportedComponents}
          emptyText="No supported pricing components detected yet."
          onComponentUpdate={onComponentUpdate}
        />
        <ComponentGroup
          title="Detected, price not ready"
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

function SummaryTile({ label, value, description, tone = 'neutral' }: { label: string; value: string; description: string; tone?: 'neutral' | 'warning' }) {
  return (
    <div title={description} className="rounded-md border border-line bg-slate-50 px-3 py-2 shadow-sm">
      <div className="text-[10px] font-semibold uppercase text-muted">{label}</div>
      <div className={`mt-0.5 text-base font-semibold ${tone === 'warning' ? 'text-warning' : 'text-navy'}`}>{value}</div>
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
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase text-navy">{title}</h3>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-graphite">{components.length}</span>
      </div>
      {components.length === 0 ? (
        <p className="mt-1.5 text-xs text-muted">{emptyText}</p>
      ) : (
        <div className="mt-2 grid gap-2">
          {components.map((component) => (
            <ComponentRequirementCard key={component.id} component={component} onUpdate={onComponentUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
