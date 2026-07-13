import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "./page";

const replace = jest.fn();
const mutateAsync = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

jest.mock("@/hooks/use-auth", () => ({
  useSignUp: () => ({
    mutateAsync,
    isPending: false,
    isError: false,
  }),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("valida confirmacao de senha", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/nome/i), "User Test");
    await user.type(screen.getByLabelText(/e-mail/i), "user@example.com");
    await user.type(screen.getByLabelText(/^senha$/i), "1234");
    await user.type(screen.getByLabelText(/confirmar senha/i), "4321");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByText("As senhas precisam ser iguais.")).toBeInTheDocument();
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
      expect(replace).toHaveBeenCalledWith("/");
    });
  });
});
