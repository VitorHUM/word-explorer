# Word Explorer API

> API REST em NestJS para autenticação, consulta de palavras, histórico, favoritos, paginação, cache e documentação Swagger.

## Descrição

O back-end centraliza:

- autenticação JWT
- persistência em PostgreSQL
- cache em Redis
- importação da base local de palavras
- consulta de detalhes via Free Dictionary API
- documentação OpenAPI via Swagger

## Funcionalidades

| Funcionalidade | Status | Observação |
| --- | --- | --- |
| Cadastro de usuário | Implementado | Retorna JWT no formato `Bearer ...` |
| Login | Implementado | Valida credenciais e retorna JWT |
| Perfil autenticado | Implementado | `GET /user/me` |
| Listagem do dicionário | Implementado | Busca por prefixo com paginação |
| Detalhes da palavra | Implementado | Usa cache e integração externa |
| Histórico | Implementado | Registrado ao consultar detalhes |
| Favoritos | Implementado | Favoritar e desfavoritar |
| Healthcheck | Implementado | `GET /health` |
| Swagger | Implementado | `GET /docs` |
| Deploy público | Não configurado | Nenhum link público informado |

## Arquitetura

```text
Controller -> Service -> Repository -> PostgreSQL
                    \-> CacheService -> Redis
                    \-> FreeDictionaryClient -> Free Dictionary API
```

### Componentes principais

| Componente | Papel |
| --- | --- |
| `AuthController` | cadastro e login |
| `EntriesController` | listagem, detalhes e favoritos |
| `UserController` | perfil, histórico e favoritos do usuário |
| `CacheService` | abstração de Redis com fallback seguro |
| `ResponseTimeInterceptor` | adiciona `x-response-time` |
| `CacheableResponseInterceptor` | adiciona `x-cache` nas rotas cacheáveis |
| `HttpExceptionFilter` | padroniza erros em `{ "message": "..." }` |

## Estrutura de Pastas

```text
back-end/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── app/
│   ├── auth/
│   ├── common/
│   ├── dictionary/
│   ├── entries/
│   ├── infrastructure/
│   └── user/
├── test/
├── Dockerfile
└── README.md
```

## Tecnologias

| Categoria | Tecnologias |
| --- | --- |
| Runtime | Node.js, TypeScript |
| Framework | NestJS |
| Banco | PostgreSQL |
| ORM | Prisma |
| Cache | Redis |
| Documentação | Swagger / OpenAPI |
| Testes | Jest, Supertest |
| Infra | Docker, Docker Compose |

## Requisitos

| Item | Versão sugerida |
| --- | --- |
| Node.js | 20+ |
| npm | 10+ |
| PostgreSQL | 14+ |
| Redis | 7+ |
| Docker | opcional |

## Configuração do Ambiente

### Arquivo `.env`

```bash
cp .env.example .env
```

## Variáveis de Ambiente

| Variável | Exemplo | Uso |
| --- | --- | --- |
| `NODE_ENV` | `development` | ambiente da aplicação |
| `PORT` | `3001` | porta HTTP |
| `DATABASE_URL` | `postgresql://...` | conexão com PostgreSQL |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | origens permitidas |
| `REDIS_HOST` | `127.0.0.1` | host do Redis |
| `REDIS_PORT` | `6379` | porta do Redis |
| `REDIS_TTL_SECONDS` | `3600` | TTL padrão do cache |
| `THROTTLE_TTL_MS` | `60000` | janela do rate limit global |
| `THROTTLE_LIMIT` | `300` | limite global |
| `AUTH_THROTTLE_TTL_MS` | `60000` | janela do rate limit de auth |
| `AUTH_THROTTLE_LIMIT` | `30` | limite de auth |
| `JWT_SECRET` | `change-me` | segredo do token |
| `JWT_EXPIRES_IN` | `60m` | duração do token |
| `DICTIONARY_API_URL` | `https://api.dictionaryapi.dev/api/v2` | API externa de detalhes |
| `DICTIONARY_CACHE_TTL_SECONDS` | `3600` | TTL do cache de detalhes |

### Exemplo completo

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

## Execução Local

<details>
<summary><strong>Passo a passo</strong></summary>

### 1. Subir PostgreSQL e Redis

```bash
docker compose up -d postgres redis
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Gerar o client do Prisma

```bash
npm run prisma:generate
```

### 4. Aplicar migrations

```bash
npm run prisma:migrate:deploy
```

### 5. Importar a base de palavras

```bash
npm run dictionary:import
```

### 6. Iniciar a API

```bash
npm run start:dev
```

</details>

### URLs locais

| Recurso | URL |
| --- | --- |
| API | `http://localhost:3001` |
| Healthcheck | `http://localhost:3001/health` |
| Swagger UI | `http://localhost:3001/docs` |
| OpenAPI JSON | `http://localhost:3001/docs/json` |

## Execução com Docker

### Build

```bash
docker compose build back-end
```

### Subir apenas a API

```bash
docker compose up -d postgres redis back-end
```

### Logs

```bash
docker compose logs -f back-end
```

### Ambiente completo recomendado

```bash
docker compose up -d postgres redis
docker compose --profile tools run --rm back-end-migrate
docker compose --profile tools run --rm back-end-import
docker compose up -d back-end
```

## Migrations

| Cenário | Comando |
| --- | --- |
| Local | `npm run prisma:migrate:deploy` |
| Criar nova migration | `npm run prisma:migrate:dev` |
| Docker | `docker compose --profile tools run --rm back-end-migrate` |

## Importação do Dicionário

| Cenário | Comando |
| --- | --- |
| Local | `npm run dictionary:import` |
| Docker | `docker compose --profile tools run --rm back-end-import` |

### O importador faz

- baixa `words_dictionary.json` do projeto `dwyl/english-words`
- aceita `application/json` e `text/plain`
- normaliza palavras para minúsculas
- ignora entradas vazias e palavras com espaço
- insere em lotes de `5000`
- invalida cache de listagem `dictionary:list:en:*` quando necessário

## Testes

### Comandos testados

| Tipo | Comando |
| --- | --- |
| Instalação limpa | `npm ci` |
| Build | `npm run build` |
| Build Docker | `docker compose build back-end` |

### Outros comandos úteis

| Tipo | Comando |
| --- | --- |
| Lint | `npm run lint` |
| Unitários | `npm run test` |
| E2E | `npm run test:e2e` |

Observação:

- os testes E2E exigem ambiente compatível com banco e demais dependências

## Swagger

| Recurso | URL |
| --- | --- |
| Swagger UI | `http://localhost:3001/docs` |
| OpenAPI JSON | `http://localhost:3001/docs/json` |

O Swagger documenta:

- autenticação bearer
- exemplos de erro
- headers `x-response-time`
- headers `x-cache` nas rotas cacheáveis

## Endpoints

### Aplicação

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/` | mensagem raiz da API |
| `GET` | `/health` | healthcheck |

### Autenticação

| Método | Rota | Auth |
| --- | --- | --- |
| `POST` | `/auth/signup` | não |
| `POST` | `/auth/signin` | não |

### Entradas

| Método | Rota | Auth |
| --- | --- | --- |
| `GET` | `/entries/en` | sim |
| `GET` | `/entries/en/:word` | sim |
| `POST` | `/entries/en/:word/favorite` | sim |
| `DELETE` | `/entries/en/:word/unfavorite` | sim |

### Usuário

| Método | Rota | Auth |
| --- | --- | --- |
| `GET` | `/user/me` | sim |
| `GET` | `/user/me/history` | sim |
| `GET` | `/user/me/favorites` | sim |

## Cache

### Onde há cache

| Rota | Cache |
| --- | --- |
| `GET /entries/en` | Redis |
| `GET /entries/en/:word` | Redis |

### Comportamento

- se o Redis responder normalmente, a API usa `HIT` ou `MISS`
- se o Redis estiver indisponível, a API continua funcionando
- nesse fallback, as rotas cacheáveis seguem respondendo, mas sem reutilização efetiva de cache

## Headers `x-cache` e `x-response-time`

| Header | Onde | Significado |
| --- | --- | --- |
| `x-response-time` | todas as respostas | tempo de processamento em ms |
| `x-cache: HIT` | rotas cacheáveis | resposta vinda do Redis |
| `x-cache: MISS` | rotas cacheáveis | resposta vinda do PostgreSQL ou serviço externo |

## Decisões Técnicas

- `Controller -> Service -> Repository` para separar responsabilidades
- Prisma para acesso a dados e migrations
- Redis opcional em runtime, sem derrubar a API em caso de falha
- importação local do dicionário para tornar a listagem independente da API externa
- detalhes ainda usam fonte externa porque a base importada não traz significados
- `ValidationPipe` global com mensagens padronizadas
- `helmet` e CORS restritivo para endurecimento básico

## Limitações

- detalhes de palavras dependem da Free Dictionary API
- sem importação prévia, a listagem local não terá conteúdo útil
- não há deploy público documentado
- não há endpoint dedicado para status individual de favorito no Back-end; essa verificação é derivada no Front-end

## Links de Deploy

| Tipo | Valor |
| --- | --- |
| API pública | Não configurada |
| Swagger público | Não configurado |
