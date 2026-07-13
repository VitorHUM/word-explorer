import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-lg border border-color-border bg-color-white px-3 text-sm text-color-text placeholder:text-color-muted focus:outline-none focus:ring-2 focus:ring-color-accent",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
