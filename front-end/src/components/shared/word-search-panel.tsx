"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingList } from "@/components/shared/loading-list";
import { EmptyState, ErrorState } from "@/components/shared/state-panels";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDictionaryWords } from "@/hooks/use-words";

export function WordSearchPanel() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const wordsQuery = useDictionaryWords(debouncedSearch, 1, 8);
  const words = wordsQuery.data?.results ?? [];

  return (
    <section className="rounded-3xl border border-color-border p-6">
      <div className="mb-4 flex items-center gap-3">
        <Search className="h-5 w-5 text-color-accent" />
        <div>
          <h1 className="font-primary text-2xl">Buscar palavras</h1>
          <p className="font-secondary text-sm text-color-muted">Digite uma palavra em ingles para buscar no dicionario.</p>
        </div>
      </div>
      <Input
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Ex.: fire"
        value={search}
      />
      <div className="mt-4">
        {wordsQuery.isLoading ? <LoadingList /> : null}
        {wordsQuery.isError ? (
          <ErrorState
            description={wordsQuery.error.message}
            onRetry={() => wordsQuery.refetch()}
            title="Falha na busca"
          />
        ) : null}
        {!wordsQuery.isLoading && !wordsQuery.isError && words.length === 0 ? (
          <EmptyState
            description={search ? "Nenhuma palavra encontrada para esse termo." : "Comece digitando para ver sugestoes."}
            title="Nada por aqui"
          />
        ) : null}
        {!wordsQuery.isLoading && !wordsQuery.isError && words.length > 0 ? (
          <div className="space-y-3">
            {words.map((word) => (
              <button
                className="flex w-full items-center justify-between rounded-2xl border border-color-border px-4 py-3 text-left hover:bg-color-surface"
                key={word}
                onClick={() => router.push(`/word/${word}`)}
                type="button"
              >
                <span className="font-accent text-color-primary">{word}</span>
                <span className="text-sm text-color-muted">Ver detalhes</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
