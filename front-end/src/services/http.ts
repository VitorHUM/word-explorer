import { apiErrorSchema } from "@/types/api";

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type HttpOptions = RequestInit & {
  redirectOnUnauthorized?: boolean;
};

export async function http<T>(input: RequestInfo | URL, init?: HttpOptions) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = "Nao foi possivel concluir a requisicao.";

    try {
      const payload = apiErrorSchema.parse(await response.json());
      message = payload.message;
    } catch {
      message = response.statusText || message;
    }

    if (response.status === 401 && init?.redirectOnUnauthorized !== false && typeof window !== "undefined") {
      window.location.href = "/login";
    }

    throw new HttpError(message, response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
