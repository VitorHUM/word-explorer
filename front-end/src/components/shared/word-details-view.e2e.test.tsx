import { WordDetailsView } from "@/components/shared/word-details-view";
import { render, screen, within } from "@testing-library/react";

const mutate = jest.fn();
const refetch = jest.fn();
const useWordDetailsMock = jest.fn();

jest.mock("@/hooks/use-words", () => ({
  useWordDetails: (...args: unknown[]) => useWordDetailsMock(...args),
  useFavoriteStatus: () => ({ data: false, isLoading: false }),
  useToggleFavorite: () => ({ mutate, isPending: false }),
}));

describe("WordDetailsView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza detalhes da palavra com definicoes e fontes", () => {
    useWordDetailsMock.mockReturnValue({
      data: {
        word: "phantom",
        phonetics: [{ text: "/ˈfæntəm/", audio: "" }],
        meanings: [
          {
            partOfSpeech: "noun",
            definitions: [
              {
                definition: "A ghost or apparition.",
                synonyms: [],
                antonyms: [],
              },
              {
                definition: "Something apparently seen but not real.",
                example: "A phantom limb",
                synonyms: ["illusion"],
                antonyms: ["reality"],
              },
            ],
            synonyms: [],
            antonyms: [],
          },
        ],
        sourceUrls: ["https://example.com/phantom"],
      },
      isLoading: false,
      isError: false,
      refetch,
    });

    render(<WordDetailsView word="phantom" />);

    expect(
      screen.getByRole("heading", { name: "phantom" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "noun" })).toHaveClass(
      "text-secondary",
    );
    expect(screen.getByRole("link", { name: /tradutor/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "https://example.com/phantom" }),
    ).toBeInTheDocument();

    const definitions = screen.getAllByRole("list")[0];
    const items = within(definitions).getAllByRole("listitem");

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("A ghost or apparition.");
    expect(items[1]).toHaveTextContent(
      "Something apparently seen but not real.",
    );
    expect(items[1]).toHaveTextContent("Example: A phantom limb");
    expect(items[1]).toHaveTextContent("Synonyms: illusion");
    expect(items[1]).toHaveTextContent("Antonyms: reality");
  });

  it("omite campos opcionais ausentes e usa fallback de fonetica", () => {
    useWordDetailsMock.mockReturnValue({
      data: {
        word: "sparrow",
        phonetics: [{ text: "", audio: "" }],
        meanings: [
          {
            partOfSpeech: "noun",
            definitions: [
              {
                definition: "A small bird.",
                synonyms: [],
                antonyms: [],
              },
            ],
            synonyms: [],
            antonyms: [],
          },
        ],
        sourceUrls: [],
      },
      isLoading: false,
      isError: false,
      refetch,
    });

    render(<WordDetailsView word="sparrow" />);

    expect(screen.getByText(/sem fon.tica/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reproduzir pronuncia/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/example:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/synonyms:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/antonyms:/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /fontes/i }),
    ).not.toBeInTheDocument();
  });
});
