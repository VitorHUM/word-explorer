export const AUTH_COOKIE_NAME = "word-explorer-token";

export const queryKeys = {
  session: ["session"] as const,
  history: ["history"] as const,
  favorites: ["favorites"] as const,
  favoriteStatus: (word: string) => ["favorite-status", word] as const,
  randomDictionarySeed: (limit: number) =>
    ["random-dictionary-seed", limit] as const,
  dictionary: (search: string, page: number, limit: number) =>
    ["dictionary", search, page, limit] as const,
  wordDetails: (word: string) => ["word-details", word] as const,
};

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
