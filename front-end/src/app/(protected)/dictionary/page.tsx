"use client";

import { useState } from "react";
import { LoadingList } from "@/components/shared/loading-list";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState, ErrorState } from "@/components/shared/state-panels";
import { WordCard } from "@/components/shared/word-card";
import { WordDetailsView } from "@/components/shared/word-details-view";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDictionaryWords } from "@/hooks/use-words";

export default function DictionaryPage() {
  const [page, setPage] = useState(1);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebouncedValue(filter);
  const dictionaryQuery = useDictionaryWords(debouncedFilter, page);
  const words = dictionaryQuery.data?.results ?? [];
  const currentPage = dictionaryQuery.data?.page ?? page;
  const hasNext = dictionaryQuery.data?.hasNext ?? false;
  const hasPrev = dictionaryQuery.data?.hasPrev ?? false;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-primary text-3xl">Dicionario completo</h1>
          <p className="font-secondary text-sm text-color-muted">Navegue pela lista paginada e abra os detalhes em modal.</p>
        </div>
        <div className="w-full sm:max-w-xs">
          <label className="mb-2 block text-sm text-color-muted" htmlFor="filter">Filtro local</label>
          <Input
            id="filter"
            onChange={(event) => {
              setPage(1);
              setFilter(event.target.value);
            }}
            placeholder="Buscar por prefixo"
            value={filter}
          />
        </div>
      </div>
      {dictionaryQuery.isLoading ? <LoadingList count={6} /> : null}
      {dictionaryQuery.isError ? (
        <ErrorState
          description={dictionaryQuery.error.message}
          onRetry={() => dictionaryQuery.refetch()}
          title="Falha ao carregar dicionario"
        />
      ) : null}
      {!dictionaryQuery.isLoading && !dictionaryQuery.isError && words.length === 0 ? (
        <EmptyState description="Nenhuma palavra encontrada para esse filtro." title="Lista vazia" />
      ) : null}
      {!dictionaryQuery.isLoading && !dictionaryQuery.isError && words.length > 0 ? (
        <div className="space-y-4">
          {words.map((word) => (
            <WordCard key={word} onPreview={() => setSelectedWord(word)} word={word} />
          ))}
          <PaginationControls
            hasNext={hasNext}
            hasPrev={hasPrev}
            onPageChange={setPage}
            page={currentPage}
          />
        </div>
      ) : null}
      <Dialog onOpenChange={(open) => !open && setSelectedWord(null)} open={Boolean(selectedWord)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogTitle className="sr-only">Detalhes da palavra</DialogTitle>
          <DialogDescription className="sr-only">Visualizacao detalhada da palavra selecionada.</DialogDescription>
          {selectedWord ? <WordDetailsView word={selectedWord} /> : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
