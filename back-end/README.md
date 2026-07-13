# Word Explorer API

API backend em NestJS para autenticação de usuários e consulta de palavras em inglês. A aplicação expõe uma API própria para o front-end, faz proxy da Free Dictionary API para detalhes de palavras, persiste histórico e favoritos em PostgreSQL e usa Redis para cache de respostas repetidas.

## Stack

- Node.js
- TypeScript
- NestJS
- Prisma
- PostgreSQL
- Redis
- Swagger / OpenAPI 3.0
- Jest / Supertest
- Docker

## Funcionalidades

- `GET /` retorna `{ "message": "English Dictionary" }`
- `POST /auth/signup` cria usuário e retorna token JWT
- `POST /auth/signin` autentica usuário e retorna token JWT
- `GET /entries/en` lista palavras com paginação e busca por prefixo
- `GET /entries/en/:word` consulta detalhes da palavra via Free Dictionary API e registra histórico
- `POST /entries/en/:word/favorite` adiciona palavra aos favoritos
- `DELETE /entries/en/:word/unfavorite` remove palavra dos favoritos
- `GET /user/me` retorna o perfil autenticado
- `GET /user/me/history` retorna o histórico paginado
- `GET /user/me/favorites` retorna os favoritos paginados
- `npm run dictionary:import` importa `words_dictionary.json` do repositório `dwyl/english-words`

## Requisitos

- Node.js 20+
- PostgreSQL
- Redis

## Instalação

```bash
npm install
cp .env.example .env
```

Preencha o `.env` com os valores de banco, Redis e JWT.

## Variáveis de ambiente

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://word_explorer:word_explorer@localhost:5432/word_explorer?schema=public"
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_TTL_SECONDS=3600
JWT_SECRET=change-me
JWT_EXPIRES_IN=15m
DICTIONARY_API_URL=https://api.dictionaryapi.dev/api/v2
DICTIONARY_CACHE_TTL_SECONDS=3600
```

## Uso

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run start:dev
```

Endpoints auxiliares:

- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs/json`

## Importação do dicionário

```bash
npm run dictionary:import
```

O script baixa o arquivo `words_dictionary.json`, normaliza as palavras, insere em lotes no PostgreSQL e invalida o cache de listagens em Redis.

## Testes e qualidade

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Docker

O repositório possui `Dockerfile` no backend e `docker-compose.yml` na raiz para facilitar a subida da stack local.

## Gitignore

O projeto ignora artefatos locais e sensíveis, incluindo `node_modules`, `dist`, `.next`, `coverage` e arquivos `.env`.
