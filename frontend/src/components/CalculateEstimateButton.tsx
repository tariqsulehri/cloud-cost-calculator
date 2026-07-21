import { Calculator, Loader2 } from 'lucide-react';

interface CalculateEstimateButtonProps {
  loading: boolean;
  disabled?: boolean;
  label?: string;
  onClick: () => void;
}

export function CalculateEstimateButton({
  loading,
  disabled = false,
  label = 'Calculate Azure cost',
  onClick
}: CalculateEstimateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 text-xs font-bold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
          <span>Calculating Pricing...</span>
        </>
      ) : (
        <>
          <Calculator className="h-4 w-4" aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
