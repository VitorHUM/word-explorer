"use client";

import { LoadingList } from "@/components/shared/loading-list";
import { MotionFade } from "@/components/shared/motion-fade";
import { EmptyState, ErrorState } from "@/components/shared/state-panels";
import { WordCard } from "@/components/shared/word-card";
import { WordDetailsDialog } from "@/components/shared/word-details-dialog";
import { Button } from "@/components/ui/button";
import { useHistory } from "@/hooks/use-words";
import Link from "next/link";
import { useState } from "react";

export function HomeHistorySection() {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const historyQuery = useHistory(1, 7);
  const history = historyQuery.data?.results ?? [];

  return (
    <MotionFade delay={0.08}>
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-primary text-2xl">Histórico recente</h2>
            <p className="font-secondary text-sm text-muted">
              Palavras visualizadas.
            </p>
          </div>
          <Button asChild className="self-start" variant="outline">
            <Link href="/profile">Histórico completo</Link>
          </Button>
        </div>
        {historyQuery.isLoading ? <LoadingList count={7} /> : null}
        {historyQuery.isError ? (
          <ErrorState
            description={historyQuery.error.message}
            onRetry={() => historyQuery.refetch()}
            title="Falha ao carregar o histórico"
          />
        ) : null}
        {!historyQuery.isLoading &&
        !historyQuery.isError &&
        history.length === 0 ? (
          <EmptyState
            description="Você ainda não pesquisou nenhuma palavra."
            title="Sem histórico"
          />
        ) : null}
        {!historyQuery.isLoading &&
        !historyQuery.isError &&
        history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item) => (
              <WordCard
                added={item.added}
                key={`${item.word}-${item.added}`}
                onPreview={() => setSelectedWord(item.word)}
                word={item.word}
              />
            ))}
          </div>
        ) : null}
        <WordDetailsDialog
          onClose={() => setSelectedWord(null)}
          word={selectedWord}
        />
      </section>
    </MotionFade>
  );
}
