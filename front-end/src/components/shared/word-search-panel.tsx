"use client";

import { MotionFade } from "@/components/shared/motion-fade";
import { EmptyState, ErrorState } from "@/components/shared/state-panels";
import { WordCard } from "@/components/shared/word-card";
import { WordSearchSkeleton } from "@/components/shared/word-search-skeleton";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDictionaryWords, useRandomHomeWords } from "@/hooks/use-words";
import { Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function WordSearchPanel() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 600);
  const randomWordsQuery = useRandomHomeWords(8);
  const searchWordsQuery = useDictionaryWords(
    debouncedSearch,
    1,
    8,
    Boolean(debouncedSearch),
  );
  const wordsQuery = debouncedSearch ? searchWordsQuery : randomWordsQuery;
  const words = wordsQuery.data?.results ?? [];
  const showLoadingIndicator =
    Boolean(debouncedSearch) && searchWordsQuery.isFetching;

  return (
    <MotionFade>
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Search className="h-5 w-5 text-primary" />
          <div>
            <h1 className="font-primary text-2xl">Buscar palavras</h1>
            <p className="font-secondary text-sm text-muted">
              Uma página aleatória do dicionário a cada carregamento.
            </p>
          </div>
        </div>
        <div className="relative">
          <Input
            className="pr-16"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex.: fire"
            value={search}
          />
          {showLoadingIndicator ? (
            <span className="pointer-events-none absolute inset-y-0 right-8 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </span>
          ) : null}
          {search ? (
            <button
              aria-label="Limpar busca"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted transition-colors hover:text-text"
              onClick={() => setSearch("")}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
          {debouncedSearch ? null : (
            <span>
              Página aleatória:{" "}
              {randomWordsQuery.randomPage.toLocaleString("pt-BR")}
            </span>
          )}
          <span>
            Total de páginas:{" "}
            {Math.max(
              (wordsQuery.data?.totalPages ?? randomWordsQuery.totalPages) || 1,
              1,
            ).toLocaleString("pt-BR")}
          </span>
          <span>
            Total de palavras:{" "}
            {(
              (wordsQuery.data?.totalDocs ?? randomWordsQuery.totalDocs) ||
              0
            ).toLocaleString("pt-BR")}
          </span>
        </div>
        <div className="mt-4">
          {wordsQuery.isLoading ? <WordSearchSkeleton /> : null}
          {wordsQuery.isError ? (
            <ErrorState
              description={wordsQuery.error.message}
              onRetry={() => wordsQuery.refetch()}
              title="Falha na busca"
            />
          ) : null}
          {!wordsQuery.isLoading &&
          !wordsQuery.isError &&
          words.length === 0 ? (
            <EmptyState
              description={
                search
                  ? "Nenhuma palavra encontrada para esse termo."
                  : "Nenhuma palavra disponível no momento."
              }
              title="Nada por aqui"
            />
          ) : null}
          {!wordsQuery.isLoading && !wordsQuery.isError && words.length > 0 ? (
            <div
              className={`space-y-3 transition-opacity ${wordsQuery.isFetching ? "opacity-60" : "opacity-100"}`}
            >
              {words.map((word) => (
                <WordCard
                  key={word}
                  onPreview={() => router.push(`/word/${word}`)}
                  word={word}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </MotionFade>
  );
}
