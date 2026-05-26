import type { AzureRegion, Category, ImageType, OperatingSystem, PricingModel, Tier, VmOptions } from '../types/estimate';

export interface VmCalculatorFormValues {
  region: string;
  operatingSystem: OperatingSystem;
  imageType: ImageType;
  tier: Tier;
  category: Category;
  instanceSeries: string;
  instanceSku: string;
  quantity: number;
  hours: number;
  pricingModel: PricingModel;
}

interface VmCalculatorFormProps {
  values: VmCalculatorFormValues;
  regions: AzureRegion[];
  options: VmOptions | null;
  loading: boolean;
  onChange: (values: VmCalculatorFormValues) => void;
  onSubmit: () => void;
}

export function VmCalculatorForm({ values, regions, options, loading, onChange, onSubmit }: VmCalculatorFormProps) {
  const selectedSeries = options?.instanceSeries.find((series) => series.value === values.instanceSeries);

  function update<K extends keyof VmCalculatorFormValues>(key: K, value: VmCalculatorFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function updateSeries(seriesValue: string) {
    const nextSeries = options?.instanceSeries.find((series) => series.value === seriesValue);
    onChange({
      ...values,
      instanceSeries: seriesValue,
      instanceSku: nextSeries?.instances[0]?.value ?? values.instanceSku
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
    >
      <div className="space-y-5">
        <SelectField label="Region" value={values.region} onChange={(value) => update('region', value)} options={regions.map((region) => ({ label: `${region.name} (${region.value})`, value: region.value }))} />
        <SelectField label="Operating system" value={values.operatingSystem} onChange={(value) => update('operatingSystem', value as OperatingSystem)} options={options?.operatingSystems ?? []} />
        <SelectField label="Type / image" value={values.imageType} onChange={(value) => update('imageType', value as ImageType)} options={options?.imageTypes ?? []} />
        <SelectField label="Tier" value={values.tier} onChange={(value) => update('tier', value as Tier)} options={options?.tiers ?? []} />
        <SelectField label="Category" value={values.category} onChange={(value) => update('category', value as Category)} options={options?.categories ?? []} />
        <SelectField label="Instance series" value={values.instanceSeries} onChange={updateSeries} options={options?.instanceSeries ?? []} />
        <SelectField label="Instance" value={values.instanceSku} onChange={(value) => update('instanceSku', value)} options={selectedSeries?.instances ?? []} />

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Number of virtual machines" value={values.quantity} min={1} onChange={(value) => update('quantity', value)} />
          <NumberField label="Hours" value={values.hours} min={1} onChange={(value) => update('hours', value)} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-semibold uppercase text-slate-500">Pricing model</div>
          <div className="mt-1 text-sm font-semibold text-slate-950">Pay as you go</div>
        </div>

        <button
          type="submit"
          disabled={loading || !options || regions.length === 0}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-azure px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? 'Estimating...' : 'Estimate VM cost'}
        </button>
      </div>
    </form>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-azure focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}

function NumberField({ label, value, min, onChange }: NumberFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-azure focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}
