import { act, renderHook, waitFor } from "@testing-library/react";
import { TestQueryProvider } from "@/test/test-query-provider";
import { useToggleFavorite } from "./use-words";

const favoriteWord = jest.fn();
const unfavoriteWord = jest.fn();

jest.mock("@/services/words.service", () => ({
  favoriteWord: (...args: unknown[]) => favoriteWord(...args),
  unfavoriteWord: (...args: unknown[]) => unfavoriteWord(...args),
  getDictionaryWords: jest.fn(),
  getFavoriteStatus: jest.fn(),
  getFavorites: jest.fn(),
  getHistory: jest.fn(),
  getWordDetails: jest.fn(),
}));

describe("useToggleFavorite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("favorita palavra com sucesso", async () => {
    favoriteWord.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useToggleFavorite("fire"), {
      wrapper: TestQueryProvider,
    });

    act(() => {
      result.current.mutate(false);
    });

    await waitFor(() => {
      expect(favoriteWord).toHaveBeenCalledWith("fire");
    });
  });
});
