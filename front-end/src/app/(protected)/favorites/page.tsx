"use client";

import { FavoriteButton } from "@/components/shared/favorite-button";
import { LoadingList } from "@/components/shared/loading-list";
import { MotionFade } from "@/components/shared/motion-fade";
import { PageSizeSelect } from "@/components/shared/page-size-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState, ErrorState } from "@/components/shared/state-panels";
import { WordCard } from "@/components/shared/word-card";
import { useFavorites } from "@/hooks/use-words";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

export default function FavoritesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const favoritesQuery = useFavorites(page, limit);
  const favorites = favoritesQuery.data?.results ?? [];
  const currentPage = favoritesQuery.data?.page ?? page;
  const hasNext = favoritesQuery.data?.hasNext ?? false;
  const hasPrev = favoritesQuery.data?.hasPrev ?? false;
  const totalPages = favoritesQuery.data?.totalPages ?? 1;
  const totalDocs = favoritesQuery.data?.totalDocs ?? 0;

  return (
    <MotionFade>
      <section className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-primary text-3xl">Favoritos</h1>
            {favoritesQuery.isFetching && !favoritesQuery.isLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
            ) : null}
          </div>
          <p className="font-secondary text-sm text-muted">
            Gerencie suas palavras salvas.
          </p>
        </div>
        <PageSizeSelect
          onChange={(nextLimit) => {
            setPage(1);
            setLimit(nextLimit);
          }}
          value={limit}
        />
        {favoritesQuery.isLoading ? <LoadingList count={5} /> : null}
        {favoritesQuery.isError ? (
          <ErrorState
            description={favoritesQuery.error.message}
            onRetry={() => favoritesQuery.refetch()}
            title="Falha ao carregar os favoritos"
          />
        ) : null}
        {!favoritesQuery.isLoading &&
        !favoritesQuery.isError &&
        favorites.length === 0 ? (
          <EmptyState
            description="Você ainda não adicionou palavras aos favoritos."
            title="Nenhum favorito"
          />
        ) : null}
        {!favoritesQuery.isLoading &&
        !favoritesQuery.isError &&
        favorites.length > 0 ? (
          <div
            className={`space-y-4 transition-opacity ${favoritesQuery.isFetching ? "opacity-60" : "opacity-100"}`}
          >
            {favorites.map((item) => (
              <WordCard
                action={<FavoriteButton initialIsFavorite word={item.word} />}
                added={item.added}
                key={`${item.word}-${item.added}`}
                word={item.word}
              />
            ))}
            <PaginationControls
              currentItemsCount={favorites.length}
              hasNext={hasNext}
              hasPrev={hasPrev}
              onPageChange={setPage}
              page={currentPage}
              totalDocs={totalDocs}
              totalPages={totalPages}
            />
          </div>
        ) : null}
      </section>
    </MotionFade>
  );
}
