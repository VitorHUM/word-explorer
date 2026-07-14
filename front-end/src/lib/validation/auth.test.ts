import { signInSchema, signUpSchema } from "@/lib/validation/auth";

describe("auth validation schemas", () => {
  it("normaliza e valida login", () => {
    expect(
      signInSchema.parse({ email: " user@example.com ", password: "secret" }),
    ).toEqual({
      email: "user@example.com",
      password: "secret",
    });
  });

  it("rejeita cadastro com confirmacao de senha diferente", () => {
    expect(() =>
      signUpSchema.parse({
        name: "User Test",
        email: "user@example.com",
        password: "1234",
        confirmPassword: "4321",
      }),
    ).toThrow("As senhas precisam ser iguais.");
  });
});
