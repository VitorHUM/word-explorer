import type { SignInInput, SignUpInput } from "@/lib/validation/auth";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { http } from "@/services/http";
import { authResponseSchema, profileSchema } from "@/types/api";

export async function signIn(payload: SignInInput) {
  const body = signInSchema.parse(payload);
  const response = await http<unknown>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return authResponseSchema.parse(response);
}

export async function signUp(payload: SignUpInput) {
  const data = signUpSchema.parse(payload);
  const response = await http<unknown>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
    }),
  });

  return authResponseSchema.parse(response);
}

export async function getSessionProfile() {
  const response = await http<unknown>("/api/auth/session");
  return profileSchema.parse(response);
}

export async function logout() {
  await http("/api/auth/logout", { method: "POST" });
}
