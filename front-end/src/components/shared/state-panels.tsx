import { Button } from "@/components/ui/button";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-color-border px-6 py-10 text-center">
      <h2 className="font-primary text-xl">{title}</h2>
      <p className="mt-2 font-secondary text-sm text-color-muted">{description}</p>
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
    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <h2 className="font-primary text-xl text-red-700">{title}</h2>
      <p className="mt-2 font-secondary text-sm text-red-600">{description}</p>
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
