import { WordDetailsDialog } from "@/components/shared/word-details-dialog";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/components/shared/word-details-view", () => ({
  WordDetailsView: ({ word }: { word: string }) => <div>{word}</div>,
}));

describe("WordDetailsDialog", () => {
  it("abre o modal com os detalhes da palavra e permite fechar", () => {
    const onClose = jest.fn();

    render(<WordDetailsDialog onClose={onClose} word="mouse" />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("mouse")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
