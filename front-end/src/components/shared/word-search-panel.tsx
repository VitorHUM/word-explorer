"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MotionFade } from "@/components/shared/motion-fade";
import { EmptyState, ErrorState } from "@/components/shared/state-panels";
import { WordSearchSkeleton } from "@/components/shared/word-search-skeleton";
import { Input } from "@/components/ui/input";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDictionaryWords, useRandomHomeWords } from "@/hooks/use-words";

export function WordSearchPanel() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 700);
  const randomWordsQuery = useRandomHomeWords(8);
  const searchWordsQuery = useDictionaryWords(debouncedSearch, 1, 8, Boolean(debouncedSearch));
  const wordsQuery = debouncedSearch ? searchWordsQuery : randomWordsQuery;
  const words = wordsQuery.data?.results ?? [];

  return (
    <MotionFade>
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Search className="h-5 w-5 text-primary" />
          <div>
            <h1 className="font-primary text-2xl">Buscar palavras</h1>
            <p className="font-secondary text-sm text-muted">
              A home mostra uma página aleatória do dicionário a cada carregamento. Digite para buscar no dicionário e abrir a palavra desejada.
            </p>
          </div>
        </div>
        <Input
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ex.: fire"
          value={search}
        />
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
          {debouncedSearch ? null : <span>Página aleatória: {randomWordsQuery.randomPage}</span>}
          <span>
            Total de páginas: {Math.max((wordsQuery.data?.totalPages ?? randomWordsQuery.totalPages) || 1, 1).toLocaleString("pt-BR")}
          </span>
          <span>
            Total de palavras: {((wordsQuery.data?.totalDocs ?? randomWordsQuery.totalDocs) || 0).toLocaleString("pt-BR")}
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
          {!wordsQuery.isLoading && !wordsQuery.isError && words.length === 0 ? (
            <EmptyState
              description={search ? "Nenhuma palavra encontrada para esse termo." : "Nenhuma palavra disponível no momento."}
              title="Nada por aqui"
            />
          ) : null}
          {!wordsQuery.isLoading && !wordsQuery.isError && words.length > 0 ? (
            <div className="space-y-3">
              {words.map((word) => (
                <div
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-soft"
                  key={word}
                >
                  <button className="flex-1 text-left" onClick={() => router.push(`/word/${word}`)} type="button">
                    <span className="font-accent text-primary">{word}</span>
                    <span className="ml-3 text-sm text-muted">Ver detalhes</span>
                  </button>
                  <FavoriteButton word={word} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </MotionFade>
  );
}
