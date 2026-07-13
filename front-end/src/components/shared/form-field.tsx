"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hideError?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function FormField({ id, label, error, hideError = false, type, ...props }: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";

  return (
    <div className="space-y-2">
      <label className="block font-secondary text-sm text-text" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Input
          aria-invalid={Boolean(error)}
          className={isPasswordField ? "pr-11" : undefined}
          id={id}
          type={isPasswordField && showPassword ? "text" : type}
          {...props}
        />
        {isPasswordField ? (
          <button
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
            onClick={() => setShowPassword((currentValue) => !currentValue)}
            type="button"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      {error && !hideError ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
