import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

const replace = jest.fn();
const mutateAsync = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

jest.mock("@/components/shared/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

jest.mock("@/hooks/use-auth", () => ({
  useSignIn: () => ({
    mutateAsync,
    isPending: false,
    isError: false,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("mantem o botao desabilitado enquanto o formulario for invalido", () => {
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: /entrar/i })).toBeDisabled();
  });

  it("envia formulario com sucesso", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), "user@example.com");
    await user.type(screen.getByLabelText(/^senha$/i), "test");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "test",
      });
      expect(replace).toHaveBeenCalledWith("/home");
    });
  });
});
