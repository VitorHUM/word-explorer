import { Button } from "@/components/ui/button";

export function PaginationControls({
  page,
  hasNext,
  hasPrev,
  onPageChange,
}: {
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button disabled={!hasPrev} onClick={() => onPageChange(page - 1)} variant="outline">
        Anterior
      </Button>
      <span className="font-secondary text-sm text-color-muted">Pagina {page}</span>
      <Button disabled={!hasNext} onClick={() => onPageChange(page + 1)} variant="outline">
        Proxima
      </Button>
    </div>
  );
}
