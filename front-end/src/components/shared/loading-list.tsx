import { Skeleton } from "@/components/ui/skeleton";

export function LoadingList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton className="h-16 w-full" key={index} />
      ))}
    </div>
  );
}
