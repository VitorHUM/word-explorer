import { cn } from "@/lib/utils";
import * as React from "react";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Select.displayName = "Select";
