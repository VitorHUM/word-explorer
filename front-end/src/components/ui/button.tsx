import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-accent text-sm font-medium disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-accent focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-color-primary px-4 py-2 text-color-white hover:bg-color-accent",
        secondary: "bg-color-surface px-4 py-2 text-color-text hover:bg-color-accent-light",
        ghost: "px-3 py-2 text-color-text hover:bg-color-surface",
        outline: "border border-color-border px-4 py-2 text-color-text hover:bg-color-surface",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
