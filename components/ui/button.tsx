'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white shadow-lg shadow-teal-600/30 hover:bg-teal-600',
        secondary:
          'bg-secondary text-white shadow-lg shadow-rose-600/30 hover:bg-rose-600',
        ghost:
          'bg-transparent text-foreground hover:bg-[color-mix(in_oklab,var(--background),black_70%)]',
        outline:
          'border border-foreground/20 text-foreground hover:bg-foreground/10',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-8 px-4',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> { }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { buttonVariants };

