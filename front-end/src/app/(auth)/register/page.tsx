"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AuthFormShell } from "@/components/shared/auth-form-shell";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { useSignUp } from "@/hooks/use-auth";
import { signUpSchema, type SignUpInput } from "@/lib/validation/auth";

export default function RegisterPage() {
  const router = useRouter();
  const signUpMutation = useSignUp();
  const form = useForm<SignUpInput>({
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
    router.replace("/");
  }

  return (
    <AuthFormShell
      description="Crie sua conta para salvar buscas recentes e palavras favoritas."
      footer={
        <>
          Ja tem conta? <Link className="text-color-accent underline" href="/login">Fazer login</Link>
        </>
      }
      title="Cadastro"
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField error={form.formState.errors.name?.message} id="name" label="Nome" {...form.register("name")} />
        <FormField error={form.formState.errors.email?.message} id="email" label="E-mail" type="email" {...form.register("email")} />
        <FormField error={form.formState.errors.password?.message} id="password" label="Senha" type="password" {...form.register("password")} />
        <FormField error={form.formState.errors.confirmPassword?.message} id="confirmPassword" label="Confirmar senha" type="password" {...form.register("confirmPassword")} />
        {signUpMutation.isError ? <p className="text-sm text-red-600">{signUpMutation.error.message}</p> : null}
        <Button className="w-full" disabled={signUpMutation.isPending} type="submit">
          {signUpMutation.isPending ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    </AuthFormShell>
  );
}
