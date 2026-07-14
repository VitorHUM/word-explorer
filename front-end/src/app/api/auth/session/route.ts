import { jsonError } from "@/lib/api-response";
import { getAuthToken } from "@/lib/auth-session";
import { BackendApiError, requestBackend } from "@/services/backend-api";
import { profileSchema } from "@/types/api";
import { NextResponse } from "next/server";

export async function GET() {
  const token = await getAuthToken();

  if (!token) {
    return jsonError("Sessao ausente.", 401);
  }

  try {
    const response = profileSchema.parse(await requestBackend("/user/me"));
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Nao foi possivel carregar a sessao.", 500);
  }
}
