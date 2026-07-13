import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe a senha."),
});

export const signUpPayloadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("Informe um e-mail valido."),
  password: z.string().min(4, "A senha deve ter no minimo 4 caracteres."),
});

export const signUpSchema = signUpPayloadSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirme a senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas precisam ser iguais.",
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
