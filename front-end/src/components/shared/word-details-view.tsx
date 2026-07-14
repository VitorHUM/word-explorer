"use client";

import { AudioPronunciationPlayer } from "@/components/shared/audio-pronunciation-player";
import { CopyButton } from "@/components/shared/copy-button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { ErrorState } from "@/components/shared/state-panels";
import { WordDetailsSkeleton } from "@/components/shared/word-details-skeleton";
import { Button } from "@/components/ui/button";
import { useWordDetails } from "@/hooks/use-words";
import { ChevronLeft, Languages } from "lucide-react";
import Link from "next/link";

export function WordDetailsView({
  showBackLink = true,
  word,
}: {
  showBackLink?: boolean;
  word: string;
}) {
  const detailsQuery = useWordDetails(word);

  if (detailsQuery.isLoading) {
    return <WordDetailsSkeleton />;
  }

  if (detailsQuery.isError) {
    return (
      <ErrorState
        description={detailsQuery.error.message}
        onRetry={() => detailsQuery.refetch()}
        title="Não foi possível carregar a palavra"
      />
    );
  }

  const details = detailsQuery.data;

  if (!details) {
    return null;
  }

  const audioUrl = details.phonetics.find((phonetic) => phonetic.audio)?.audio;

  return (
    <section className="space-y-6">
      {showBackLink ? (
        <div>
          <Button asChild variant="outline">
            <Link href="/dictionary">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar ao dicionário
            </Link>
          </Button>
        </div>
      ) : null}
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-primary text-4xl text-primary">
              {details.word}
            </h1>
            <CopyButton label="a palavra" value={details.word} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {details.phonetics.map((phonetic, index) => (
              <span
                className="rounded-full bg-surface-soft px-3 py-1 text-sm"
                key={`${phonetic.text}-${index}`}
              >
                {phonetic.text || "Sem fonética"}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {audioUrl ? <AudioPronunciationPlayer audioUrl={audioUrl} /> : null}
            <Button asChild variant="outline">
              <Link
                href={`https://translate.google.com/?sl=en&tl=pt&text=${encodeURIComponent(details.word)}&op=translate`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Languages className="mr-2 h-4 w-4" />
                Tradutor
              </Link>
            </Button>
          </div>
        </div>
        <FavoriteButton word={details.word} />
      </div>
      <div className="space-y-4">
        {details.meanings.map((meaning, index) => (
          <article
            className="rounded-3xl border border-border bg-surface p-6 shadow-sm"
            key={`${meaning.partOfSpeech}-${index}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-primary text-xl font-semibold text-secondary">
                {meaning.partOfSpeech || "Significado"}
              </h2>
              <CopyButton
                label="os detalhes"
                value={meaning.definitions
                  .map((definition) => definition.definition)
                  .join("\n")}
              />
            </div>
            <ol className="mt-4 list-decimal space-y-4 pl-5 marker:font-accent marker:text-text">
              {meaning.definitions.map((definition, definitionIndex) => (
                <li
                  className="space-y-2"
                  key={`${definition.definition}-${definitionIndex}`}
                >
                  <p className="pl-1 font-text text-base">
                    {definition.definition}
                  </p>
                  {definition.example ? (
                    <p className="pl-1 text-sm italic text-muted">
                      Example: {definition.example}
                    </p>
                  ) : null}
                  {definition.synonyms.length > 0 ? (
                    <p className="pl-1 text-sm text-muted">
                      Synonyms: {definition.synonyms.join(", ")}
                    </p>
                  ) : null}
                  {definition.antonyms.length > 0 ? (
                    <p className="pl-1 text-sm text-muted">
                      Antonyms: {definition.antonyms.join(", ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
      {details.sourceUrls.length > 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-primary text-lg">Fontes</h2>
          <ul className="mt-3 space-y-2">
            {details.sourceUrls.map((sourceUrl) => (
              <li key={sourceUrl}>
                <a
                  className="text-sm text-primary underline"
                  href={sourceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
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
