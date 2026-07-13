import { clearAuthToken, getAuthToken } from "@/lib/auth-session";
import { apiErrorSchema } from "@/types/api";

export class BackendApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type RequestBackendOptions = RequestInit & {
  auth?: boolean;
};

export async function requestBackend(
  path: string,
  options: RequestBackendOptions = {},
) {
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL nao foi definida.");
  }

  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = await getAuthToken();

    if (token) {
      headers.set("Authorization", token);
    }
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Nao foi possivel concluir a requisicao.";

    try {
      const payload = apiErrorSchema.parse(await response.json());
      message = payload.message;
    } catch {
      message = response.statusText || message;
    }

    if (response.status === 401) {
      await clearAuthToken();
    }

    throw new BackendApiError(message, response.status);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
