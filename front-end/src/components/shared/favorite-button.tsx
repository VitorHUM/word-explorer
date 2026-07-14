"use client";

import { Button } from "@/components/ui/button";
import { useFavoriteStatus, useToggleFavorite } from "@/hooks/use-words";
import { Heart } from "lucide-react";

export function FavoriteButton({
  word,
  initialIsFavorite,
}: {
  word: string;
  initialIsFavorite?: boolean;
}) {
  const statusQuery = useFavoriteStatus(word, initialIsFavorite === undefined);
  const toggleMutation = useToggleFavorite(word);

  const isFavorite = statusQuery.data ?? initialIsFavorite ?? false;
  const isLoading = statusQuery.isLoading || toggleMutation.isPending;

  return (
    <Button
      aria-label={isFavorite ? `Desfavoritar ${word}` : `Favoritar ${word}`}
      disabled={isLoading}
      onClick={() => toggleMutation.mutate(isFavorite)}
      size="sm"
      variant={isFavorite ? "primary" : "secondary"}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
    </Button>
  );
}
