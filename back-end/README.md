# Word Explorer API

API backend em NestJS para autenticação de usuários e consulta de palavras em inglês. O front-end consome apenas esta API. Os detalhes de palavras são obtidos via proxy da Free Dictionary API, com persistência local de histórico, favoritos e lista de palavras em PostgreSQL, além de cache em Redis.

## Objetivo

- Autenticar usuários com JWT
- Listar palavras importadas localmente
- Buscar palavras com paginação
- Consultar detalhes de uma palavra via proxy externo
- Registrar histórico automaticamente
- Gerenciar favoritos
- Retornar headers de cache e tempo de resposta

## Stack

- Node.js
- TypeScript
- NestJS
- Prisma
- PostgreSQL
- Redis
- Swagger
- Jest
- Docker

## Arquitetura

- `Controller -> Service -> Repository`
- DTOs de entrada com `class-validator`
- DTOs de saída com `class-transformer`
- `JwtAuthGuard` para autenticação
- `HttpExceptionFilter` para erro humanizado
- `CacheableResponseInterceptor` para `x-cache`
- `ResponseTimeInterceptor` para `x-response-time`

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 14+
- Redis 7+
- Docker e Docker Compose opcionais

## Estrutura útil

- `src/auth`: autenticação e JWT
- `src/entries`: listagem, detalhes e favoritos
- `src/user`: perfil, histórico e favoritos do usuário
- `src/infrastructure/database/repositories`: acesso a dados
- `src/dictionary/dictionary-importer.ts`: importador de palavras

## Variáveis de ambiente

Crie o arquivo `.env` a partir de `.env.example`.

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://word_explorer:word_explorer@localhost:5432/word_explorer?schema=public"
CORS_ALLOWED_ORIGINS=http://localhost:3000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_TTL_SECONDS=3600
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=60
AUTH_THROTTLE_TTL_MS=60000
AUTH_THROTTLE_LIMIT=5
JWT_SECRET=change-me
JWT_EXPIRES_IN=15m
DICTIONARY_API_URL=https://api.dictionaryapi.dev/api/v2
DICTIONARY_CACHE_TTL_SECONDS=3600
```

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o `.env`

```bash
cp .env.example .env
```

### 3. Subir PostgreSQL e Redis

Se você já possui PostgreSQL e Redis locais, pule esta etapa. Caso contrário, use Docker:

```bash
docker compose up -d postgres redis
```

### 4. Gerar o client do Prisma

```bash
npm run prisma:generate
```

### 5. Aplicar migrations

```bash
npm run prisma:migrate:deploy
```

Para ambiente de desenvolvimento, se quiser criar novas migrations:

```bash
npm run prisma:migrate:dev
```

### 6. Importar a lista de palavras

```bash
npm run dictionary:import
```

Esse passo baixa `words_dictionary.json`, normaliza as palavras, insere em lotes no PostgreSQL e invalida o cache de listagem.

### 7. Iniciar a API

```bash
npm run start:dev
```

### 8. Acessar recursos auxiliares

- API: `http://localhost:3001`
- Healthcheck: `http://localhost:3001/health`
- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs/json`

## Como rodar com Docker Compose

### Subir banco, cache e API

```bash
docker compose up -d postgres redis back-end
```

### Aplicar migrations pelo container auxiliar

```bash
docker compose --profile tools run --rm back-end-migrate
```

### Importar palavras pelo container auxiliar

```bash
docker compose --profile tools run --rm back-end-import
```

### Ver logs da API

```bash
docker compose logs -f back-end
```

### Derrubar containers

```bash
docker compose down
```

### Derrubar containers e volumes

```bash
docker compose down -v
```

## Fluxo recomendado para ambiente limpo com Docker

```bash
docker compose up -d postgres redis
docker compose --profile tools run --rm back-end-migrate
docker compose --profile tools run --rm back-end-import
docker compose up -d back-end
```

## Scripts úteis

```bash
npm run start:dev
npm run build
npm run start:prod
npm run lint
npm run test
npm run test:e2e
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:studio
npm run dictionary:import
```

## Autenticação

As rotas protegidas exigem header:

```http
Authorization: Bearer <jwt>
```

O token é retornado por `signup` e `signin` já com o prefixo `Bearer ` no campo `token`.

## Headers de resposta

Todas as respostas retornam:

- `x-response-time`: tempo de processamento em milissegundos

As rotas cacheáveis também retornam:

- `x-cache: HIT`: resposta veio do cache
- `x-cache: MISS`: resposta foi buscada na origem

## Segurança aplicada

- `helmet` para hardening de headers HTTP
- CORS restritivo via `CORS_ALLOWED_ORIGINS`
- throttling global
- throttling mais restritivo para `signup` e `signin`
- JWT com segredo externo ao código
- validação de body, query e params com `ValidationPipe`
- erros humanizados no formato `{ "message": "..." }`

## Formato de erro

Exemplo:

```json
{ "message": "Error message" }
```

## Paginação

O projeto usa paginação por `page` e `limit`.

Parâmetros padrão:

- `page=1`
- `limit=20`

Limites:

- `page >= 1`
- `1 <= limit <= 100`

Formato de retorno paginado:

```json
{
  "results": [],
  "totalDocs": 0,
  "page": 1,
  "totalPages": 0,
  "hasNext": false,
  "hasPrev": false
}
```

## Rotas

### `GET /`

Retorna a identificação da API.

Response `200`:

```json
{ "message": "English Dictionary" }
```

### `POST /auth/signup`

Cria um usuário.

Body:

```json
{
  "name": "User 1",
  "email": "example@email.com",
  "password": "test"
}
```

Response `200`:

```json
{
  "id": "f3a106sa65dv53ab2c1380acef",
  "name": "User 1",
  "token": "Bearer JWT.Token"
}
```

Erros comuns:

- `400` body inválido
- `409` e-mail já cadastrado
- `429` muitas tentativas

### `POST /auth/signin`

Autentica um usuário existente.

Body:

```json
{
  "email": "example@email.com",
  "password": "test"
}
```

Response `200`:

```json
{
  "id": "f3a106sa65dv53ab2c1380acef",
  "name": "User 1",
  "token": "Bearer JWT.Token"
}
```

Erros comuns:

- `400` body inválido
- `401` credenciais inválidas
- `429` muitas tentativas

### `GET /entries/en`

Lista palavras do dicionário local com paginação e busca por prefixo.

Query params:

- `search`: opcional, busca por prefixo case-insensitive
- `page`: opcional, padrão `1`
- `limit`: opcional, padrão `20`, máximo `100`

Exemplo:

```http
GET /entries/en?search=fire&limit=4&page=1
```

Response `200`:

```json
{
  "results": ["fire", "firefly", "fireplace", "fireman"],
  "totalDocs": 20,
  "page": 1,
  "totalPages": 5,
  "hasNext": true,
  "hasPrev": false
}
```

Headers relevantes:

- `x-cache`
- `x-response-time`

Erros comuns:

- `400` query inválida
- `401` não autenticado

### `GET /entries/en/:word`

Consulta o detalhe da palavra e registra histórico automaticamente para o usuário autenticado.

Path params:

- `word`: palavra em inglês

Exemplo:

```http
GET /entries/en/fire
```

Response `200`:

```json
{
  "word": "fire",
  "phonetics": [
    {
      "text": "/faɪə/",
      "audio": "https://api.dictionaryapi.dev/media/pronunciations/en/fire-us.mp3"
    }
  ],
  "meanings": [
    {
      "partOfSpeech": "noun",
      "definitions": [
        {
          "definition": "Combustion or burning.",
          "example": "The fire was warm.",
          "synonyms": ["blaze"],
          "antonyms": ["ice"]
        }
      ],
      "synonyms": ["flame"],
      "antonyms": ["water"]
    }
  ],
  "sourceUrls": ["https://en.wiktionary.org/wiki/fire"]
}
```

Erros comuns:

- `400` param inválido
- `401` não autenticado
- `404` palavra não encontrada localmente ou no dicionário externo

### `POST /entries/en/:word/favorite`

Adiciona a palavra aos favoritos do usuário autenticado.

Path params:

- `word`: palavra em inglês

Response `204`

Sem body.

Erros comuns:

- `400` param inválido
- `401` não autenticado
- `404` palavra não encontrada localmente

### `DELETE /entries/en/:word/unfavorite`

Remove a palavra dos favoritos do usuário autenticado.

Path params:

- `word`: palavra em inglês

Response `204`

Sem body.

Erros comuns:

- `400` param inválido
- `401` não autenticado
- `404` palavra não encontrada localmente

### `GET /user/me`

Retorna o perfil do usuário autenticado.

Response `200`:

```json
{
  "id": "f3a106sa65dv53ab2c1380acef",
  "name": "User 1",
  "email": "example@email.com",
  "createdAt": "2024-05-05T19:28:13.531Z",
  "updatedAt": "2024-05-05T19:28:13.531Z"
}
```

### `GET /user/me/history`

Retorna histórico paginado do usuário autenticado.

Query params:

- `page`
- `limit`

Response `200`:

```json
{
  "results": [
    { "word": "fire", "added": "2024-05-05T19:28:13.531Z" },
    { "word": "firefly", "added": "2024-05-05T19:28:44.021Z" }
  ],
  "totalDocs": 20,
  "page": 2,
  "totalPages": 5,
  "hasNext": true,
  "hasPrev": true
}
```

### `GET /user/me/favorites`

Retorna favoritos paginados do usuário autenticado.

Query params:

- `page`
- `limit`

Response `200`:

```json
{
  "results": [
    { "word": "fire", "added": "2024-05-05T19:30:23.928Z" },
    { "word": "firefly", "added": "2024-05-05T19:30:24.088Z" }
  ],
  "totalDocs": 20,
  "page": 2,
  "totalPages": 5,
  "hasNext": true,
  "hasPrev": true
}
```

## Fluxo mínimo para validar manualmente

### 1. Criar usuário

```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"User 1","email":"user1@example.com","password":"test"}'
```

### 2. Autenticar

```bash
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"test"}'
```

### 3. Listar palavras

```bash
curl "http://localhost:3001/entries/en?search=fire&limit=4" \
  -H "Authorization: Bearer <jwt>"
```

### 4. Consultar detalhe

```bash
curl "http://localhost:3001/entries/en/fire" \
  -H "Authorization: Bearer <jwt>"
```

### 5. Favoritar

```bash
curl -X POST "http://localhost:3001/entries/en/fire/favorite" \
  -H "Authorization: Bearer <jwt>"
```

### 6. Consultar histórico

```bash
curl "http://localhost:3001/user/me/history?page=1&limit=20" \
  -H "Authorization: Bearer <jwt>"
```

## Testes e qualidade

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Observações

- A lista de palavras depende da importação do arquivo externo
- A rota de detalhes depende da Free Dictionary API
- A aplicação funciona sem Redis, mas nesse cenário as respostas cacheáveis retornam `x-cache: MISS`
