import { FavoriteButton } from "@/components/shared/favorite-button";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const useFavoriteStatusMock = jest.fn();
const useToggleFavoriteMock = jest.fn();
const mutate = jest.fn();

jest.mock("@/hooks/use-words", () => ({
  useFavoriteStatus: (...args: unknown[]) => useFavoriteStatusMock(...args),
  useToggleFavorite: (...args: unknown[]) => useToggleFavoriteMock(...args),
}));

describe("FavoriteButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFavoriteStatusMock.mockReturnValue({ data: false, isLoading: false });
    useToggleFavoriteMock.mockReturnValue({ mutate, isPending: false });
  });

  it("favorita uma palavra", async () => {
    const user = userEvent.setup();

    render(<FavoriteButton word="mouse" />);

    await user.click(screen.getByRole("button", { name: /favoritar mouse/i }));

    expect(mutate).toHaveBeenCalledWith(false);
  });

  it("desfavorita uma palavra", async () => {
    const user = userEvent.setup();

    useFavoriteStatusMock.mockReturnValue({ data: true, isLoading: false });

    render(<FavoriteButton word="mouse" />);

    await user.click(
      screen.getByRole("button", { name: /desfavoritar mouse/i }),
    );

    expect(mutate).toHaveBeenCalledWith(true);
  });

  it("desabilita o botao durante o loading", () => {
    useToggleFavoriteMock.mockReturnValue({ mutate, isPending: true });

    render(<FavoriteButton word="mouse" />);

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });
});
