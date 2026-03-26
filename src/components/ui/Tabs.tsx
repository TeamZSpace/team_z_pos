import React from 'react';
import { cn } from '../../lib/utils';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Tabs = ({ className, children, ...props }: TabsProps) => (
  <div className={cn("w-full", className)} {...props}>
    {children}
  </div>
);

export const TabsList = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-500",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  active?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const TabsTrigger = ({ className, value, active, children, ...props }: TabsTriggerProps) => (
  <button
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      active
        ? "bg-white text-zinc-950 shadow-sm"
        : "hover:bg-white/50 hover:text-zinc-950",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  active?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const TabsContent = ({ className, value, active, children, ...props }: TabsContentProps) => {
  if (!active) return null;
  return (
    <div
      className={cn(
        "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
