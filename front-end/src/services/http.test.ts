import { http, HttpError } from "@/services/http";

describe("http", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("retorna JSON em respostas de sucesso", async () => {
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response);

    await expect(http<{ ok: boolean }>("/api/test")).resolves.toEqual({
      ok: true,
    });
    expect(fetch).toHaveBeenCalledWith("/api/test", {
      headers: { "Content-Type": "application/json" },
    });
  });

  it("retorna null para 204", async () => {
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    await expect(http<null>("/api/empty")).resolves.toBeNull();
  });

  it("lanca HttpError com mensagem da API", async () => {
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Falha validada" }),
    } as Response);

    await expect(
      http("/api/error", { redirectOnUnauthorized: false }),
    ).rejects.toEqual(new HttpError("Falha validada", 400));
  });
});
