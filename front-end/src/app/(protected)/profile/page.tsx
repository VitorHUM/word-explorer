"use client";

import { MotionFade } from "@/components/shared/motion-fade";
import { ErrorState } from "@/components/shared/state-panels";
import { WordCard } from "@/components/shared/word-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-auth";
import { useHistory } from "@/hooks/use-words";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const sessionQuery = useSession();
  const historyQuery = useHistory();

  if (sessionQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (sessionQuery.isError) {
    return (
      <ErrorState
        description={sessionQuery.error.message}
        onRetry={() => sessionQuery.refetch()}
        title="Não foi possível carregar o perfil"
      />
    );
  }

  const profile = sessionQuery.data;

  if (!profile) {
    return null;
  }

  return (
    <MotionFade>
      <section className="space-y-6">
        <div>
          <h1 className="font-primary text-3xl text-text">Perfil</h1>
          <p className="text-sm text-muted">Informações da sua conta.</p>
        </div>

        <div className="grid gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:grid-cols-2">
          <ProfileItem label="Nome" value={profile.name} />
          <ProfileItem label="E-mail" value={profile.email} />
          <ProfileItem
            label="Criado em"
            value={formatDate(profile.createdAt)}
          />
          <ProfileItem
            label="Atualizado em"
            value={formatDate(profile.updatedAt)}
          />
        </div>

        <div className="space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div>
            <h2 className="font-primary text-2xl text-text">
              Histórico de palavras
            </h2>
            <p className="text-sm text-muted">
              As últimas palavras consultadas na sua conta.
            </p>
          </div>

          {historyQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}

          {historyQuery.isError ? (
            <ErrorState
              description={historyQuery.error.message}
              onRetry={() => historyQuery.refetch()}
              title="Não foi possível carregar o histórico"
            />
          ) : null}

          {!historyQuery.isLoading &&
          !historyQuery.isError &&
          historyQuery.data?.results.length === 0 ? (
            <p className="text-sm text-muted">
              Você ainda não pesquisou nenhuma palavra.
            </p>
          ) : null}

          {!historyQuery.isLoading &&
          !historyQuery.isError &&
          (historyQuery.data?.results.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {historyQuery.data?.results.map((item) => (
                <WordCard
                  added={item.added}
                  key={`${item.word}-${item.added}`}
                  word={item.word}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </MotionFade>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-soft p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-accent text-base text-text">{value}</p>
    </div>
  );
}
