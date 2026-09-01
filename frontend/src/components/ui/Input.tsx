import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, autoComplete, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          autoComplete={autoComplete ?? (props.type === 'password' ? 'current-password' : props.type === 'email' ? 'email' : props.type === 'tel' ? 'tel' : undefined)}
          className={cn(
            'h-10 w-full rounded-md border bg-[#1a1a1a] px-3 text-base md:text-sm text-white placeholder:text-gray-500 transition-colors',
            'border-[#3d3d3d] focus:border-[#C8A951] focus:outline-none focus:ring-1 focus:ring-[#C8A951]',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

export default Input;
