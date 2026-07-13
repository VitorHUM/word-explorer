"use client";

import { Heart } from "lucide-react";
import { useFavoriteStatus, useToggleFavorite } from "@/hooks/use-words";
import { Button } from "@/components/ui/button";

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
      disabled={isLoading}
      onClick={() => toggleMutation.mutate(isFavorite)}
      variant={isFavorite ? "primary" : "secondary"}
    >
      <Heart className={`mr-2 h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
      {isFavorite ? "Desfavoritar" : "Favoritar"}
    </Button>
  );
}
