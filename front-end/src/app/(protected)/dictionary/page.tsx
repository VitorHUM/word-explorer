"use client";

import { LoadingList } from "@/components/shared/loading-list";
import { MotionFade } from "@/components/shared/motion-fade";
import { PageSizeSelect } from "@/components/shared/page-size-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState, ErrorState } from "@/components/shared/state-panels";
import { WordCard } from "@/components/shared/word-card";
import { WordDetailsView } from "@/components/shared/word-details-view";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDictionaryWords } from "@/hooks/use-words";
import { Loader2, Search, X } from "lucide-react";
import { useState } from "react";

export default function DictionaryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebouncedValue(filter, 600);
  const dictionaryQuery = useDictionaryWords(debouncedFilter, page, limit);
  const words = dictionaryQuery.data?.results ?? [];
  const currentPage = dictionaryQuery.data?.page ?? page;
  const hasNext = dictionaryQuery.data?.hasNext ?? false;
  const hasPrev = dictionaryQuery.data?.hasPrev ?? false;
  const totalPages = dictionaryQuery.data?.totalPages ?? 1;
  const totalDocs = dictionaryQuery.data?.totalDocs ?? 0;
  const showLoadingIndicator =
    Boolean(debouncedFilter) && dictionaryQuery.isFetching;

  return (
    <MotionFade>
      <section className="space-y-6">
        <div>
          <div>
            <h1 className="font-primary text-3xl">Dicionário completo</h1>
            <p className="font-secondary text-sm text-muted">
              Navegue pelo dicionário.
            </p>
          </div>
        </div>
        <div className="w-full">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <Search className="h-4 w-4 text-primary" />
            <label htmlFor="filter">Buscar no dicionário</label>
          </div>
          <div className="relative">
            <Input
              className="pr-16"
              id="filter"
              onChange={(event) => {
                setPage(1);
                setFilter(event.target.value);
              }}
              placeholder="Ex.: fire"
              value={filter}
            />
            {showLoadingIndicator ? (
              <span className="pointer-events-none absolute inset-y-0 right-8 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </span>
            ) : null}
            {filter ? (
              <button
                aria-label="Limpar busca"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted transition-colors hover:text-text"
                onClick={() => {
                  setPage(1);
                  setFilter("");
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
        <PageSizeSelect
          onChange={(nextLimit) => {
            setPage(1);
            setLimit(nextLimit);
          }}
          value={limit}
        />
        {dictionaryQuery.isLoading ? <LoadingList count={6} /> : null}
        {dictionaryQuery.isError ? (
          <ErrorState
            description={dictionaryQuery.error.message}
            onRetry={() => dictionaryQuery.refetch()}
            title="Falha ao carregar o dicionário"
          />
        ) : null}
        {!dictionaryQuery.isLoading &&
        !dictionaryQuery.isError &&
        words.length === 0 ? (
          <EmptyState
            description="Nenhuma palavra encontrada para esse filtro."
            title="Lista vazia"
          />
        ) : null}
        {!dictionaryQuery.isLoading &&
        !dictionaryQuery.isError &&
        words.length > 0 ? (
          <div
            className={`space-y-4 transition-opacity ${dictionaryQuery.isFetching ? "opacity-60" : "opacity-100"}`}
          >
            {words.map((word) => (
              <WordCard
                key={word}
                onPreview={() => setSelectedWord(word)}
                word={word}
              />
            ))}
            <PaginationControls
              currentItemsCount={words.length}
              hasNext={hasNext}
              hasPrev={hasPrev}
              onPageChange={setPage}
              page={currentPage}
              totalDocs={totalDocs}
              totalPages={totalPages}
            />
          </div>
        ) : null}
        <Dialog
          onOpenChange={(open) => !open && setSelectedWord(null)}
          open={Boolean(selectedWord)}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogTitle className="sr-only">Detalhes da palavra</DialogTitle>
            <DialogDescription className="sr-only">
              Visualização detalhada da palavra selecionada.
            </DialogDescription>
            {selectedWord ? <WordDetailsView word={selectedWord} /> : null}
          </DialogContent>
        </Dialog>
      </section>
    </MotionFade>
  );
}
