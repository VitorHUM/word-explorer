"use client";

import { FavoriteButton } from "@/components/shared/favorite-button";
import { ErrorState } from "@/components/shared/state-panels";
import { Skeleton } from "@/components/ui/skeleton";
import { useWordDetails } from "@/hooks/use-words";

export function WordDetailsView({ word }: { word: string }) {
  const detailsQuery = useWordDetails(word);

  if (detailsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (detailsQuery.isError) {
    return (
      <ErrorState
        description={detailsQuery.error.message}
        onRetry={() => detailsQuery.refetch()}
        title="Nao foi possivel carregar a palavra"
      />
    );
  }

  const details = detailsQuery.data;

  if (!details) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-color-border p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-primary text-4xl text-color-primary">{details.word}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {details.phonetics.map((phonetic, index) => (
              <span className="rounded-full bg-color-surface px-3 py-1 text-sm" key={`${phonetic.text}-${index}`}>
                {phonetic.text || "Sem fonetica"}
              </span>
            ))}
          </div>
        </div>
        <FavoriteButton word={details.word} />
      </div>
      <div className="space-y-4">
        {details.meanings.map((meaning, index) => (
          <article className="rounded-3xl border border-color-border p-6" key={`${meaning.partOfSpeech}-${index}`}>
            <h2 className="font-primary text-xl text-color-text">{meaning.partOfSpeech || "Significado"}</h2>
            <div className="mt-4 space-y-4">
              {meaning.definitions.map((definition, definitionIndex) => (
                <div className="space-y-2" key={`${definition.definition}-${definitionIndex}`}>
                  <p className="font-text text-base">{definition.definition}</p>
                  {definition.example ? (
                    <p className="text-sm italic text-color-muted">Exemplo: {definition.example}</p>
                  ) : null}
                  {definition.synonyms.length > 0 ? (
                    <p className="text-sm text-color-muted">Sinonimos: {definition.synonyms.join(", ")}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      {details.sourceUrls.length > 0 ? (
        <div className="rounded-3xl border border-color-border p-6">
          <h2 className="font-primary text-lg">Fontes</h2>
          <ul className="mt-3 space-y-2">
            {details.sourceUrls.map((sourceUrl) => (
              <li key={sourceUrl}>
                <a className="text-sm text-color-accent underline" href={sourceUrl} rel="noreferrer" target="_blank">
                  {sourceUrl}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
