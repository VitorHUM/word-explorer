import { HomeHistorySection } from "@/features/home/home-history-section";
import { render, screen } from "@testing-library/react";

const useHistoryMock = jest.fn();

jest.mock("@/hooks/use-words", () => ({
  useHistory: (...args: unknown[]) => useHistoryMock(...args),
}));

jest.mock("@/components/shared/word-details-dialog", () => ({
  WordDetailsDialog: ({ word }: { word: string | null }) =>
    word ? <div role="dialog">{word}</div> : null,
}));

describe("HomeHistorySection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("mostra estado vazio quando nao ha historico", () => {
    useHistoryMock.mockReturnValue({
      data: { results: [] },
      isLoading: false,
      isError: false,
    });

    render(<HomeHistorySection />);

    expect(
      screen.getByText(/você ainda não pesquisou nenhuma palavra/i),
    ).toBeInTheDocument();
  });

  it("mostra historico preenchido", () => {
    useHistoryMock.mockReturnValue({
      data: {
        results: [
          { word: "mouse", added: "2024-01-01T00:00:00.000Z" },
          { word: "fire", added: "2024-01-02T00:00:00.000Z" },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(<HomeHistorySection />);

    expect(screen.getByRole("link", { name: /mouse/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /fire/i })).toBeInTheDocument();
  });
});
