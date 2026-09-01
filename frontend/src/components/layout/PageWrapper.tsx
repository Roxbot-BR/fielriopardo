import React from 'react';
import { cn } from '@/lib/utils';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  /** When true, wraps content in a semi-transparent glass panel (for inner pages) */
  glass?: boolean;
}

export function PageWrapper({ children, className, fullWidth = false, glass = false }: PageWrapperProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8 py-8',
        !fullWidth && 'max-w-7xl',
        className
      )}
    >
      {glass ? (
        <div
          className="rounded-2xl"
          style={{
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            padding: '1.5rem',
          }}
        >
          {children}
        </div>
      ) : children}
    </div>
  );
}
