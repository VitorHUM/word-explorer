import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DictionaryPage from "./page";

const useDictionaryWordsMock = jest.fn();

jest.mock("@/hooks/use-words", () => ({
  useDictionaryWords: (...args: unknown[]) => useDictionaryWordsMock(...args),
}));

jest.mock("@/hooks/use-debounced-value", () => ({
  useDebouncedValue: (value: string) => value,
}));

jest.mock("@/components/shared/word-details-dialog", () => ({
  WordDetailsDialog: ({ word }: { word: string | null }) =>
    word ? <div role="dialog">Detalhes de {word}</div> : null,
}));

function buildDictionaryResponse(search: string, page: number, limit: number) {
  if (search === "fire") {
    return {
      results: ["fire", "firefly"],
      totalDocs: 2,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };
  }

  if (page === 2) {
    return {
      results: ["cherry"],
      totalDocs: 3,
      page: 2,
      totalPages: 2,
      hasNext: false,
      hasPrev: true,
    };
  }

  if (limit === 50) {
    return {
      results: ["apple", "banana", "cherry"],
      totalDocs: 3,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };
  }

  return {
    results: ["apple", "banana"],
    totalDocs: 3,
    page: 1,
    totalPages: 2,
    hasNext: true,
    hasPrev: false,
  };
}

describe("DictionaryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDictionaryWordsMock.mockImplementation(
      (search = "", page = 1, limit = 20) => ({
        data: buildDictionaryResponse(search, page, limit),
        isLoading: false,
        isError: false,
        isFetching: false,
        refetch: jest.fn(),
      }),
    );
  });

  it("mostra a lista completa inicial", () => {
    render(<DictionaryPage />);

    expect(screen.getByRole("link", { name: /apple/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /banana/i })).toBeInTheDocument();
    expect(screen.getByText(/3 no total/i)).toBeInTheDocument();
  });

  it("atualiza a busca e preserva o termo digitado", async () => {
    const user = userEvent.setup();

    render(<DictionaryPage />);

    await user.type(screen.getByLabelText(/buscar no dicion.rio/i), "fire");

    expect(screen.getByDisplayValue("fire")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^fire$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /firefly/i })).toBeInTheDocument();
  });

  it("abre o modal ao selecionar uma palavra da lista", async () => {
    const user = userEvent.setup();

    render(<DictionaryPage />);

    await user.click(
      screen.getByRole("button", { name: /abrir detalhes de apple/i }),
    );

    expect(screen.getByRole("dialog")).toHaveTextContent(/detalhes de apple/i);
  });

  it("permite mudar de pagina e alterar itens por pagina", async () => {
    const user = userEvent.setup();

    render(<DictionaryPage />);

    await user.click(screen.getByRole("button", { name: /próxima página/i }));

    expect(screen.getByRole("link", { name: /cherry/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element?.textContent === "Página 2 de 2",
      ),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/itens por p.gina/i), "50");

    expect(screen.getByRole("link", { name: /apple/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /banana/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cherry/i })).toBeInTheDocument();
  });
});
