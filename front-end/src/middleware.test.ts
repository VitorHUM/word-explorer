import { AUTH_COOKIE_NAME } from "@/lib/constants";

jest.mock("next/server", () => ({
  NextResponse: {
    next: () => ({ headers: new Headers() }),
    redirect: (url: URL) => ({
      headers: new Headers({ location: url.toString() }),
    }),
  },
}));

import { middleware } from "@/middleware";

function createRequest(pathname: string, token?: string) {
  return {
    cookies: {
      get: (name: string) =>
        name === AUTH_COOKIE_NAME && token ? { value: token } : undefined,
    },
    nextUrl: { pathname },
    url: `http://localhost${pathname}`,
  } as never;
}

describe("middleware", () => {
  it("redireciona para login quando uma pagina protegida e acessada sem token", () => {
    const response = middleware(createRequest("/home"));

    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("redireciona usuario autenticado para home ao acessar login", () => {
    const response = middleware(createRequest("/login", "token"));

    expect(response.headers.get("location")).toBe("http://localhost/home");
  });

  it("permite acesso a pagina protegida com token", () => {
    const response = middleware(createRequest("/favorites", "token"));

    expect(response.headers.get("location")).toBeNull();
  });
});
