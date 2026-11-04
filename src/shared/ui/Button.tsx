import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-emerald-950/40 hover:brightness-105 active:brightness-95 border border-primary/30",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:brightness-105 active:brightness-95 border border-destructive/30",
        outline:
          "border border-border/70 bg-card/50 backdrop-blur-sm text-foreground shadow-sm hover:bg-muted/70 hover:border-border",
        secondary:
          "bg-secondary/80 text-secondary-foreground shadow-sm hover:bg-secondary border border-border/40",
        ghost:
          "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
        income:
          "bg-emerald-600/90 text-white hover:bg-emerald-600 shadow-sm border border-emerald-500/40",
        expense:
          "bg-rose-600/90 text-white hover:bg-rose-600 shadow-sm border border-rose-500/40",
      },
      size: {
        default: "h-9 px-3.5 py-2",
        sm: "h-8 rounded-lg px-2.5 text-[11px]",
        lg: "h-11 rounded-xl px-5 text-sm",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
