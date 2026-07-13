"use client";

import { LoadingList } from "@/components/shared/loading-list";
import { MotionFade } from "@/components/shared/motion-fade";
import { EmptyState, ErrorState } from "@/components/shared/state-panels";
import { WordCard } from "@/components/shared/word-card";
import { useHistory } from "@/hooks/use-words";

export function HomeHistorySection() {
  const historyQuery = useHistory();
  const history = historyQuery.data?.results ?? [];

  return (
    <MotionFade delay={0.08}>
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="font-primary text-2xl">Histórico recente</h2>
          <p className="font-secondary text-sm text-muted">Suas últimas palavras pesquisadas aparecem aqui automaticamente.</p>
        </div>
        {historyQuery.isLoading ? <LoadingList /> : null}
        {historyQuery.isError ? (
          <ErrorState
            description={historyQuery.error.message}
            onRetry={() => historyQuery.refetch()}
            title="Falha ao carregar o histórico"
          />
        ) : null}
        {!historyQuery.isLoading && !historyQuery.isError && history.length === 0 ? (
          <EmptyState description="Você ainda não pesquisou nenhuma palavra." title="Sem histórico" />
        ) : null}
        {!historyQuery.isLoading && !historyQuery.isError && history.length > 0 ? (
          <div className="space-y-3">
            {history.map((item) => (
              <WordCard added={item.added} key={`${item.word}-${item.added}`} word={item.word} />
            ))}
          </div>
        ) : null}
      </section>
    </MotionFade>
  );
}
