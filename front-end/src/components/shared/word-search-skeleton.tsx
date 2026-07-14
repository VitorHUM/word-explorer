import { Skeleton } from "@/components/ui/skeleton";

export function WordSearchSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="rounded-2xl border border-border bg-surface p-4"
          key={index}
        >
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-3 h-4 w-32" />
        </div>
      ))}
    </div>
  );
}
