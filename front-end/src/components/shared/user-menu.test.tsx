import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "./user-menu";

const replace = jest.fn();
const mutateAsync = jest.fn();

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

jest.mock("@/hooks/use-auth", () => ({
  useLogout: () => ({
    mutateAsync,
    isPending: false,
  }),
  useSession: () => ({
    data: { name: "Usuario Teste" },
  }),
}));

describe("UserMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("faz logout e redireciona para login", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValueOnce(undefined);

    render(<UserMenu />);

    await user.click(screen.getByRole("button", { name: /usuario teste/i }));
    await user.click(screen.getByRole("button", { name: /^sair$/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
      expect(replace).toHaveBeenCalledWith("/login");
    });
  });
});
