import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

const replace = jest.fn();
const mutateAsync = jest.fn();
const useSignInMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

jest.mock("@/components/shared/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

jest.mock("@/hooks/use-auth", () => ({
  useSignIn: () => useSignInMock(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSignInMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
    });
  });

  it("mantem o botao desabilitado enquanto o formulario for invalido", () => {
    render(<LoginPage />);

    expect(screen.getByRole("button", { name: /entrar/i })).toBeDisabled();
  });

  it("mostra validacao do login para e-mail invalido", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), "email-invalido");
    await user.type(screen.getByLabelText(/^senha$/i), "1234");
    await user.tab();

    expect(screen.getByText(/informe um e-mail valido/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeDisabled();
  });

  it("faz login valido", async () => {
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

  it("mostra falha de login sem redirecionar", async () => {
    const user = userEvent.setup();

    useSignInMock.mockReturnValue({
      mutateAsync: jest
        .fn()
        .mockRejectedValueOnce(new Error("Credenciais invalidas")),
      isPending: false,
      isError: true,
      error: new Error("Credenciais invalidas"),
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), "user@example.com");
    await user.type(screen.getByLabelText(/^senha$/i), "test");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(
      await screen.findByText(/credenciais invalidas/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/credenciais invalidas/i)).toHaveTextContent(
      /credenciais invalidas/i,
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
