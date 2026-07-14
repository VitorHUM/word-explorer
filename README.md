# Word Explorer

> Plataforma para explorar palavras em inglês com histórico e favoritos.

<img width="1600" height="1037" alt="word_explorer" src="https://github.com/user-attachments/assets/82238bc8-a699-40e9-bfab-9ca04b17ff48" />

## Visão Geral

O projeto é composto por:

| Camada | Papel | Stack principal |
| --- | --- | --- |
| `back-end/` | API REST, autenticação, banco, cache e integração com dicionário externo | NestJS, Prisma, PostgreSQL, Redis |
| `front-end/` | Aplicação web, autenticação via cookie `httpOnly`, UI e proxies `/api/*` | Next.js 15, React 19, TanStack Query |

### Fluxo principal

```text
Browser -> Front-end Next.js -> Route Handlers /api/* -> Back-end NestJS
                                                     -> PostgreSQL
                                                     -> Redis
                                                     -> Free Dictionary API
```

## Funcionalidades

| Recurso | Status | Resumo |
| --- | --- | --- |
| Cadastro e login | Implementado | JWT emitido pelo back-end e persistido em cookie `httpOnly` no front-end |
| Proteção de páginas | Implementado | Middleware no front-end e validação real da sessão no back-end |
| Busca no dicionário | Implementado | Busca paginada sobre lista importada no PostgreSQL |
| Detalhes da palavra | Implementado | Consulta ao dicionário externo com cache e registro em histórico |
| Favoritos | Implementado | Criar/remover favorito com atualização otimista no front-end |
| Histórico | Implementado | Histórico paginado por usuário |
| Swagger | Implementado | Disponível apenas no back-end |
| Deploy público | Não configurado | Nenhum link público informado no repositório |

## Arquitetura

| Área | Descrição |
| --- | --- |
| Autenticação | Back-end gera `Bearer <jwt>`; front-end salva token em cookie `httpOnly` |
| Integração interna | Browser fala com o próprio Next.js; Next.js fala com a API via `API_BASE_URL` |
| Persistência | PostgreSQL armazena usuários, lista de palavras, histórico e favoritos |
| Cache | Redis armazena respostas cacheáveis da API |
| Observabilidade | API responde com `x-response-time` em todas as rotas e `x-cache` nas rotas cacheáveis |

## Estrutura de Pastas

```text
.
├── back-end/
│   ├── prisma/
│   ├── src/
│   ├── Dockerfile
│   └── README.md
├── front-end/
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml
└── README.md
```

## Tecnologias

| Área | Tecnologias |
| --- | --- |
| Back-end | Node.js, TypeScript, NestJS, Prisma, PostgreSQL, Redis, Swagger, Jest |
| Front-end | Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI, TanStack Query, React Hook Form, Zod, Jest |
| Infra | Docker, Docker Compose |

## Requisitos

| Item | Versão sugerida |
| --- | --- |
| Node.js | 20+ |
| npm | 10+ |
| Docker | atual |
| Docker Compose | atual |

## Configuração do Ambiente

### Variáveis do back-end

Copie `back-end/.env.example` para `back-end/.env`.

### Variáveis do front-end

Copie `front-end/.env.example` para `front-end/.env.local`.

### URLs importantes

| Contexto | URL |
| --- | --- |
| Navegador -> Front-end | `http://localhost:3000` |
| Navegador -> Back-end | `http://localhost:3001` |
| Next.js fora do Docker -> Back-end | `http://localhost:3001` |
| Next.js no Docker -> Back-end | `http://back-end:3001` |

## Execução Local

<details>
<summary><strong>Passo a passo</strong></summary>

### 1. Subir infraestrutura

```bash
docker compose up -d postgres redis
```

### 2. Configurar e iniciar o back-end

```bash
cd back-end
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run dictionary:import
npm run start:dev
```

### 3. Configurar e iniciar o front-end

Em outro terminal:

```bash
cd front-end
cp .env.example .env.local
npm install
npm run dev
```

</details>

## Execução com Docker

<details>
<summary><strong>Fluxo completo com Docker Compose</strong></summary>

```bash
docker compose up -d postgres redis
docker compose --profile tools run --rm back-end-migrate
docker compose --profile tools run --rm back-end-import
docker compose up -d back-end front-end
```

</details>

### Serviços internos do Compose

| Serviço | Nome interno |
| --- | --- |
| PostgreSQL | `postgres` |
| Redis | `redis` |
| Back-end | `back-end` |
| Front-end | `front-end` |

## Migrations

| Contexto | Comando |
| --- | --- |
| Local | `cd back-end && npm run prisma:migrate:deploy` |
| Docker | `docker compose --profile tools run --rm back-end-migrate` |

## Importação do Dicionário

| Contexto | Comando |
| --- | --- |
| Local | `cd back-end && npm run dictionary:import` |
| Docker | `docker compose --profile tools run --rm back-end-import` |

Resumo:

- baixa `words_dictionary.json` do repositório `dwyl/english-words`
- normaliza as palavras
- insere em lotes no PostgreSQL
- invalida o cache de listagem quando necessário

## Testes

### Comandos testados neste repositório

| Projeto | Comando |
| --- | --- |
| Back-end | `cd back-end && npm ci` |
| Back-end | `cd back-end && npm run build` |
| Front-end | `cd front-end && npm run lint` |
| Front-end | `cd front-end && npm run test -- --runInBand` |
| Front-end | `cd front-end && npm run build` |
| Docker | `docker compose build back-end` |
| Docker | `docker compose build front-end` |

### Outros comandos úteis

| Projeto | Comando |
| --- | --- |
| Back-end | `cd back-end && npm run test` |
| Back-end | `cd back-end && npm run test:e2e` |
| Front-end | `cd front-end && npm run test:coverage` |

## Swagger

Swagger existe apenas no back-end.

| Recurso | URL |
| --- | --- |
| Swagger UI | `http://localhost:3001/docs` |
| OpenAPI JSON | `http://localhost:3001/docs/json` |

## Endpoints

### Back-end

| Grupo | Exemplos |
| --- | --- |
| Aplicação | `GET /`, `GET /health` |
| Auth | `POST /auth/signup`, `POST /auth/signin` |
| Entradas | `GET /entries/en`, `GET /entries/en/:word` |
| Favoritos | `POST /entries/en/:word/favorite`, `DELETE /entries/en/:word/unfavorite` |
| Usuário | `GET /user/me`, `GET /user/me/history`, `GET /user/me/favorites` |

### Front-end

| Grupo | Exemplos |
| --- | --- |
| Páginas públicas | `/`, `/login`, `/register` |
| Páginas protegidas | `/home`, `/dictionary`, `/favorites`, `/profile`, `/word/[word]` |
| Proxies internos | `/api/auth/*`, `/api/entries/*`, `/api/user/*` |

## Cache

| Camada | Comportamento |
| --- | --- |
| Back-end | Redis para respostas cacheáveis de listagem e detalhes |
| Front-end | TanStack Query para cache de sessão, listas, detalhes e favoritos |

## Headers `x-cache` e `x-response-time`

| Header | Onde aparece | Significado |
| --- | --- | --- |
| `x-response-time` | todas as respostas da API | tempo de processamento em milissegundos |
| `x-cache: HIT` | rotas cacheáveis da API | resposta servida do Redis |
| `x-cache: MISS` | rotas cacheáveis da API | resposta buscada na origem |

## Decisões Técnicas

- JWT fica fora de `localStorage`
- o browser não chama o Back-end autenticado diretamente
- o Front-end usa route handlers para proteger o token
- o Back-end mantém PostgreSQL para persistência e Redis para cache
- `output: "standalone"` é usado no Front-end para um container de produção menor
- o dicionário local evita depender da API externa para listagem

## Limitações

- detalhes da palavra ainda dependem da Free Dictionary API
- a listagem só fica útil depois da importação do dicionário

## Links de Referência

| Tipo | Valor |
| --- | --- |
| Deploy do Front-end | Não configurado |
| Deploy do Back-end | Não configurado |
| Documentação detalhada da API | `back-end/README.md` |
| Documentação detalhada da Web | `front-end/README.md` |
