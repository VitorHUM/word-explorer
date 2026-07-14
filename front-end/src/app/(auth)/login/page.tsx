"use client";

import { AuthFormShell } from "@/components/shared/auth-form-shell";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { useSignIn } from "@/hooks/use-auth";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";
import { SESSION_EXPIRED_REASON } from "@/services/http";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function LoginPage() {
  const router = useRouter();
  const signInMutation = useSignIn();
  const [sessionExpired, setSessionExpired] = useState(false);
  const form = useForm<SignInInput>({
    mode: "onChange",
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setSessionExpired(searchParams.get("reason") === SESSION_EXPIRED_REASON);
  }, []);

  async function onSubmit(values: SignInInput) {
    try {
      await signInMutation.mutateAsync(values);
      router.replace("/home");
    } catch {
      form.setFocus("password");
    }
  }

  return (
    <AuthFormShell
      footer={
        <>
          Não tem conta?{" "}
          <Link className="text-primary underline" href="/register">
            Criar conta
          </Link>
        </>
      }
      title="Login"
    >
      {sessionExpired ? (
        <p className="text-sm text-amber-700" role="status">
          Sua sessão expirou. Faça login novamente.
        </p>
      ) : null}
      <form
        aria-busy={signInMutation.isPending}
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <fieldset className="space-y-4" disabled={signInMutation.isPending}>
          <FormField
            error={form.formState.errors.email?.message}
            id="email"
            label="E-mail"
            type="email"
            {...form.register("email")}
          />
          <FormField
            error={form.formState.errors.password?.message}
            id="password"
            label="Senha"
            type="password"
            {...form.register("password")}
          />
          {signInMutation.isError ? (
            <p className="text-sm text-red-600" role="alert">
              {signInMutation.error.message}
            </p>
          ) : null}
          <Button
            aria-busy={signInMutation.isPending}
            className="w-full"
            disabled={signInMutation.isPending || !form.formState.isValid}
            type="submit"
          >
            {signInMutation.isPending ? "Entrando..." : "Entrar"}
          </Button>
        </fieldset>
      </form>
    </AuthFormShell>
  );
}
