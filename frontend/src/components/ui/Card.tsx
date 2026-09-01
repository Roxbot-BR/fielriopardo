import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-xl transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-black/60 backdrop-blur-sm border border-white/10',
        highlight: 'bg-black/60 backdrop-blur-sm border border-[#C8A951] shadow-[0_0_20px_rgba(200,169,81,0.15)]',
        dark: 'bg-black/75 backdrop-blur-sm border border-white/5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, className }))} {...props} />;
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4 border-b border-[#2d2d2d]', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-bold text-white', className)} {...props} />;
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-[#2d2d2d] flex items-center', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter };

export default Card;
