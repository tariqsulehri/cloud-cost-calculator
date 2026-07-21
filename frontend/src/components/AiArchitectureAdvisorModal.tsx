import { Bot, Check, ChevronRight, Copy, Info, Layers, Lock, ShieldCheck, Sparkles, Sliders, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Provider } from '../types/estimate';

interface AiArchitectureAdvisorModalProps {
  initialProvider: Provider;
  onClose: () => void;
  onApplyPrompt: (packedPrompt: string) => void;
}

type WorkloadType = 'saas' | 'ecommerce' | 'microservices' | 'analytics' | 'custom';
type TrafficScale = 'small' | 'medium' | 'large' | 'enterprise';
type ComplianceMode = 'standard' | 'hipaa' | 'pci' | 'soc2';
type ScheduleProfile = 'always_on' | 'business_hours' | 'spiky';
type BudgetGuardrail = 'budget' | 'standard' | 'high_growth';

interface WorkloadPreset {
  id: WorkloadType;
  title: string;
  simpleTitle: string;
  description: string;
  icon: string;
  defaultScale: TrafficScale;
}

const WORKLOAD_PRESETS: WorkloadPreset[] = [
  {
    id: 'saas',
    title: 'SaaS Web Application',
    simpleTitle: 'Web Portal / Software App',
    description: 'Web application with user accounts, main database, and fast memory cache.',
    icon: '🌐',
    defaultScale: 'medium'
  },
  {
    id: 'ecommerce',
    title: 'E-Commerce Platform',
    simpleTitle: 'Online Store / Shopping Site',
    description: 'Shopping site with product catalog, image uploads, fast file delivery & high uptime.',
    icon: '🛒',
    defaultScale: 'medium'
  },
  {
    id: 'microservices',
    title: 'Microservices / Containers',
    simpleTitle: 'Containerized Microservices Cluster',
    description: 'Multiple app services running in containers (Kubernetes) with automatic scaling.',
    icon: '☸️',
    defaultScale: 'large'
  },
  {
    id: 'analytics',
    title: 'Data Analytics & Reporting',
    simpleTitle: 'Data Pipeline & Business Intelligence',
    description: 'Data ingestion pipeline for high-volume logs, processing jobs, and reporting.',
    icon: '📊',
    defaultScale: 'large'
  },
  {
    id: 'custom',
    title: 'Custom Workload',
    simpleTitle: 'Custom Business Goal',
    description: 'Specify your custom business needs and let the system recommend server sizing.',
    icon: '⚙️',
    defaultScale: 'small'
  }
];

const SCALE_SPECS: Record<TrafficScale, { label: string; simpleLabel: string; vcpu: number; ram: number; dbVcpu: number; dbRam: number; dbStorage: number; redisGb: number; cdnGb: number }> = {
  small: { label: 'Small (~5,000 daily users)', simpleLabel: 'Small Scale (~5k daily users)', vcpu: 2, ram: 8, dbVcpu: 2, dbRam: 8, dbStorage: 100, redisGb: 2, cdnGb: 500 },
  medium: { label: 'Medium (~50,000 daily users)', simpleLabel: 'Medium Scale (~50k daily users)', vcpu: 4, ram: 16, dbVcpu: 4, dbRam: 16, dbStorage: 256, redisGb: 4, cdnGb: 1024 },
  large: { label: 'Large (~200,000 daily users)', simpleLabel: 'Large Scale (~200k daily users)', vcpu: 8, ram: 32, dbVcpu: 8, dbRam: 32, dbStorage: 512, redisGb: 8, cdnGb: 2048 },
  enterprise: { label: 'Enterprise (~1,000,000+ daily users)', simpleLabel: 'Enterprise Scale (~1M+ daily users)', vcpu: 16, ram: 64, dbVcpu: 16, dbRam: 64, dbStorage: 1024, redisGb: 16, cdnGb: 5000 }
};

const SCHEDULE_LABELS: Record<ScheduleProfile, { label: string; simple: string; hours: number; note: string }> = {
  always_on: { label: '24/7 Always On (730 hrs/mo)', simple: '24/7 Continuous (Standard 730 hours/month)', hours: 730, note: 'Servers run non-stop all day every day.' },
  business_hours: { label: 'Business Hours Only (260 hrs/mo - Save 60%)', simple: 'Business Hours Only (Save ~60% on Server Costs)', hours: 260, note: 'Servers automatically pause during nights and weekends.' },
  spiky: { label: 'Spiky Peak Traffic (~450 hrs/mo average)', simple: 'Autoscaling Peak Traffic (~450 avg hours/month)', hours: 450, note: 'Baseline servers scale up automatically during busy traffic spikes.' }
};

const COMPLIANCE_LABELS: Record<ComplianceMode, { label: string; simple: string; detail: string }> = {
  standard: { label: 'Standard Security', simple: 'Standard Protection (Basic Firewall & Public IP)', detail: 'Standard cloud security suitable for most public web apps.' },
  hipaa: { label: 'Healthcare (HIPAA Compliance)', simple: 'Healthcare & Patient Data (HIPAA Level Security)', detail: 'Includes encrypted database HA, audit logging, Key Vault & strict privacy controls.' },
  pci: { label: 'Payments (PCI-DSS Compliance)', simple: 'Payment Processing (PCI-DSS Level Security)', detail: 'Includes Web Application Firewall (WAF), NAT Gateway & Key Vault secret management.' },
  soc2: { label: 'Enterprise (SOC2 / ISO 27001)', simple: 'Enterprise Security (SOC2 Compliance Standard)', detail: 'Includes multi-region backups, central log ingestion & continuous monitoring.' }
};

export function AiArchitectureAdvisorModal({ initialProvider, onClose, onApplyPrompt }: AiArchitectureAdvisorModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<WorkloadType>('saas');
  const [scale, setScale] = useState<TrafficScale>('medium');
  const [schedule, setSchedule] = useState<ScheduleProfile>('always_on');
  const [compliance, setCompliance] = useState<ComplianceMode>('standard');
  const [customGoal, setCustomGoal] = useState('');
  const [highAvailability, setHighAvailability] = useState(true);
  const [step, setStep] = useState<'intent' | 'review'>('intent');
  const [copied, setCopied] = useState(false);

  // Compute recommended topology specs based on selections
  const specs = useMemo(() => {
    const base = SCALE_SPECS[scale];
    const isEcommerce = selectedPreset === 'ecommerce';
    const isK8s = selectedPreset === 'microservices';
    const isAnalytics = selectedPreset === 'analytics';
    const isHipaaOrPci = compliance === 'hipaa' || compliance === 'pci' || compliance === 'soc2';

    return {
      appNodes: isK8s ? 3 : 2,
      appVcpu: base.vcpu,
      appRam: base.ram,
      monthlyHours: SCHEDULE_LABELS[schedule].hours,
      dbEngine: isAnalytics ? 'BigQuery / Data Warehouse' : 'PostgreSQL Managed Database',
      dbVcpu: base.dbVcpu,
      dbRam: base.dbRam,
      dbStorageGb: base.dbStorage,
      redisGb: base.redisGb,
      objectStorageTb: isEcommerce || isAnalytics ? 2 : 1,
      cdnEgressGb: base.cdnGb,
      hasFirewall: isHipaaOrPci,
      hasNatGateway: isHipaaOrPci,
      hasKeyVault: isHipaaOrPci,
      hasHa: highAvailability || compliance === 'hipaa'
    };
  }, [selectedPreset, scale, schedule, compliance, highAvailability]);

  // Construct packed prompt from specs using clear, plain-English terms
  const packedPrompt = useMemo(() => {
    const lines: string[] = [];
    const presetObj = WORKLOAD_PRESETS.find((p) => p.id === selectedPreset);
    const goalText = customGoal.trim() ? customGoal.trim() : presetObj?.simpleTitle ?? 'Enterprise Workload';

    lines.push(`Cloud Infrastructure Goal: ${goalText} (${SCALE_SPECS[scale].simpleLabel}).`);
    lines.push(`- Web & Application Servers: ${specs.appNodes}x Application Server Instances with ${specs.appVcpu} vCPU and ${specs.appRam} GB RAM each, running ${specs.monthlyHours} hours/month (${SCHEDULE_LABELS[schedule].simple}).`);
    lines.push(`- Main Relational Database: Managed ${specs.dbEngine} with ${specs.dbVcpu} vCPU, ${specs.dbRam} GB RAM, and ${specs.dbStorageGb} GB SSD Storage${specs.hasHa ? ' with High Availability (Automatic Failover Backup in second data center)' : ''}.`);
    lines.push(`- Fast Memory Cache: Managed Redis Cache with ${specs.redisGb} GB memory for fast web response.`);
    lines.push(`- File & Object Storage: Object Storage ${specs.objectStorageTb} TB capacity for file uploads and automated backups.`);
    lines.push(`- Network & Content Delivery: 1x HTTP/S Load Balancer with ${specs.cdnEgressGb} GB CDN monthly data transfer.`);

    if (compliance !== 'standard') {
      lines.push(`- Security & Compliance (${COMPLIANCE_LABELS[compliance].simple}): Include Enterprise Cloud Firewall, 1x NAT Gateway for secure outbound traffic, Key Vault secret management, and Central Audit Log Storage.`);
    }

    return lines.join('\n');
  }, [selectedPreset, scale, schedule, compliance, customGoal, specs]);

  // Generate plain-English Solution Architecture Rationale
  const rationaleText = useMemo(() => {
    const presetObj = WORKLOAD_PRESETS.find((p) => p.id === selectedPreset);
    return `This cloud architecture is recommended for ${presetObj?.simpleTitle ?? 'your app'} at ${SCALE_SPECS[scale].simpleLabel}. We chose ${specs.appNodes} app servers (${specs.appVcpu} vCPU / ${specs.appRam}GB RAM) to ensure smooth performance. The ${specs.dbEngine} includes ${specs.hasHa ? 'automatic failover HA to prevent downtime' : 'standard database storage'}. Fast memory caching (${specs.redisGb}GB Redis) reduces database strain, while ${COMPLIANCE_LABELS[compliance].simple} ensures your data meets regulatory standards.`;
  }, [selectedPreset, scale, compliance, specs]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(packedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplyPrompt(packedPrompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-line bg-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-navy px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20 text-tealSoft">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold">AI Architecture Advisor & Smart Prompt Studio</h2>
              <p className="text-xs text-slate-300">Simple, guided cloud sizing & spacious prompt preview studio</p>
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
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {step === 'intent' ? (
            <>
              {/* Step 1: Workload Type */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-2">
                  1. What kind of application or project are you building?
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
                        <div className="text-xs font-bold text-navy">{preset.simpleTitle}</div>
                        <div className="mt-0.5 text-[11px] leading-4 text-slate-500">{preset.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Goal Input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1">
                  Custom Business Goal or Details (Optional)
                </label>
                <input
                  type="text"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="e.g. Online store with 50,000 orders/month, fast image upload, and high database uptime"
                  className="w-full rounded-lg border border-line px-3.5 py-2.5 text-xs focus:border-azure focus:outline-none focus:ring-2 focus:ring-azure/20"
                />
              </div>

              {/* Step 2: Traffic Scale */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-2">
                  2. How many daily users or traffic do you expect?
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
                      {SCALE_SPECS[scKey].simpleLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Running Schedule */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-2">
                  3. Server Running Schedule (Cost Savings)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(SCHEDULE_LABELS) as ScheduleProfile[]).map((schKey) => (
                    <button
                      key={schKey}
                      type="button"
                      onClick={() => setSchedule(schKey)}
                      className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                        schedule === schKey
                          ? 'border-azure bg-blue-50/70 ring-2 ring-azure/20'
                          : 'border-line bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-navy">{SCHEDULE_LABELS[schKey].simple}</div>
                        <div className="mt-1 text-[11px] text-slate-500 leading-4">{SCHEDULE_LABELS[schKey].note}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Security & Compliance */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-2">
                  4. Security & Regulatory Compliance Standard
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(COMPLIANCE_LABELS) as ComplianceMode[]).map((cmpKey) => (
                    <button
                      key={cmpKey}
                      type="button"
                      onClick={() => setCompliance(cmpKey)}
                      className={`rounded-xl border p-3 text-left transition ${
                        compliance === cmpKey
                          ? 'border-azure bg-blue-50/70 ring-2 ring-azure/20'
                          : 'border-line bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-navy">{COMPLIANCE_LABELS[cmpKey].simple}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500 leading-4">{COMPLIANCE_LABELS[cmpKey].detail}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Step 2 Review: AI Recommendation Summary */}
              <div className="space-y-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    AI Recommended Architecture Sizing
                  </div>
                  <p className="mt-1 text-xs text-emerald-800">
                    Review your clean, spacious infrastructure prompt below before applying it to the estimator.
                  </p>
                </div>

                {/* Plain-English Topology Spec Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">Web & App Servers</div>
                    <div className="text-xs font-bold text-navy mt-0.5">{specs.appNodes}x Servers</div>
                    <div className="text-[11px] text-slate-600">{specs.appVcpu} vCPU / {specs.appRam} GB RAM ({specs.monthlyHours} hrs/mo)</div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">Main Database</div>
                    <div className="text-xs font-bold text-navy mt-0.5">{specs.dbEngine}</div>
                    <div className="text-[11px] text-slate-600">{specs.dbVcpu} vCPU / {specs.dbRam} GB RAM / {specs.dbStorageGb} GB SSD</div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">Fast Memory Cache</div>
                    <div className="text-xs font-bold text-navy mt-0.5">Redis Memory Cache</div>
                    <div className="text-[11px] text-slate-600">{specs.redisGb} GB Memory</div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">File Storage</div>
                    <div className="text-xs font-bold text-navy mt-0.5">Object Storage</div>
                    <div className="text-[11px] text-slate-600">{specs.objectStorageTb} TB Storage Capacity</div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">Global Network</div>
                    <div className="text-xs font-bold text-navy mt-0.5">Load Balancer + CDN</div>
                    <div className="text-[11px] text-slate-600">{specs.cdnEgressGb} GB CDN Egress Transfer</div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="text-[10px] uppercase font-bold text-muted">Security Standard</div>
                    <div className="text-xs font-bold text-navy mt-0.5">{COMPLIANCE_LABELS[compliance].simple}</div>
                    <div className="text-[11px] text-slate-600">{specs.hasFirewall ? 'Firewall + NAT Gateway + Key Vault' : 'Basic Security'}</div>
                  </div>
                </div>

                {/* Architecture Rationale Explanation Box */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <Info className="h-4 w-4 text-blue-600" />
                    Why This Architecture Was Recommended
                  </div>
                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    {rationaleText}
                  </p>
                </div>

                {/* Spacious Packed Prompt Preview Box */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">
                      Packed Infrastructure Prompt Preview (Maximum Reading Space)
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="inline-flex items-center gap-1 text-xs font-bold text-azure hover:text-blue-700"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? 'Copied!' : 'Copy Prompt'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={packedPrompt}
                    rows={10}
                    className="w-full rounded-xl border border-line bg-slate-900 p-4 text-xs font-mono leading-6 text-emerald-300 focus:outline-none shadow-inner"
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
              ← Back to Selections
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
              onClick={() => setStep('review')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-azure bg-azure px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Sparkles className="h-4 w-4" />
              Generate AI Sizing & Review Prompt
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal bg-teal px-7 py-2.5 text-xs font-bold text-white shadow-md transition hover:brightness-110"
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
