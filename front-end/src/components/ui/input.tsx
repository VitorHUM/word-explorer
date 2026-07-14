import { cn } from "@/lib/utils";
import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
