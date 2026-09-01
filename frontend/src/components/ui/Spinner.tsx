import * as React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full border-[#2d2d2d] border-t-[#C8A951] animate-spin',
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="Carregando..."
    />
  );
}

export function SpinnerPage() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default Spinner;
