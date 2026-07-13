# Word Explorer

Aplicação full-stack para consulta, histórico e gerenciamento de palavras em inglês, utilizando a Free Dictionary API.

## Estrutura

- `back-end`: API REST desenvolvida com NestJS
- `front-end`: aplicação web desenvolvida com Next.js

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

- Next.js
- React
- TypeScript
- Tailwind CSS

## Executando com Docker

Suba PostgreSQL, Redis e back-end:

```bash
docker compose up --build
```

A API fica disponível em `http://localhost:3001` e o healthcheck em `http://localhost:3001/health`.

Execute migrations separadamente, de forma explícita:

```bash
docker compose run --rm back-end-migrate
```

Importe o dicionário separadamente, somente quando necessário:

```bash
docker compose run --rm back-end-import
```

Comandos úteis:

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f back-end
```
