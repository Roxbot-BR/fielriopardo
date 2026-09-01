"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:   "bg-gold text-black hover:bg-yellow-400",
        secondary: "bg-dark-2 border border-dark-3 text-white hover:border-gold hover:text-gold",
        danger:    "bg-red-700 text-white hover:bg-red-600",
        ghost:     "text-gray-400 hover:text-gold hover:bg-dark-2",
        outline:   "border border-gold text-gold hover:bg-gold hover:text-black",
      },
      size: {
        sm: "h-8  px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, isLoading, disabled, children, ...props }, ref) => {
    const busy = loading || isLoading;
    return (
      <button
        ref={ref}
        disabled={disabled || busy}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {busy && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;
