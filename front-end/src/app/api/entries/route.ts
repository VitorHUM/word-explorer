import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { BackendApiError, requestBackend } from "@/services/backend-api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryString = url.searchParams.toString();
    const response = await requestBackend(`/entries/en${queryString ? `?${queryString}` : ""}`);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Nao foi possivel listar as palavras.", 500);
  }
}
