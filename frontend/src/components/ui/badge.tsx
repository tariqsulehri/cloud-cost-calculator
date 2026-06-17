import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold leading-4', {
  variants: {
    variant: {
      default: 'border-slate-200 bg-slate-100 text-graphite',
      active: 'border-blue-200 bg-blue-50 text-azure',
      success: 'border-emerald-200 bg-emerald-50 text-success',
      warning: 'border-amber-200 bg-amber-50 text-warning',
      danger: 'border-red-200 bg-red-50 text-danger',
      muted: 'border-slate-200 bg-white text-muted'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
