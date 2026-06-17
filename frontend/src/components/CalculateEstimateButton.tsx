interface CalculateEstimateButtonProps {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function CalculateEstimateButton({ loading, disabled = false, onClick }: CalculateEstimateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex h-9 items-center justify-center rounded-md bg-azure px-4 text-xs font-semibold text-white shadow-glow transition hover:bg-azureDark disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
    >
      {loading ? 'Calculating...' : 'Calculate Azure cost'}
    </button>
  );
}
