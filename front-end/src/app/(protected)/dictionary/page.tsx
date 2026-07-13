"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { LoadingList } from "@/components/shared/loading-list";
import { MotionFade } from "@/components/shared/motion-fade";
import { PageSizeSelect } from "@/components/shared/page-size-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState, ErrorState } from "@/components/shared/state-panels";
import { WordCard } from "@/components/shared/word-card";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { WordDetailsView } from "@/components/shared/word-details-view";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDictionaryWords } from "@/hooks/use-words";

export default function DictionaryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebouncedValue(filter, 700);
  const dictionaryQuery = useDictionaryWords(debouncedFilter, page, limit);
  const words = dictionaryQuery.data?.results ?? [];
  const currentPage = dictionaryQuery.data?.page ?? page;
  const hasNext = dictionaryQuery.data?.hasNext ?? false;
  const hasPrev = dictionaryQuery.data?.hasPrev ?? false;
  const totalPages = dictionaryQuery.data?.totalPages ?? 1;
  const totalDocs = dictionaryQuery.data?.totalDocs ?? 0;

  return (
    <MotionFade>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-primary text-3xl">Dicionário completo</h1>
            <p className="font-secondary text-sm text-muted">Navegue pela lista paginada e abra os detalhes em um modal.</p>
          </div>
          <div className="w-full sm:max-w-sm">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted">
              <Search className="h-4 w-4 text-primary" />
              <label htmlFor="filter">Buscar no dicionário</label>
            </div>
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
        {!dictionaryQuery.isLoading && !dictionaryQuery.isError && words.length === 0 ? (
          <EmptyState description="Nenhuma palavra encontrada para esse filtro." title="Lista vazia" />
        ) : null}
        {!dictionaryQuery.isLoading && !dictionaryQuery.isError && words.length > 0 ? (
          <div className="space-y-4">
            {words.map((word) => (
              <WordCard
                action={<FavoriteButton word={word} />}
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
        <Dialog onOpenChange={(open) => !open && setSelectedWord(null)} open={Boolean(selectedWord)}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogTitle className="sr-only">Detalhes da palavra</DialogTitle>
            <DialogDescription className="sr-only">Visualização detalhada da palavra selecionada.</DialogDescription>
            {selectedWord ? <WordDetailsView word={selectedWord} /> : null}
          </DialogContent>
        </Dialog>
      </section>
    </MotionFade>
  );
}
