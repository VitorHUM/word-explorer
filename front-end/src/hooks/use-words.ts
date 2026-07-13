"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DEFAULT_PAGE_SIZE, queryKeys } from "@/lib/constants";
import {
  favoriteWord,
  getDictionaryWords,
  getFavoriteStatus,
  getFavorites,
  getHistory,
  getRandomDictionarySeed,
  getWordDetails,
  unfavoriteWord,
} from "@/services/words.service";
import type { PaginatedUserWords } from "@/types/api";

export function useDictionaryWords(
  search = "",
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.dictionary(search, page, limit),
    queryFn: () => getDictionaryWords({ search, page, limit }),
    enabled,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
}

export function useRandomHomeWords(limit = 8) {
  const seedQuery = useQuery({
    queryKey: queryKeys.randomDictionarySeed(limit),
    queryFn: () => getRandomDictionarySeed(limit),
    staleTime: 60_000,
  });

  const totalPages = seedQuery.data?.totalPages ?? 1;
  const [randomPage, setRandomPage] = useState(1);

  useEffect(() => {
    if (!seedQuery.data) {
      return;
    }

    setRandomPage(
      seedQuery.data.totalPages > 1
        ? Math.floor(Math.random() * seedQuery.data.totalPages) + 1
        : 1,
    );
  }, [seedQuery.data]);

  const wordsQuery = useQuery({
    queryKey: queryKeys.dictionary("", randomPage, limit),
    queryFn: () => getDictionaryWords({ page: randomPage, limit }),
    enabled: seedQuery.isSuccess && randomPage > 0,
    staleTime: 60_000,
  });

  return {
    ...wordsQuery,
    randomPage,
    totalPages,
    totalDocs: wordsQuery.data?.totalDocs ?? seedQuery.data?.totalDocs ?? 0,
  };
}

export function useWordDetails(word: string) {
  return useQuery({
    queryKey: queryKeys.wordDetails(word),
    queryFn: () => getWordDetails(word),
    enabled: Boolean(word),
    staleTime: 60_000,
  });
}

export function useHistory() {
  return useQuery({
    queryKey: queryKeys.history,
    queryFn: () => getHistory(),
    staleTime: 15_000,
  });
}

export function useFavorites(page = 1, limit = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: [...queryKeys.favorites, page, limit],
    queryFn: () => getFavorites(page, limit),
    staleTime: 15_000,
  });
}

export function useFavoriteStatus(word: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.favoriteStatus(word),
    queryFn: () => getFavoriteStatus(word),
    enabled: Boolean(word) && enabled,
    staleTime: 15_000,
  });
}

function patchFavoriteCaches(
  data: PaginatedUserWords | undefined,
  word: string,
  shouldExist: boolean,
) {
  if (!data) {
    return data;
  }

  const exists = data.results.some((item) => item.word === word);

  if (shouldExist && !exists) {
    return {
      ...data,
      results: [{ word, added: new Date().toISOString() }, ...data.results],
      totalDocs: data.totalDocs + 1,
    };
  }

  if (!shouldExist && exists) {
    return {
      ...data,
      results: data.results.filter((item) => item.word !== word),
      totalDocs: Math.max(0, data.totalDocs - 1),
    };
  }

  return data;
}

export function useToggleFavorite(word: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isFavorite: boolean) => {
      if (isFavorite) {
        await unfavoriteWord(word);
        return false;
      }

      await favoriteWord(word);
      return true;
    },
    onMutate: async (isFavorite) => {
      const nextValue = !isFavorite;

      await queryClient.cancelQueries({ queryKey: queryKeys.favoriteStatus(word) });
      const previousStatus = queryClient.getQueryData<boolean>(queryKeys.favoriteStatus(word));
      const favoriteQueries = queryClient.getQueriesData<PaginatedUserWords>({
        queryKey: queryKeys.favorites,
      });

      queryClient.setQueryData(queryKeys.favoriteStatus(word), nextValue);

      favoriteQueries.forEach(([key, value]) => {
        queryClient.setQueryData(key, patchFavoriteCaches(value, word, nextValue));
      });

      return { previousStatus, favoriteQueries };
    },
    onError: (_error, _isFavorite, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData(queryKeys.favoriteStatus(word), context.previousStatus);

      context.favoriteQueries.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.favoriteStatus(word) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
    },
  });
}
