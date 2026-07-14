import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center"
      role="status"
    >
      <h2 className="font-primary text-xl">{title}</h2>
      <p className="mt-2 font-secondary text-sm text-muted">{description}</p>
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-red-400/40 bg-red-500/10 px-6 py-10 text-center"
      role="alert"
    >
      <h2 className="font-primary text-xl text-text">{title}</h2>
      <p className="mt-2 font-secondary text-sm text-muted">{description}</p>
      {onRetry ? (
        <div className="mt-4">
          <Button onClick={onRetry} variant="outline">
            Tentar novamente
          </Button>
        </div>
      ) : null}
    </div>
  );
}
