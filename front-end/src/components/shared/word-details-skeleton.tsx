import { Skeleton } from "@/components/ui/skeleton";

export function WordDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <Skeleton className="h-10 w-40" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-4 h-4 w-3/4" />
      </div>
    </div>
  );
}
