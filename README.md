# Word Explorer

Aplicação full-stack para consulta, histórico e gerenciamento de palavras em inglês. O back-end em NestJS concentra autenticação, persistência, cache e proxy da Free Dictionary API. O front-end em Next.js entrega a interface web, protege rotas autenticadas e usa route handlers para manter o JWT em cookie `httpOnly`.

## Objetivo

- Autenticar usuários com JWT
- Consultar palavras em inglês
- Exibir detalhes, fonética, áudio, definições, sinônimos, antônimos e fontes
- Registrar histórico de consultas por usuário
- Gerenciar favoritos
- Listar o dicionário com busca e paginação
- Proteger rotas web autenticadas
- Manter tokens fora de `localStorage`
- Permitir execução local ou via Docker Compose

## Stack

### Back-end

- Node.js
- TypeScript
- NestJS
- Prisma
- PostgreSQL
- Redis
- Swagger
- Jest
- Docker

### Front-end

- Node.js
- TypeScript
- Next.js 15 com App Router
- React 19
- Tailwind CSS
- Radix UI
- TanStack Query
- React Hook Form
- Zod
- Jest
- Docker

## Arquitetura geral

```text
Browser -> Next.js -> Route Handlers /api/* -> NestJS API -> PostgreSQL
                                                        -> Redis
                                                        -> Free Dictionary API
```

- O browser acessa a aplicação Next.js em `http://localhost:3000`
- O front-end usa `/api/*` como camada server-side para falar com o back-end
- O Next.js salva o JWT em cookie `httpOnly`
- O back-end valida JWT, consulta PostgreSQL, usa Redis para cache e chama a Free Dictionary API quando precisa de detalhes
- O PostgreSQL armazena usuários, palavras importadas, histórico e favoritos
- O Redis armazena respostas cacheáveis do back-end

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 14+ ou container Docker
- Redis 7+ ou container Docker
- Docker e Docker Compose opcionais

## Estrutura útil

- `back-end`: API REST em NestJS
- `back-end/src/auth`: autenticação e JWT
- `back-end/src/entries`: listagem, detalhes e favoritos
- `back-end/src/user`: perfil, histórico e favoritos do usuário
- `back-end/src/dictionary/dictionary-importer.ts`: importação da lista de palavras
- `front-end`: aplicação web em Next.js
- `front-end/src/app`: páginas, layouts e route handlers
- `front-end/src/components`: componentes de UI e domínio
- `front-end/src/hooks`: hooks de sessão, palavras e favoritos
- `front-end/src/services`: clientes HTTP e integrações
- `docker-compose.yml`: PostgreSQL, Redis, API, web e containers auxiliares

## Portas e recursos

- Front-end: `http://localhost:3000`
- API: `http://localhost:3001`
- Healthcheck da API: `http://localhost:3001/health`
- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs/json`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Variáveis de ambiente

### Back-end

Crie `back-end/.env` a partir de `back-end/.env.example`.

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://word_explorer:word_explorer@localhost:5432/word_explorer?schema=public"
CORS_ALLOWED_ORIGINS=http://localhost:3000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_TTL_SECONDS=3600
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=300
AUTH_THROTTLE_TTL_MS=60000
AUTH_THROTTLE_LIMIT=30
JWT_SECRET=change-me
JWT_EXPIRES_IN=60m
DICTIONARY_API_URL=https://api.dictionaryapi.dev/api/v2
DICTIONARY_CACHE_TTL_SECONDS=3600
```

### Front-end

Crie `front-end/.env.local` a partir de `front-end/.env.example`.

```env
API_BASE_URL=http://localhost:3001
```

## Como rodar localmente

### 1. Instalar dependências do back-end

```bash
cd back-end
npm install
```

### 2. Configurar ambiente do back-end

```bash
cp .env.example .env
```

### 3. Subir PostgreSQL e Redis

Na raiz do repositório:

```bash
docker compose up -d postgres redis
```

### 4. Preparar banco e dicionário

Em `back-end`:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run dictionary:import
```

### 5. Iniciar API

Em `back-end`:

```bash
npm run start:dev
```

### 6. Instalar dependências do front-end

Em outro terminal:

```bash
cd front-end
npm install
```

### 7. Configurar ambiente do front-end

```bash
cp .env.example .env.local
```

### 8. Iniciar web

```bash
npm run dev
```

### 9. Acessar a aplicação

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

## Como rodar com Docker Compose

### Subir banco e cache

```bash
docker compose up -d postgres redis
```

### Aplicar migrations

```bash
docker compose --profile tools run --rm back-end-migrate
```

### Importar palavras

```bash
docker compose --profile tools run --rm back-end-import
```

### Subir API e web

```bash
docker compose up -d back-end front-end
```

### Ver logs

```bash
docker compose logs -f back-end
docker compose logs -f front-end
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
docker compose up -d back-end front-end
```

## Scripts úteis

### Back-end

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

### Front-end

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:coverage
npm run format
```

## Autenticação

O back-end emite JWT no formato `Bearer <jwt>` em `POST /auth/signup` e `POST /auth/signin`.

O front-end não entrega esse token ao JavaScript do browser. O fluxo usado pela aplicação web é:

```text
Browser -> Next.js /api/auth/signin -> NestJS /auth/signin -> cookie httpOnly
```

Nas chamadas autenticadas:

```text
Browser -> Next.js /api/* -> NestJS API com Authorization: Bearer <jwt>
```

## Segurança aplicada

- JWT com segredo externo ao código
- Cookie `httpOnly` no front-end
- Token fora de `localStorage`
- CORS restritivo no back-end
- `helmet` no back-end
- Throttling global e throttling específico de autenticação
- Validação de entrada no back-end com DTOs e `ValidationPipe`
- Validação de formulários e respostas no front-end com Zod
- Links externos com `rel="noopener noreferrer"`
- Sem uso de `dangerouslySetInnerHTML` no front-end

## Formato de erro

O formato esperado de erro é:

```json
{ "message": "Error message" }
```

O back-end centraliza erros humanizados, e o front-end exibe mensagens de erro nas telas de formulário, listagem e detalhes.

## Paginação

O projeto usa paginação por `page` e `limit`.

Parâmetros padrão:

- `page=1`
- `limit=20`

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

## Principais rotas da API

### Públicas

- `GET /`: identificação da API
- `GET /health`: healthcheck
- `POST /auth/signup`: cadastro
- `POST /auth/signin`: login
- `GET /docs`: Swagger UI
- `GET /docs/json`: OpenAPI JSON

### Protegidas

- `GET /entries/en`: lista palavras com busca e paginação
- `GET /entries/en/:word`: consulta detalhes da palavra e registra histórico
- `POST /entries/en/:word/favorite`: adiciona favorito
- `DELETE /entries/en/:word/unfavorite`: remove favorito
- `GET /user/me`: perfil do usuário
- `GET /user/me/history`: histórico paginado
- `GET /user/me/favorites`: favoritos paginados

## Principais páginas da web

### Públicas

- `GET /`: landing page
- `GET /login`: login
- `GET /register`: cadastro

### Protegidas

- `GET /home`: busca principal e histórico recente
- `GET /dictionary`: dicionário paginado
- `GET /favorites`: favoritos do usuário
- `GET /word/[word]`: detalhe da palavra
- `GET /profile`: perfil e histórico

## Fluxo mínimo para validar manualmente

### 1. Subir ambiente

```bash
docker compose up -d postgres redis
docker compose --profile tools run --rm back-end-migrate
docker compose --profile tools run --rm back-end-import
docker compose up -d back-end front-end
```

### 2. Criar usuário

Acesse `http://localhost:3000/register`.

### 3. Autenticar

Acesse `http://localhost:3000/login`.

### 4. Buscar palavra

Use a home ou acesse `http://localhost:3000/dictionary`.

### 5. Consultar detalhe

Abra uma palavra pela interface ou acesse `http://localhost:3000/word/fire`.

### 6. Favoritar

Clique no botão de favorito na tela de detalhe.

### 7. Conferir favoritos

Acesse `http://localhost:3000/favorites`.

### 8. Conferir histórico

Acesse `http://localhost:3000/profile`.

## Testes e qualidade

### Back-end

```bash
cd back-end
npm run lint
npm run test
npm run test:e2e
npm run build
```

### Front-end

```bash
cd front-end
npm run lint
npm run test
npm run format
npm run build
```

## Documentação detalhada

- Back-end: `back-end/README.md`
- Front-end: `front-end/README.md`
- Docker Compose: `docker-compose.yml`

## Observações

- A lista de palavras precisa ser importada antes da aplicação ter dados úteis no dicionário
- Os detalhes das palavras dependem da Free Dictionary API
- O Redis melhora cache, mas a API documenta comportamento de fallback no README do back-end
- O Compose usa `JWT_SECRET=change-me-in-compose` como fallback, portanto defina um segredo real fora de desenvolvimento
- O front-end em container usa `API_BASE_URL=http://back-end:3001`
