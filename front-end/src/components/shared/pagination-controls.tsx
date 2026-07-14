"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useState } from "react";

export function PaginationControls({
  page,
  totalPages,
  totalDocs,
  currentItemsCount,
  hasNext,
  hasPrev,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalDocs: number;
  currentItemsCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}) {
  const pageInputId = useId();
  const [pageInput, setPageInput] = useState(String(page));

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  function getSafePage(value: string) {
    const nextPage = Number(value);

    if (!Number.isFinite(nextPage)) {
      return page;
    }

    return Math.min(Math.max(1, nextPage), Math.max(totalPages, 1));
  }

  function handlePageInputChange(value: string) {
    const numericValue = value.replace(/\D/g, "");

    if (!numericValue) {
      setPageInput("");
      return;
    }

    setPageInput(String(getSafePage(numericValue)));
  }

  function goToTypedPage() {
    if (!pageInput) {
      setPageInput(String(page));
      return;
    }

    const safePage = getSafePage(pageInput);
    setPageInput(String(safePage));
    onPageChange(safePage);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          Página {page} de {Math.max(totalPages, 1).toLocaleString("pt-BR")}
        </span>

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-center">
            <Button
              aria-label="Página anterior"
              disabled={!hasPrev}
              onClick={() => onPageChange(page - 1)}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-soft px-3 py-1">
              <Input
                className="h-9 w-16 sm:w-20"
                id={pageInputId}
                inputMode="numeric"
                min={1}
                max={Math.max(totalPages, 1)}
                onBlur={goToTypedPage}
                onChange={(event) => handlePageInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    goToTypedPage();
                  }
                }}
                value={pageInput}
              />
              <span className="text-sm text-muted">
                de {Math.max(totalPages, 1).toLocaleString("pt-BR")}
              </span>
            </div>

            <Button
              aria-label="Próxima página"
              disabled={!hasNext}
              onClick={() => onPageChange(page + 1)}
              variant="outline"
            >
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
        ) : null}

        <span className="text-left sm:text-right">
          {currentItemsCount.toLocaleString("pt-BR")} itens nesta página •{" "}
          {totalDocs.toLocaleString("pt-BR")} no total
        </span>
      </div>
    </div>
  );
}
