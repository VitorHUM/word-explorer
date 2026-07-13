import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { BackendApiError, requestBackend } from "@/services/backend-api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const response = await requestBackend(`/user/me/favorites?${url.searchParams.toString()}`);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Nao foi possivel carregar os favoritos.", 500);
  }
}
