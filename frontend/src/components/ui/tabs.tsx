import * as TabsPrimitive from '@radix-ui/react-tabs';
import type * as React from 'react';
import { cn } from '../../lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('inline-flex gap-2', className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'group inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3.5 text-xs font-semibold text-muted shadow-sm transition hover:border-azure/30 hover:bg-slate-50 data-[state=active]:border-transparent data-[state=active]:bg-brand-accent data-[state=active]:text-white data-[state=active]:shadow-glow data-[state=active]:hover:brightness-105',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-3 focus-visible:outline-none', className)} {...props} />;
}
