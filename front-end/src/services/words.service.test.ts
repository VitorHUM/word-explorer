import {
  favoriteWord,
  getDictionaryWords,
  getFavoriteStatus,
  getWordDetails,
  unfavoriteWord,
} from "@/services/words.service";

const http = jest.fn();

jest.mock("@/services/http", () => ({
  http: (...args: unknown[]) => http(...args),
}));

describe("words service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("monta query de dicionario e valida resposta paginada", async () => {
    http.mockResolvedValueOnce({
      results: ["fire", "firefly"],
      totalDocs: 2,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });

    await expect(
      getDictionaryWords({ search: "fire", page: 1, limit: 20 }),
    ).resolves.toEqual({
      results: ["fire", "firefly"],
      totalDocs: 2,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
    expect(http).toHaveBeenCalledWith(
      "/api/entries?search=fire&page=1&limit=20",
    );
  });

  it("codifica palavra em rotas de detalhes e favoritos", async () => {
    http
      .mockResolvedValueOnce({
        word: "ice cream",
        phonetics: [],
        meanings: [],
        sourceUrls: [],
      })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await getWordDetails("ice cream");
    await favoriteWord("ice cream");
    await unfavoriteWord("ice cream");

    expect(http).toHaveBeenNthCalledWith(1, "/api/entries/ice%20cream");
    expect(http).toHaveBeenNthCalledWith(
      2,
      "/api/entries/ice%20cream/favorite",
      {
        method: "POST",
      },
    );
    expect(http).toHaveBeenNthCalledWith(
      3,
      "/api/entries/ice%20cream/favorite",
      {
        method: "DELETE",
      },
    );
  });

  it("retorna status de favorito", async () => {
    http.mockResolvedValueOnce({ isFavorite: true });

    await expect(getFavoriteStatus("fire")).resolves.toBe(true);
    expect(http).toHaveBeenCalledWith("/api/user/favorites/status?word=fire");
  });
});
