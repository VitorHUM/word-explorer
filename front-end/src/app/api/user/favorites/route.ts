import { jsonError } from "@/lib/api-response";
import { BackendApiError, requestBackend } from "@/services/backend-api";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const response = await requestBackend(
      `/user/me/favorites?${url.searchParams.toString()}`,
      { clearAuthOnUnauthorized: true },
    );

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Nao foi possivel carregar os favoritos.", 500);
  }
}
