import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { BackendApiError, requestBackend } from "@/services/backend-api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ word: string }> },
) {
  try {
    const { word } = await params;
    const response = await requestBackend(`/entries/en/${encodeURIComponent(word)}`);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Nao foi possivel carregar os detalhes.", 500);
  }
}
