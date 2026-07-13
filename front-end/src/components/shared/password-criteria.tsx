import { Check, X } from "lucide-react";

const passwordRules = [
  {
    label: "Minimo de 4 caracteres",
    valid: (password: string) => password.length >= 4,
  },
  {
    label: "Pelo menos 1 letra",
    valid: (password: string) => /[a-zA-Z]/.test(password),
  },
  {
    label: "Pelo menos 1 numero",
    valid: (password: string) => /\d/.test(password),
  },
];

export function PasswordCriteria({
  password,
  confirmPassword,
}: {
  password: string;
  confirmPassword?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-soft p-4 text-sm">
      <p className="font-accent text-text">Sua senha precisa ter:</p>
      <ul className="mt-3 space-y-2 text-muted">
        {passwordRules.map((rule) => {
          const isValid = rule.valid(password);

          return (
            <li className="flex items-center gap-2" key={rule.label}>
              {isValid ? <Check className="h-4 w-4 text-secondary" /> : <X className="h-4 w-4 text-red-500" />}
              <span>{rule.label}</span>
            </li>
          );
        })}
        <li className="flex items-center gap-2">
          {confirmPassword && password === confirmPassword ? (
            <Check className="h-4 w-4 text-secondary" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
          <span>Confirmação igual à senha</span>
        </li>
      </ul>
    </div>
  );
}
