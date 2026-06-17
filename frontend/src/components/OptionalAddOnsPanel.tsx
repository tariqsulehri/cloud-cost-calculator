import { Cable, Check, ShieldCheck } from 'lucide-react';
import type { NormalizedComponent, NormalizedComponentType } from '../types/estimate';

type FieldKind = 'number' | 'text' | 'boolean';

interface AddOnField {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  defaultValue?: string;
}

interface AddOnDefinition {
  key: string;
  name: string;
  type: NormalizedComponentType;
  providerServiceHint: NormalizedComponent['providerServiceHint'];
  description: string;
  fields: AddOnField[];
}

interface OptionalAddOnsPanelProps {
  components: NormalizedComponent[];
  onUpsert: (component: NormalizedComponent) => void;
  onRemove: (componentId: string) => void;
}

const addOns: AddOnDefinition[] = [
  {
    key: 'managed-disks',
    name: 'Managed Disks',
    type: 'block_storage',
    providerServiceHint: { azure: 'Azure Managed Disks', aws: 'Amazon EBS', gcp: 'Persistent Disk' },
    description: 'VM or database disks.',
    fields: [
      { key: 'diskCount', label: 'Disks', kind: 'number', placeholder: '2', defaultValue: '1' },
      { key: 'diskSizeGb', label: 'Size GB', kind: 'number', placeholder: '128' },
      { key: 'diskTier', label: 'Tier', kind: 'text', placeholder: 'standard-ssd', defaultValue: 'standard-ssd' }
    ]
  },
  {
    key: 'nat-gateway',
    name: 'NAT Gateway',
    type: 'network',
    providerServiceHint: { azure: 'Azure NAT Gateway', aws: 'NAT Gateway', gcp: 'Cloud NAT' },
    description: 'Outbound private subnet internet access.',
    fields: [
      { key: 'gatewayCount', label: 'Gateways', kind: 'number', placeholder: '1', defaultValue: '1' },
      { key: 'monthlyDataProcessedGb', label: 'Processed GB', kind: 'number', placeholder: '500' }
    ]
  },
  {
    key: 'public-ip',
    name: 'Public IP',
    type: 'network',
    providerServiceHint: { azure: 'Azure Public IP Address', aws: 'Elastic IP', gcp: 'External IP Address' },
    description: 'Static public IP addresses.',
    fields: [
      { key: 'publicIpCount', label: 'IP count', kind: 'number', placeholder: '2', defaultValue: '1' },
      { key: 'ipSku', label: 'SKU', kind: 'text', placeholder: 'standard', defaultValue: 'standard' }
    ]
  },
  {
    key: 'private-endpoint',
    name: 'Private Endpoint',
    type: 'network',
    providerServiceHint: { azure: 'Azure Private Endpoint', aws: 'AWS PrivateLink', gcp: 'Private Service Connect' },
    description: 'Private access to PaaS services.',
    fields: [
      { key: 'endpointCount', label: 'Endpoints', kind: 'number', placeholder: '3', defaultValue: '1' },
      { key: 'monthlyDataProcessedGb', label: 'Processed GB', kind: 'number', placeholder: '200' }
    ]
  },
  {
    key: 'dns',
    name: 'DNS',
    type: 'network',
    providerServiceHint: { azure: 'Azure DNS', aws: 'Route 53', gcp: 'Cloud DNS' },
    description: 'Hosted zones and DNS queries.',
    fields: [
      { key: 'dnsZoneCount', label: 'Zones', kind: 'number', placeholder: '1', defaultValue: '1' },
      { key: 'dnsQueriesMillion', label: 'Queries M', kind: 'number', placeholder: '10' }
    ]
  },
  {
    key: 'key-vault',
    name: 'Key Vault',
    type: 'security',
    providerServiceHint: { azure: 'Azure Key Vault', aws: 'AWS Secrets Manager / KMS', gcp: 'Secret Manager / Cloud KMS' },
    description: 'Secrets, keys, and certificates.',
    fields: [{ key: 'operationsCount', label: 'Operations', kind: 'number', placeholder: '100000' }]
  },
  {
    key: 'azure-firewall',
    name: 'Azure Firewall',
    type: 'security',
    providerServiceHint: { azure: 'Azure Firewall', aws: 'AWS Network Firewall', gcp: 'Cloud Firewall' },
    description: 'Central network firewall.',
    fields: [
      { key: 'firewallCount', label: 'Firewalls', kind: 'number', placeholder: '1', defaultValue: '1' },
      { key: 'firewallTier', label: 'Tier', kind: 'text', placeholder: 'standard', defaultValue: 'standard' },
      { key: 'monthlyDataProcessedGb', label: 'Processed GB', kind: 'number', placeholder: '1000' }
    ]
  },
  {
    key: 'app-service',
    name: 'App Service',
    type: 'compute',
    providerServiceHint: { azure: 'Azure App Service', aws: 'AWS Elastic Beanstalk / App Runner', gcp: 'App Engine / Cloud Run' },
    description: 'Web app hosting plan.',
    fields: [
      { key: 'instanceCount', label: 'Instances', kind: 'number', placeholder: '2', defaultValue: '1' },
      { key: 'planTier', label: 'Plan tier', kind: 'text', placeholder: 'standard', defaultValue: 'standard' },
      { key: 'monthlyHours', label: 'Hours', kind: 'number', placeholder: '730', defaultValue: '730' }
    ]
  },
  {
    key: 'sql-database',
    name: 'SQL Database',
    type: 'database',
    providerServiceHint: { azure: 'Azure SQL Database', aws: 'Amazon RDS for SQL Server', gcp: 'Cloud SQL for SQL Server' },
    description: 'Managed SQL database.',
    fields: [
      { key: 'vcpu', label: 'vCore', kind: 'number', placeholder: '4' },
      { key: 'storageGb', label: 'Storage GB', kind: 'number', placeholder: '256' },
      { key: 'highAvailability', label: 'HA', kind: 'boolean', defaultValue: 'false' }
    ]
  },
  {
    key: 'backup',
    name: 'Azure Backup',
    type: 'backup',
    providerServiceHint: { azure: 'Azure Backup', aws: 'AWS Backup', gcp: 'Backup and DR Service' },
    description: 'Protected data and retention.',
    fields: [
      { key: 'protectedDataGb', label: 'Protected GB', kind: 'number', placeholder: '1024' },
      { key: 'retentionDays', label: 'Retention days', kind: 'number', placeholder: '30', defaultValue: '30' }
    ]
  },
  {
    key: 'front-door',
    name: 'Front Door',
    type: 'cdn',
    providerServiceHint: { azure: 'Azure Front Door', aws: 'Amazon CloudFront', gcp: 'Cloud CDN' },
    description: 'Global edge routing and acceleration.',
    fields: [
      { key: 'dataTransferGb', label: 'Transfer GB', kind: 'number', placeholder: '1024' },
      { key: 'requestCount', label: 'Requests', kind: 'number', placeholder: '10000000' }
    ]
  },
  {
    key: 'container-apps',
    name: 'Container Apps',
    type: 'serverless',
    providerServiceHint: { azure: 'Azure Container Apps', aws: 'AWS App Runner / ECS Fargate', gcp: 'Cloud Run' },
    description: 'Serverless container runtime.',
    fields: [
      { key: 'vcpuSeconds', label: 'vCPU seconds', kind: 'number', placeholder: '360000' },
      { key: 'memoryGbSeconds', label: 'GB seconds', kind: 'number', placeholder: '720000' },
      { key: 'requestCount', label: 'Requests', kind: 'number', placeholder: '1000000' }
    ]
  }
];

export function OptionalAddOnsPanel({ components, onUpsert, onRemove }: OptionalAddOnsPanelProps) {
  return (
    <section className="rounded-xl border border-line bg-panel shadow-card">
      <div className="border-b border-lineSoft bg-slate-50/70 px-5 py-4">
        <div className="dashboard-kicker text-violet">
          <Cable className="h-3.5 w-3.5" aria-hidden="true" />
          Optional add-ons
        </div>
        <h2 className="mt-2 text-base font-bold text-navy">Add common Azure costs</h2>
        <p className="mt-0.5 max-w-3xl text-xs leading-5 text-muted">
          Select only what the customer needs. Complete add-ons use early proposal rates until exact Azure meters are connected.
        </p>
      </div>

      <div className="grid gap-2.5 p-4 md:grid-cols-2 xl:grid-cols-3">
        {addOns.map((addOn) => {
          const component = components.find((item) => item.id === componentId(addOn.key));
          return <AddOnTile key={addOn.key} addOn={addOn} component={component} onUpsert={onUpsert} onRemove={onRemove} />;
        })}
      </div>
    </section>
  );
}

function AddOnTile({
  addOn,
  component,
  onUpsert,
  onRemove
}: {
  addOn: AddOnDefinition;
  component: NormalizedComponent | undefined;
  onUpsert: (component: NormalizedComponent) => void;
  onRemove: (componentId: string) => void;
}) {
  const selected = Boolean(component);
  const values = Object.fromEntries(addOn.fields.map((field) => [field.key, fieldValue(component, field)]));
  const hasMissingFields = addOn.fields.some((field) => !values[field.key]);

  function update(nextValues: Record<string, string>) {
    const missingFields = addOn.fields.filter((field) => !nextValues[field.key]).map((field) => field.key);
    const parsedValues = Object.fromEntries(
      addOn.fields
        .filter((field) => nextValues[field.key] !== '')
        .map((field) => [field.key, parseFieldValue(field, nextValues[field.key])])
    );

    onUpsert({
      id: componentId(addOn.key),
      type: addOn.type,
      name: addOn.name,
      providerServiceHint: addOn.providerServiceHint,
      pricingStatus: missingFields.length > 0 ? 'missing_required_fields' : 'not_implemented',
      confidence: 'high',
      missingFields,
      assumptions: ['Optional add-on selected by user. Price only this add-on when details are provided.'],
      rawText: `${addOn.name} optional add-on`,
      optionalAddon: addOn.key,
      ...parsedValues
    } as NormalizedComponent);
  }

  return (
    <article className={`rounded-lg border p-3 transition ${selected ? 'border-teal/40 bg-teal/5' : 'border-line bg-white hover:border-azure/30'}`}>
      <div className="flex items-start justify-between gap-3">
        <label className="flex min-w-0 items-start gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => {
              if (event.target.checked) {
                update(values);
              } else {
                onRemove(componentId(addOn.key));
              }
            }}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal focus:ring-teal"
          />
          <span className="min-w-0">
            <span className="block text-xs font-bold text-navy">{addOn.name}</span>
            <span className="mt-0.5 block text-[11px] leading-4 text-muted">{addOn.description}</span>
          </span>
        </label>
        {selected ? (
          <span
            className={`inline-flex flex-none items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
              hasMissingFields ? 'bg-amber-100 text-amber-800' : 'bg-teal text-white'
            }`}
            title={hasMissingFields ? 'Add missing values before this cost is included.' : 'This add-on has enough details for planning cost.'}
          >
            <Check className="h-3 w-3" aria-hidden="true" />
            {hasMissingFields ? 'Need info' : 'Will price'}
          </span>
        ) : (
          <ShieldCheck className="h-4 w-4 flex-none text-slate-300" aria-hidden="true" />
        )}
      </div>

      {selected ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {addOn.fields.map((field) => (
            <label key={field.key} className="block">
              <span className="text-[10px] font-semibold uppercase text-muted">{field.label}</span>
              {field.kind === 'boolean' ? (
                <select
                  value={values[field.key]}
                  onChange={(event) => update({ ...values, [field.key]: event.target.value })}
                  className="mt-1 h-8 w-full rounded-md border border-line bg-white px-2 text-xs text-ink outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
                >
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <input
                  type={field.kind === 'number' ? 'number' : 'text'}
                  min={field.kind === 'number' ? 0 : undefined}
                  value={values[field.key]}
                  onChange={(event) => update({ ...values, [field.key]: event.target.value })}
                  placeholder={field.placeholder}
                  className="mt-1 h-8 w-full rounded-md border border-line bg-white px-2 text-xs text-ink outline-none placeholder:text-slate-400 focus:border-teal focus:ring-4 focus:ring-teal/10"
                />
              )}
            </label>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function componentId(key: string): string {
  return `optional-${key}`;
}

function fieldValue(component: NormalizedComponent | undefined, field: AddOnField): string {
  const value = component?.[field.key];
  if (value === null || value === undefined || value === '') {
    return field.defaultValue ?? '';
  }
  return String(value);
}

function parseFieldValue(field: AddOnField, value: string): unknown {
  if (field.kind === 'number') {
    return Number(value);
  }
  if (field.kind === 'boolean') {
    return value === 'true';
  }
  return value;
}
