import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

const replace = jest.fn();
const mutateAsync = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
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

  it("valida campos obrigatorios", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("Informe um e-mail valido.")).toBeInTheDocument();
    expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
  });

  it("envia formulario com sucesso", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), "user@example.com");
    await user.type(screen.getByLabelText(/senha/i), "test");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "test",
      });
      expect(replace).toHaveBeenCalledWith("/");
    });
  });
});
