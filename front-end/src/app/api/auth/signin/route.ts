import { jsonError } from "@/lib/api-response";
import { setAuthToken } from "@/lib/auth-session";
import { signInSchema } from "@/lib/validation/auth";
import { BackendApiError, requestBackend } from "@/services/backend-api";
import { authResponseSchema } from "@/types/api";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = signInSchema.parse(await request.json());
    const response = authResponseSchema.parse(
      await requestBackend("/auth/signin", {
        method: "POST",
        auth: false,
        body: JSON.stringify(payload),
      }),
    );

    await setAuthToken(response.token);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Nao foi possivel autenticar.", 400);
  }
}
