import { http } from "@/services/http";
import {
  paginatedUserWordsSchema,
  paginatedWordsSchema,
  wordDetailsSchema,
} from "@/types/api";

export async function getDictionaryWords(params: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  const response = await http<unknown>(
    `/api/entries?${searchParams.toString()}`,
  );
  return paginatedWordsSchema.parse(response);
}

export async function getRandomDictionarySeed(limit = 8) {
  const response = await http<unknown>(`/api/entries?page=1&limit=${limit}`);
  return paginatedWordsSchema.parse(response);
}

export async function getWordDetails(word: string) {
  const response = await http<unknown>(
    `/api/entries/${encodeURIComponent(word)}`,
  );
  return wordDetailsSchema.parse(response);
}

export async function favoriteWord(word: string) {
  await http(`/api/entries/${encodeURIComponent(word)}/favorite`, {
    method: "POST",
  });
}

export async function unfavoriteWord(word: string) {
  await http(`/api/entries/${encodeURIComponent(word)}/favorite`, {
    method: "DELETE",
  });
}

export async function getHistory(page = 1, limit = 20) {
  const response = await http<unknown>(
    `/api/user/history?page=${page}&limit=${limit}`,
  );
  return paginatedUserWordsSchema.parse(response);
}

export async function getFavorites(page = 1, limit = 20) {
  const response = await http<unknown>(
    `/api/user/favorites?page=${page}&limit=${limit}`,
  );
  return paginatedUserWordsSchema.parse(response);
}

export async function getFavoriteStatus(word: string) {
  const response = await http<{ isFavorite: boolean }>(
    `/api/user/favorites/status?word=${encodeURIComponent(word)}`,
  );

  return response.isFavorite;
}
