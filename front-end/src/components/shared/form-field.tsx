import { Input } from "@/components/ui/input";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function FormField({ id, label, error, ...props }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block font-secondary text-sm text-color-text" htmlFor={id}>
        {label}
      </label>
      <Input aria-invalid={Boolean(error)} id={id} {...props} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
