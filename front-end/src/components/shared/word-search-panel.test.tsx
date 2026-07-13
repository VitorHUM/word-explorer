import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WordSearchPanel } from "./word-search-panel";

const push = jest.fn();
let mockQueryResult: {
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  data: { results: string[] };
  refetch: jest.Mock;
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/hooks/use-debounced-value", () => ({
  useDebouncedValue: (value: string) => value,
}));

jest.mock("@/hooks/use-words", () => ({
  useDictionaryWords: () => mockQueryResult,
  useRandomHomeWords: () => ({
    ...mockQueryResult,
    randomPage: 42,
    totalPages: 100,
    totalDocs: 2000,
  }),
  useFavoriteStatus: () => ({
    data: false,
    isLoading: false,
  }),
  useToggleFavorite: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

describe("WordSearchPanel", () => {
  beforeEach(() => {
    push.mockReset();
    mockQueryResult = {
      isLoading: false,
      isError: false,
      data: { results: ["fire", "firefly"] },
      refetch: jest.fn(),
    };
  });

  it("mostra resultados e navega para detalhes", async () => {
    const user = userEvent.setup();

    render(<WordSearchPanel />);

    await user.click(screen.getByRole("button", { name: /^fire ver detalhes$/i }));

    expect(push).toHaveBeenCalledWith("/word/fire");
  });

  it("trata estado vazio", () => {
    mockQueryResult.data.results = [];

    render(<WordSearchPanel />);

    expect(screen.getByText(/nada por aqui/i)).toBeInTheDocument();
  });

  it("trata erro", async () => {
    mockQueryResult.isError = true;
    mockQueryResult.error = new Error("Falha");

    render(<WordSearchPanel />);

    expect(screen.getByText("Falha")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
    });
  });
});
