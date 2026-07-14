import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "./page";

const replace = jest.fn();
const mutateAsync = jest.fn();
const useSignUpMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

jest.mock("@/components/shared/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

jest.mock("@/hooks/use-auth", () => ({
  useSignUp: () => useSignUpMock(),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSignUpMock.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
    });
  });

  it("mantem o botao desabilitado quando a confirmacao da senha estiver diferente", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/nome/i), "User Test");
    await user.type(screen.getByLabelText(/e-mail/i), "user@example.com");
    await user.type(screen.getByLabelText(/^senha$/i), "1234");
    await user.type(screen.getByLabelText(/confirmar senha/i), "4321");

    expect(screen.getByRole("button", { name: /criar conta/i })).toBeDisabled();
  });

  it("mostra validacao do cadastro para e-mail invalido", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/nome/i), "User Test");
    await user.type(screen.getByLabelText(/e-mail/i), "email-invalido");
    await user.type(screen.getByLabelText(/^senha$/i), "1234");
    await user.type(screen.getByLabelText(/confirmar senha/i), "1234");
    await user.tab();

    expect(screen.getByText(/informe um e-mail valido/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar conta/i })).toBeDisabled();
  });

  it("envia cadastro com sucesso", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValueOnce(undefined);

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/nome/i), "User Test");
    await user.type(screen.getByLabelText(/e-mail/i), "user@example.com");
    await user.type(screen.getByLabelText(/^senha$/i), "1234");
    await user.type(screen.getByLabelText(/confirmar senha/i), "1234");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        name: "User Test",
        email: "user@example.com",
        password: "1234",
        confirmPassword: "1234",
      });
      expect(replace).toHaveBeenCalledWith("/home");
    });
  });
});
