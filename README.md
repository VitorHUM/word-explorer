# Word Explorer

Aplicacao full-stack para consulta, historico e gerenciamento de palavras em ingles, utilizando a Free Dictionary API no back-end e uma interface em Next.js no front-end.

## Estrutura

- `back-end`: API REST desenvolvida com NestJS
- `front-end`: aplicacao web desenvolvida com Next.js

## Tecnologias

### Back-end

- Node.js
- TypeScript
- NestJS
- PostgreSQL
- Prisma
- Redis
- JWT

### Front-end

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod

## Arquitetura geral

- O front-end autentica usuarios e consome a API do back-end
- O back-end concentra autenticacao, historico, favoritos e proxy do dicionario externo
- O front-end usa proxies `/api/*` para anexar o JWT ao back-end via cookie `httpOnly`

Fluxo resumido:

```text
Browser -> Next.js Front-end -> Route Handlers /api/* -> NestJS API -> PostgreSQL / Redis / Free Dictionary API
```

## Executando com Docker

Suba PostgreSQL, Redis, back-end e front-end:

```bash
docker compose up --build
```

Recursos disponiveis:

- Front-end: `http://localhost:3000`
- API: `http://localhost:3001`
- Healthcheck: `http://localhost:3001/health`

Execute migrations separadamente, de forma explicita:

```bash
docker compose --profile tools run --rm back-end-migrate
```

Importe o dicionario separadamente, somente quando necessario:

```bash
docker compose --profile tools run --rm back-end-import
```

Comandos uteis:

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f back-end
docker compose logs -f front-end
```

## Execução local

### Back-end

Siga as instrucoes em `back-end/README.md`.

### Front-end

Siga as instrucoes em `front-end/README.md`.

## Relação entre as partes

- O back-end expõe as rotas REST de autenticacao, dicionario, historico e favoritos
- O front-end nao fala com a API diretamente no browser autenticado; ele usa proxies do Next.js
- A protecao de rotas no front-end e feita por `middleware.ts` com base no cookie de sessao

## Links úteis

- README do back-end: `back-end/README.md`
- README do front-end: `front-end/README.md`
