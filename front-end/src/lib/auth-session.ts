import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { cookies } from "next/headers";

export async function getAuthToken() {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value;
}

export async function setAuthToken(token: string) {
  (await cookies()).set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function clearAuthToken() {
  (await cookies()).delete(AUTH_COOKIE_NAME);
}
