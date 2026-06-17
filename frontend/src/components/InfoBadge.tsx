interface InfoBadgeProps {
  label: string;
  tooltip: string;
  className: string;
  align?: 'left' | 'right';
}

export function InfoBadge({ label, tooltip, className, align = 'right' }: InfoBadgeProps) {
  return (
    <span
      title={tooltip}
      aria-label={`${label}. ${tooltip}`}
      className={`group relative inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-30 mt-2 hidden w-56 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium leading-5 text-slate-700 shadow-card group-hover:block ${
          align === 'left' ? 'left-0' : 'right-0'
        }`}
      >
        {tooltip}
      </span>
    </span>
  );
}
