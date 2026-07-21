import { Bot, Check, ChevronRight, Layers, ShieldCheck, Sparkles, Sliders, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Provider } from '../types/estimate';

interface AiArchitectureAdvisorModalProps {
  initialProvider: Provider;
  onClose: () => void;
  onApplyPrompt: (packedPrompt: string) => void;
}

type WorkloadType = 'saas' | 'ecommerce' | 'microservices' | 'analytics' | 'custom';
type TrafficScale = 'small' | 'medium' | 'large' | 'enterprise';

interface WorkloadPreset {
  id: WorkloadType;
  title: string;
  description: string;
  icon: string;
  defaultScale: TrafficScale;
}

const WORKLOAD_PRESETS: WorkloadPreset[] = [
  {
    id: 'saas',
    title: 'SaaS Web Application',
    description: 'Multi-tenant web portal with user authentication, background queue, DB & Redis cache.',
    icon: '🌐',
    defaultScale: 'medium'
  },
  {
    id: 'ecommerce',
    title: 'E-Commerce Platform',
    description: 'High-availability shopping portal with catalog search, image uploads, CDN & database HA.',
    icon: '🛒',
    defaultScale: 'medium'
  },
  {
    id: 'microservices',
    title: 'Microservices / Kubernetes',
    description: 'Containerized microservices cluster with ingress routing, queueing & distributed logging.',
    icon: '☸️',
    defaultScale: 'large'
  },
  {
    id: 'analytics',
    title: 'Data Analytics & ML Pipeline',
    description: 'Data ingestion pipeline with Pub/Sub, serverless ETL jobs, and object data lake.',
    icon: '📊',
    defaultScale: 'large'
  },
  {
    id: 'custom',
    title: 'Custom Enterprise Workload',
    description: 'Specify custom requirements and let AI recommend sizing, HA, and security layers.',
    icon: '⚙️',
    defaultScale: 'small'
  }
];

const SCALE_SPECS: Record<TrafficScale, { label: string; vcpu: number; ram: number; dbVcpu: number; dbRam: number; dbStorage: number; redisGb: number; cdnGb: number }> = {
  small: { label: 'Small (~5k daily users)', vcpu: 2, ram: 8, dbVcpu: 2, dbRam: 8, dbStorage: 100, redisGb: 2, cdnGb: 500 },
  medium: { label: 'Medium (~50k daily users)', vcpu: 4, ram: 16, dbVcpu: 4, dbRam: 16, dbStorage: 256, redisGb: 4, cdnGb: 1024 },
  large: { label: 'Large (~200k daily users)', vcpu: 8, ram: 32, dbVcpu: 8, dbRam: 32, dbStorage: 512, redisGb: 8, cdnGb: 2048 },
  enterprise: { label: 'Enterprise (~1M+ daily users)', vcpu: 16, ram: 64, dbVcpu: 16, dbRam: 64, dbStorage: 1024, redisGb: 16, cdnGb: 5000 }
};

export function AiArchitectureAdvisorModal({ initialProvider, onClose, onApplyPrompt }: AiArchitectureAdvisorModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<WorkloadType>('saas');
  const [scale, setScale] = useState<TrafficScale>('medium');
  const [customGoal, setCustomGoal] = useState('');
  const [highAvailability, setHighAvailability] = useState(true);
  const [includeSecurity, setIncludeSecurity] = useState(true);
  const [step, setStep] = useState<'intent' | 'review'>('intent');

  // Compute recommended topology specs based on selections
  const specs = useMemo(() => {
    const base = SCALE_SPECS[scale];
    const isEcommerce = selectedPreset === 'ecommerce';
    const isK8s = selectedPreset === 'microservices';
    const isAnalytics = selectedPreset === 'analytics';

    return {
      appNodes: isK8s ? 3 : 2,
      appVcpu: base.vcpu,
      appRam: base.ram,
      dbEngine: isAnalytics ? 'BigQuery / Data Warehouse' : 'PostgreSQL Managed DB',
      dbVcpu: base.dbVcpu,
      dbRam: base.dbRam,
      dbStorageGb: base.dbStorage,
      redisGb: base.redisGb,
      objectStorageTb: isEcommerce || isAnalytics ? 2 : 1,
      cdnEgressGb: base.cdnGb,
      hasFirewall: includeSecurity,
      hasNatGateway: includeSecurity,
      hasKeyVault: includeSecurity,
      hasHa: highAvailability
    };
  }, [selectedPreset, scale, highAvailability, includeSecurity]);

  // Construct packed prompt from specs
  const packedPrompt = useMemo(() => {
    const lines: string[] = [];
    const presetObj = WORKLOAD_PRESETS.find((p) => p.id === selectedPreset);
    const goalText = customGoal.trim() ? customGoal.trim() : presetObj?.title ?? 'Enterprise Workload';

    lines.push(`Workload Requirement: ${goalText} (${SCALE_SPECS[scale].label}).`);
    lines.push(`- Compute: ${specs.appNodes}x Application Instances with ${specs.appVcpu} vCPU and ${specs.appRam} GB RAM each running 730 hours/month.`);
    lines.push(`- Database: Managed ${specs.dbEngine} with ${specs.dbVcpu} vCPU, ${specs.dbRam} GB RAM, and ${specs.dbStorageGb} GB SSD storage${specs.hasHa ? ' with High Availability (Multi-AZ)' : ''}.`);
    lines.push(`- Caching: Managed Redis Cache with ${specs.redisGb} GB memory.`);
    lines.push(`- Storage: Object Storage ${specs.objectStorageTb} TB capacity for uploads and backup.`);
    lines.push(`- Networking: 1x HTTP/S Load Balancer with ${specs.cdnEgressGb} GB CDN cache egress transfer.`);

    if (specs.hasFirewall) {
      lines.push(`- Security & Gateway: Include Enterprise Cloud Firewall, 1x NAT Gateway for outbound traffic, and Key Vault secret management.`);
    }

    return lines.join('\n');
  }, [selectedPreset, scale, customGoal, specs]);

  const handleGenerateRecommendation = () => {
    setStep('review');
  };

  const handleApply = () => {
    onApplyPrompt(packedPrompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-line bg-white shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-navy px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20 text-tealSoft">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold">AI Architecture Advisor & Smart Prompt Studio</h2>
              <p className="text-xs text-slate-300">Intelligent infrastructure topology recommendation & prompt packing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wizard Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {step === 'intent' ? (
            <>
              {/* Step 1: Workload Preset Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-2">
                  1. Select Workload Archetype or Goal
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {WORKLOAD_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                        selectedPreset === preset.id
                          ? 'border-azure bg-blue-50/70 ring-2 ring-azure/20'
                          : 'border-line bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{preset.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-navy">{preset.title}</div>
                        <div className="mt-0.5 text-[11px] leading-4 text-slate-500">{preset.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Goal Input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1">
                  Custom Business Goal / Details (Optional)
                </label>
                <input
                  type="text"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="e.g. Healthcare SaaS portal requiring HIPAA compliance, 100k daily users and PostgreSQL HA"
                  className="w-full rounded-lg border border-line px-3.5 py-2.5 text-xs focus:border-azure focus:outline-none focus:ring-2 focus:ring-azure/20"
                />
              </div>

              {/* Step 2: Traffic Scale & Sizing Preset */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-2">
                  2. Select Workload Traffic Scale
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(Object.keys(SCALE_SPECS) as TrafficScale[]).map((scKey) => (
                    <button
                      key={scKey}
                      type="button"
                      onClick={() => setScale(scKey)}
                      className={`rounded-lg border px-3 py-2.5 text-center text-xs font-semibold transition ${
                        scale === scKey
                          ? 'border-azure bg-azure text-white shadow-sm'
                          : 'border-line bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {SCALE_SPECS[scKey].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Enterprise Options */}
              <div className="rounded-xl border border-line bg-slate-50 p-4 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-navy block">
                  3. Enterprise Infrastructure Options
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={highAvailability}
                      onChange={(e) => setHighAvailability(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-azure focus:ring-azure"
                    />
                    High Availability (Multi-AZ Database)
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSecurity}
                      onChange={(e) => setIncludeSecurity(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-azure focus:ring-azure"
                    />
                    Enterprise Security (Cloud Firewall + NAT Gateway + Key Vault)
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Step 2 Review: AI Recommendation Summary */}
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    AI Recommended Architecture Topology
                  </div>
                  <p className="mt-1 text-xs text-emerald-800">
                    Based on your workload selection, the AI has generated the optimal multi-cloud infrastructure prompt.
                  </p>
                </div>

                {/* Topology Spec Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">Compute Tier</div>
                    <div className="text-xs font-bold text-navy mt-0.5">{specs.appNodes}x Instances</div>
                    <div className="text-[11px] text-slate-600">{specs.appVcpu} vCPU / {specs.appRam} GB RAM</div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">Database Tier</div>
                    <div className="text-xs font-bold text-navy mt-0.5">{specs.dbEngine}</div>
                    <div className="text-[11px] text-slate-600">{specs.dbVcpu} vCPU / {specs.dbRam} GB / {specs.dbStorageGb} GB SSD</div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">Caching Tier</div>
                    <div className="text-xs font-bold text-navy mt-0.5">Redis Cache</div>
                    <div className="text-[11px] text-slate-600">{specs.redisGb} GB Memory</div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">Object Storage</div>
                    <div className="text-xs font-bold text-navy mt-0.5">Blob / S3 / GCS</div>
                    <div className="text-[11px] text-slate-600">{specs.objectStorageTb} TB Capacity</div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">Networking</div>
                    <div className="text-xs font-bold text-navy mt-0.5">Load Balancer + CDN</div>
                    <div className="text-[11px] text-slate-600">{specs.cdnEgressGb} GB Egress</div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">Security Layer</div>
                    <div className="text-xs font-bold text-navy mt-0.5">{specs.hasFirewall ? 'Enterprise Firewall' : 'Standard'}</div>
                    <div className="text-[11px] text-slate-600">{specs.hasNatGateway ? 'NAT Gateway + Key Vault' : 'Basic Ports'}</div>
                  </div>
                </div>

                {/* Packed Prompt Preview */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1.5">
                    Packed Infrastructure Prompt Preview
                  </label>
                  <textarea
                    readOnly
                    value={packedPrompt}
                    rows={6}
                    className="w-full rounded-xl border border-line bg-slate-900 p-3.5 text-xs font-mono text-emerald-300 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-line bg-slate-50 px-6 py-4">
          {step === 'review' ? (
            <button
              type="button"
              onClick={() => setStep('intent')}
              className="rounded-lg border border-line bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              ← Back to Intent
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}

          {step === 'intent' ? (
            <button
              type="button"
              onClick={handleGenerateRecommendation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-azure bg-azure px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Sparkles className="h-4 w-4" />
              Generate AI Recommendation
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal bg-teal px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110"
            >
              <Check className="h-4 w-4" />
              ⚡ Pack & Apply Optimized Prompt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
