# Word Explorer Web

Aplicacao front-end em Next.js para autenticacao de usuarios, consulta de palavras em ingles, historico de pesquisas e gerenciamento de favoritos. O back-end e consumido integralmente por uma camada de servicos e proxies do Next.js, sem replicar regras de negocio do servidor.

## Objetivo

- Autenticar usuarios com cadastro e login
- Buscar palavras com debounce e navegar para detalhes
- Exibir historico recente do usuario autenticado
- Gerenciar favoritos com atualizacao otimista
- Listar o dicionario paginado e abrir detalhes em modal
- Proteger rotas e manter o token fora de `localStorage`

## Stack

- Node.js
- TypeScript
- Next.js 15 com App Router
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- Jest
- Docker

## Arquitetura

- `app` para rotas, layouts e route handlers
- `components` para UI compartilhada e componentes de dominio
- `hooks` para encapsular chamadas e regras do front-end
- `services` para centralizar acesso HTTP e integracao com a API
- `middleware.ts` para protecao de rotas autenticadas
- cookie `httpOnly` com JWT e proxies em `/api/*` para manter o token no servidor do Next.js

## Requisitos

- Node.js 20+
- npm 10+
- API do back-end em execucao
- Docker e Docker Compose opcionais

## Estrutura útil

- `src/app/(auth)`: login e cadastro
- `src/app/(protected)`: area autenticada
- `src/app/api`: proxies para a API do back-end
- `src/components/shared`: componentes reutilizaveis do dominio
- `src/hooks`: hooks de auth, busca, favoritos e detalhes
- `src/services`: cliente HTTP e camada de servicos

## Variáveis de ambiente

Crie o arquivo `.env.local` a partir de `.env.example`.

```env
API_BASE_URL=http://localhost:3001
```

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o `.env.local`

```bash
cp .env.example .env.local
```

### 3. Garantir que a API esteja rodando

Por padrao, o front-end espera o back-end em `http://localhost:3001`.

### 4. Iniciar a aplicacao

```bash
npm run dev
```

### 5. Acessar a interface

- Web: `http://localhost:3000`

## Como rodar com Docker Compose

### Subir o front-end isoladamente

```bash
docker compose up -d front-end
```

### Ver logs da aplicacao

```bash
docker compose logs -f front-end
```

### Derrubar containers

```bash
docker compose down
```

## Fluxo recomendado para ambiente completo com Docker

```bash
docker compose up -d postgres redis
docker compose --profile tools run --rm back-end-migrate
docker compose --profile tools run --rm back-end-import
docker compose up -d back-end front-end
```

## Scripts úteis

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

O back-end retorna apenas JWT em `Bearer ...`. Como ele nao expoe cookie `httpOnly`, o front-end salva esse token em um cookie `httpOnly` proprio do Next.js e todas as chamadas autenticadas passam por route handlers em `/api/*`, que adicionam o header `Authorization` no servidor.

Trade-off documentado:

- o JWT continua sendo um bearer token sem refresh token
- a validacao da sessao no `middleware` checa presenca do cookie, e expiracao real e tratada centralmente pelos proxies `/api/*`
- em caso de `401`, o cookie e removido e o usuario volta para `/login`

## Headers de resposta

Os proxies do front-end repassam os dados necessarios para a UI. Os headers tecnicos do back-end continuam sendo tratados pela API, mas nao sao usados diretamente na interface.

## Segurança aplicada

- token fora de `localStorage`
- cookie `httpOnly`, `sameSite=lax` e `secure` em producao
- protecao de rotas via `middleware.ts`
- validacao de formularios com Zod antes do envio
- validacao das respostas principais da API com Zod
- debounce na busca para reduzir chamadas excessivas

## Formato de erro

Exemplo esperado do back-end:

```json
{ "message": "Error message" }
```

## Paginação

O projeto usa paginação por `page` e `limit` nas listas de favoritos e dicionario.

Parametros padrao:

- `page=1`
- `limit=20`

## Rotas

### `GET /`

Tela inicial autenticada com busca e historico recente.

### `GET /login`

Tela de autenticacao.

### `GET /register`

Tela de cadastro com login automatico apos sucesso.

### `GET /favorites`

Lista paginada de favoritos com desfavoritar inline.

### `GET /dictionary`

Lista paginada do dicionario com modal de detalhes.

### `GET /word/[word]`

Pagina de detalhes da palavra com botao de favorito.

## Fluxo mínimo para validar manualmente

### 1. Criar usuario

Use a tela `/register`.

### 2. Autenticar

Use a tela `/login`.

### 3. Listar palavras

Digite um prefixo na home ou abra `/dictionary`.

### 4. Consultar detalhe

Abra `/word/fire` ou use o modal da lista.

### 5. Favoritar

Clique em `Favoritar` na pagina de detalhe ou na lista de favoritos.

### 6. Consultar historico

Volte para a home e confira o painel lateral.

## Testes e qualidade

```bash
npm run lint
npm run test
npm run build
```

## Observações

- O estado inicial de favorito em uma palavra isolada e resolvido por um proxy que percorre as paginas de favoritos do usuario quando necessario
- A aplicacao assume o contrato documentado no README do back-end para respostas e erros
- O README da raiz explica como subir o ambiente completo
