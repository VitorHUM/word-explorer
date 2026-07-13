import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { BackendApiError, requestBackend } from "@/services/backend-api";
import { paginatedUserWordsSchema } from "@/types/api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const word = url.searchParams.get("word")?.trim().toLowerCase();

    if (!word) {
      return jsonError("A palavra e obrigatoria.", 400);
    }

    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const response = paginatedUserWordsSchema.parse(
        await requestBackend(`/user/me/favorites?page=${page}&limit=100`),
      );

      if (response.results.some((item) => item.word.toLowerCase() === word)) {
        return NextResponse.json({ isFavorite: true });
      }

      hasNext = response.hasNext;
      page += 1;
    }

    return NextResponse.json({ isFavorite: false });
  } catch (error) {
    if (error instanceof BackendApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Nao foi possivel verificar o favorito.", 500);
  }
}
