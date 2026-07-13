"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AuthFormShell } from "@/components/shared/auth-form-shell";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { useSignIn } from "@/hooks/use-auth";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";

export default function LoginPage() {
  const router = useRouter();
  const signInMutation = useSignIn();
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInInput) {
    await signInMutation.mutateAsync(values);
    router.replace("/");
  }

  return (
    <AuthFormShell
      description="Entre para consultar o dicionario, acompanhar seu historico e gerenciar favoritos."
      footer={
        <>
          Nao tem conta? <Link className="text-color-accent underline" href="/register">Criar conta</Link>
        </>
      }
      title="Login"
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField error={form.formState.errors.email?.message} id="email" label="E-mail" type="email" {...form.register("email")} />
        <FormField error={form.formState.errors.password?.message} id="password" label="Senha" type="password" {...form.register("password")} />
        {signInMutation.isError ? <p className="text-sm text-red-600">{signInMutation.error.message}</p> : null}
        <Button className="w-full" disabled={signInMutation.isPending} type="submit">
          {signInMutation.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthFormShell>
  );
}
