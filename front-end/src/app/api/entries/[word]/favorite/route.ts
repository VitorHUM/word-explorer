import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { BackendApiError, requestBackend } from "@/services/backend-api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ word: string }> },
) {
  try {
    const { word } = await params;
    await requestBackend(`/entries/en/${encodeURIComponent(word)}/favorite`, {
      method: "POST",
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof BackendApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Nao foi possivel favoritar a palavra.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ word: string }> },
) {
  try {
    const { word } = await params;
    await requestBackend(`/entries/en/${encodeURIComponent(word)}/unfavorite`, {
      method: "DELETE",
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof BackendApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Nao foi possivel desfavoritar a palavra.", 500);
  }
}
