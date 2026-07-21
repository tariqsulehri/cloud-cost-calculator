import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert, Sparkles, Trash2, X } from 'lucide-react';
import type { NormalizedComponent, NormalizedInfrastructureRequirement, Provider } from '../types/estimate';

interface PricingReadinessDialogProps {
  isOpen: boolean;
  requirements: NormalizedInfrastructureRequirement | null;
  provider: Provider;
  onClose: () => void;
  onAutoFixComponent: (componentId: string, defaults: Record<string, unknown>) => void;
  onAutoFixAll: () => void;
  onRemoveComponent: (componentId: string) => void;
}

const providerLabels: Record<Provider, string> = {
  azure: 'Azure',
  aws: 'AWS',
  gcp: 'GCP'
};

export function PricingReadinessDialog({
  isOpen,
  requirements,
  provider,
  onClose,
  onAutoFixComponent,
  onAutoFixAll,
  onRemoveComponent
}: PricingReadinessDialogProps) {
  if (!isOpen || !requirements) return null;

  const components = requirements.components;
  const unpricedComponents = components.filter(
    (c) => c.pricingStatus === 'missing_required_fields' || c.pricingStatus === 'unsupported' || c.pricingStatus === 'needs_review' || c.missingFields.length > 0
  );

  const totalCount = components.length;
  const readyCount = totalCount - unpricedComponents.length;
  const accuracyPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-command">
        {/* Header */}
        <div className="relative border-b border-lineSoft bg-slate-900 px-6 py-5 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close readiness dialog"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-azure/20 text-azure shadow-inner">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Pricing Readiness & Accuracy Guidelines</h2>
              <p className="text-xs text-slate-400">
                Detailed breakdown of readiness, accuracy position, and exclusions for {providerLabels[provider]}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-6 overflow-y-auto p-6 text-xs text-slate-700">
          {/* Accuracy Position Card */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">Current Accuracy Position</h3>
                <p className="mt-0.5 text-xs text-blue-800">
                  Target calculation accuracy is <span className="font-bold">90–95%+</span> for matched public catalog meters.
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-blue-900">{accuracyPercent}%</span>
                <div className="text-[11px] font-semibold text-blue-700">{readyCount} of {totalCount} ready</div>
              </div>
            </div>
          </div>

          {/* Unpriced Components Section */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                Why Specific Components Are Not Ready ({unpricedComponents.length})
              </h3>
              {unpricedComponents.length > 0 && (
                <button
                  type="button"
                  onClick={onAutoFixAll}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Auto-Fix All Missing Fields
                </button>
              )}
            </div>

            {unpricedComponents.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-none" />
                <span className="font-semibold">All components have complete specs and are ready for deterministic pricing!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {unpricedComponents.map((component) => {
                  const defaults = getRecommendedDefaults(component);
                  return (
                    <div key={component.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-navy">{component.name || component.type}</span>
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                              {component.pricingStatus.replace(/_/g, ' ')}
                            </span>
                          </div>
                          {component.rawText && <p className="mt-1 text-[11px] text-muted font-mono bg-white px-2 py-1 rounded border border-amber-200">"{component.rawText}"</p>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onAutoFixComponent(component.id, defaults)}
                            className="inline-flex items-center gap-1 rounded-lg border border-teal bg-teal px-2.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-teal/90"
                          >
                            <Sparkles className="h-3 w-3" />
                            Auto-Fix
                          </button>

                          <button
                            type="button"
                            onClick={() => onRemoveComponent(component.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Detailed Reason */}
                      <div className="mt-2.5 text-[11px] leading-5 text-amber-950">
                        <span className="font-bold">Why not ready: </span>
                        {getUnpricedReason(component)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Standard Exclusions & Why */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">
              Standard Pricing Exclusions & Rationale
            </h3>
            <div className="rounded-xl border border-line bg-slate-50 p-4 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="h-4 w-4 text-slate-400 mt-0.5 flex-none" />
                <div>
                  <span className="font-bold text-navy">Enterprise Agreements & Negotiated Discounts: </span>
                  Calculations use official public list prices. Customer-specific enterprise discounts (EDP/EA) are excluded until custom discount profiles are configured.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <HelpCircle className="h-4 w-4 text-slate-400 mt-0.5 flex-none" />
                <div>
                  <span className="font-bold text-navy">Inter-Region & Cross-AZ Data Egress: </span>
                  Data transfer across availability zones ($0.01/GB) requires explicit network traffic inputs and is excluded from baseline compute hours.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <HelpCircle className="h-4 w-4 text-slate-400 mt-0.5 flex-none" />
                <div>
                  <span className="font-bold text-navy">Database Backup Retention Overage: </span>
                  Standard single automated backup is assumed included. Additional snapshot retention beyond standard policy is excluded.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <HelpCircle className="h-4 w-4 text-slate-400 mt-0.5 flex-none" />
                <div>
                  <span className="font-bold text-navy">Third-Party OS & Marketplace Licensing: </span>
                  Calculations assume standard Linux Ubuntu operating systems. Proprietary software licenses (Red Hat, SUSE, Oracle) are billed separately.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-lineSoft bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg bg-navy px-5 text-xs font-bold text-white shadow-sm transition hover:bg-navy/90"
          >
            Close & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function getUnpricedReason(component: NormalizedComponent): string {
  if (component.missingFields.length > 0) {
    return `Missing required fields: [${component.missingFields.join(', ')}]. Public cloud APIs require exact sizing specs (e.g. vCPU count, RAM GB, or Disk GB) to match retail pricing meters.`;
  }
  if (component.pricingStatus === 'unsupported') {
    return `The specified architecture or configuration for ${component.name} requires manual SKU mapping or custom enterprise sizing review.`;
  }
  if (component.pricingStatus === 'needs_review') {
    return `Component contains ambiguous capacity parameters and requires review before deterministic billing meter lookup.`;
  }
  return `Service pricing meter is not ready in catalog. Manual review is recommended.`;
}

export function getRecommendedDefaults(component: NormalizedComponent): Record<string, unknown> {
  switch (component.type) {
    case 'compute':
      return { vcpu: 4, memoryGb: 16, operatingSystem: 'linux', imageType: 'ubuntu', monthlyHours: 730 };
    case 'database':
      return { vcpu: 4, memoryGb: 16, storageGb: 256, engine: 'postgresql', managed: true, highAvailability: false };
    case 'cache':
      return { memoryGb: 2, engine: 'redis', tier: 'standard' };
    case 'block_storage':
    case 'storage':
      return { diskSizeGb: 128, sizeGb: 128, storageGb: 128, tier: 'premium', quantity: 1 };
    case 'object_storage':
      return { dataStoredGb: 500, accessTier: 'standard', redundancy: 'lrs' };
    case 'cdn':
      return { dataTransferGb: 1024, requestCount: 1_000_000 };
    case 'network':
      return { monthlyEgressGb: 500 };
    case 'load_balancer':
      return { scheme: 'http_s', loadBalancerCount: 1, capacityUnits: 1 };
    case 'kubernetes':
      return { nodeCount: 3, vcpuPerNode: 4, memoryGbPerNode: 16 };
    case 'queue':
      return { messageVolume: 1_000_000 };
    case 'monitoring':
      return { logIngestionGb: 100 };
    default:
      return { vcpu: 2, memoryGb: 8, storageGb: 100 };
  }
}
