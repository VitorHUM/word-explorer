"use client";

import { useState } from "react";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { LoadingList } from "@/components/shared/loading-list";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState, ErrorState } from "@/components/shared/state-panels";
import { WordCard } from "@/components/shared/word-card";
import { useFavorites } from "@/hooks/use-words";

export default function FavoritesPage() {
  const [page, setPage] = useState(1);
  const favoritesQuery = useFavorites(page);
  const favorites = favoritesQuery.data?.results ?? [];
  const currentPage = favoritesQuery.data?.page ?? page;
  const hasNext = favoritesQuery.data?.hasNext ?? false;
  const hasPrev = favoritesQuery.data?.hasPrev ?? false;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-primary text-3xl">Favoritos</h1>
        <p className="font-secondary text-sm text-color-muted">Gerencie suas palavras salvas.</p>
      </div>
      {favoritesQuery.isLoading ? <LoadingList count={5} /> : null}
      {favoritesQuery.isError ? (
        <ErrorState
          description={favoritesQuery.error.message}
          onRetry={() => favoritesQuery.refetch()}
          title="Falha ao carregar favoritos"
        />
      ) : null}
      {!favoritesQuery.isLoading && !favoritesQuery.isError && favorites.length === 0 ? (
        <EmptyState description="Voce ainda nao adicionou palavras aos favoritos." title="Nenhum favorito" />
      ) : null}
      {!favoritesQuery.isLoading && !favoritesQuery.isError && favorites.length > 0 ? (
        <div className="space-y-4">
          {favorites.map((item) => (
            <WordCard
              action={<FavoriteButton initialIsFavorite word={item.word} />}
              added={item.added}
              key={`${item.word}-${item.added}`}
              word={item.word}
            />
          ))}
          <PaginationControls
            hasNext={hasNext}
            hasPrev={hasPrev}
            onPageChange={setPage}
            page={currentPage}
          />
        </div>
      ) : null}
    </section>
  );
}
