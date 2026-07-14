"use client";

import { AuthFormShell } from "@/components/shared/auth-form-shell";
import { FormField } from "@/components/shared/form-field";
import { PasswordCriteria } from "@/components/shared/password-criteria";
import { Button } from "@/components/ui/button";
import { useSignUp } from "@/hooks/use-auth";
import { signUpSchema, type SignUpInput } from "@/lib/validation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function RegisterPage() {
  const router = useRouter();
  const signUpMutation = useSignUp();
  const form = useForm<SignUpInput>({
    mode: "onChange",
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignUpInput) {
    await signUpMutation.mutateAsync(values);
    router.replace("/home");
  }

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");

  return (
    <AuthFormShell
      footer={
        <>
          Já tem conta?{" "}
          <Link className="text-primary underline" href="/login">
            Fazer login
          </Link>
        </>
      }
      title="Cadastro"
    >
      <form
        aria-busy={signUpMutation.isPending}
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <fieldset className="space-y-4" disabled={signUpMutation.isPending}>
          <FormField
            error={form.formState.errors.name?.message}
            id="name"
            label="Nome"
            {...form.register("name")}
          />
          <FormField
            error={form.formState.errors.email?.message}
            id="email"
            label="E-mail"
            type="email"
            {...form.register("email")}
          />
          <FormField
            error={form.formState.errors.password?.message}
            hideError
            id="password"
            label="Senha"
            type="password"
            {...form.register("password")}
          />
          <FormField
            error={form.formState.errors.confirmPassword?.message}
            hideError
            id="confirmPassword"
            label="Confirmar senha"
            type="password"
            {...form.register("confirmPassword")}
          />
          <PasswordCriteria
            confirmPassword={confirmPassword}
            password={password}
          />
          {signUpMutation.isError ? (
            <p className="text-sm text-red-600" role="alert">
              {signUpMutation.error.message}
            </p>
          ) : null}
          <Button
            aria-busy={signUpMutation.isPending}
            className="w-full"
            disabled={signUpMutation.isPending || !form.formState.isValid}
            type="submit"
          >
            {signUpMutation.isPending ? "Criando conta..." : "Criar conta"}
          </Button>
        </fieldset>
      </form>
    </AuthFormShell>
  );
}
