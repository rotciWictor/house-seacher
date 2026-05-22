import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility to merge tailwind classes */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gray-900 text-white hover:bg-gray-800',
        secondary:
          'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
        destructive:
          'border-transparent bg-red-600 text-white hover:bg-red-700',
        success:
          'border-transparent bg-emerald-600 text-white hover:bg-emerald-700',
        outline: 'text-gray-950 border-gray-200',
        glass: 'border-white/20 bg-white/10 text-white backdrop-blur-md',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
