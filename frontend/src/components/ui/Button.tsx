"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#C8A951] text-black hover:bg-[#b8993f] shadow-md shadow-[#C8A951]/20 font-bold",
        outline:
          "border-2 border-[#C8A951] bg-transparent text-[#C8A951] hover:bg-[#C8A951] hover:text-black font-semibold",
        secondary:
          "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700",
        ghost:
          "text-zinc-300 hover:text-white hover:bg-zinc-800/60",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        danger:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        link:
          "text-[#C8A951] underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        default: "h-10 px-4 py-2",
        md:      "h-10 px-4 py-2",
        sm:      "h-8 px-3 text-xs",
        lg:      "h-12 px-6 text-base rounded-xl",
        icon:    "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, isLoading, disabled, children, ...props }, ref) => {
    const busy = loading || isLoading;
    if (asChild) {
      return (
        <Slot
          ref={ref as any}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        >
          {children}
        </Slot>
      );
    }
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

export default Button;
export { Button, buttonVariants };
