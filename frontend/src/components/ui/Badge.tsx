import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        gold: 'bg-[#C8A951] text-black',
        'gold-outline': 'bg-[#C8A951]/20 text-[#C8A951] border border-[#C8A951]/30',
        red: 'bg-red-500/20 text-red-400 border border-red-500/30',
        blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        gray: 'bg-[#2d2d2d] text-white',
        live: 'bg-red-600 text-white animate-pulse',
      },
    },
    defaultVariants: {
      variant: 'gray',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };

export default Badge;
