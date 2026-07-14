# Word Explorer Web

Aplicação front-end em Next.js para autenticação de usuários, consulta de palavras em inglês, histórico de pesquisas e gerenciamento de favoritos. O browser consome a própria aplicação Next.js; as chamadas autenticadas para o back-end passam por route handlers em `/api/*`, mantendo o JWT em cookie `httpOnly` e fora de `localStorage`.

## Objetivo

- Autenticar usuários com cadastro e login
- Proteger páginas autenticadas via middleware
- Buscar palavras com debounce
- Listar o dicionário com paginação e tamanho de página configurável
- Consultar detalhes de uma palavra em página dedicada ou modal
- Reproduzir áudio de pronúncia quando disponível
- Copiar palavras e definições para a área de transferência
- Registrar histórico indiretamente ao consultar detalhes no back-end
- Gerenciar favoritos com atualização otimista
- Validar formulários e respostas críticas da API

## Stack

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
- Testing Library
- Docker

## Arquitetura

- `app` para páginas, layouts e route handlers
- `app/(auth)` para login e cadastro
- `app/(protected)` para páginas autenticadas
- `app/api` para proxies server-side entre browser e back-end
- `components/ui` para componentes básicos reutilizáveis
- `components/shared` para componentes compartilhados do domínio
- `features` para seções específicas de uma feature
- `hooks` para consultas, mutações e estado derivado de UI
- `services` para acesso HTTP e contratos de integração
- `lib` para validações, constantes, sessão e utilitários
- `types` para schemas e tipos compartilhados
- `middleware.ts` para redirecionamento de rotas públicas/protegidas

## Requisitos

- Node.js 20+
- npm 10+
- API do back-end em execução
- Docker e Docker Compose opcionais

## Estrutura útil

- `src/app/page.tsx`: landing page pública
- `src/app/(auth)/login`: autenticação
- `src/app/(auth)/register`: cadastro
- `src/app/(protected)/home`: busca principal e histórico recente
- `src/app/(protected)/dictionary`: dicionário paginado
- `src/app/(protected)/favorites`: favoritos paginados
- `src/app/(protected)/word/[word]`: detalhe de palavra
- `src/app/(protected)/profile`: perfil e histórico
- `src/app/api/auth/*`: sessão, login, cadastro e logout via proxy
- `src/app/api/entries/*`: listagem, detalhe e favoritos via proxy
- `src/app/api/user/*`: histórico e favoritos do usuário via proxy
- `src/services/http.ts`: cliente HTTP usado no browser
- `src/services/backend-api.ts`: cliente HTTP usado nos route handlers
- `src/lib/auth-session.ts`: leitura, escrita e remoção do cookie de autenticação

## Variáveis de ambiente

Crie o arquivo `.env.local` a partir de `.env.example`.

```env
API_BASE_URL=http://localhost:3001
```

Descrição:

- `API_BASE_URL`: URL base da API NestJS consumida pelos route handlers do Next.js

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

Por padrão, o front-end espera o back-end em `http://localhost:3001`.

Consulte `../back-end/README.md` para migrations, importação do dicionário e execução da API.

### 4. Iniciar a aplicação

```bash
npm run dev
```

### 5. Acessar a interface

- Web: `http://localhost:3000`
- Login: `http://localhost:3000/login`
- Cadastro: `http://localhost:3000/register`
- Home autenticada: `http://localhost:3000/home`

## Como rodar com Docker Compose

### Subir o front-end isoladamente

```bash
docker compose up -d front-end
```

Esse comando pressupõe que o serviço `back-end` esteja disponível na rede do Compose, pois o container usa `API_BASE_URL=http://back-end:3001`.

### Ver logs da aplicação

```bash
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

O back-end retorna o JWT no formato `Bearer ...` nos endpoints de `signup` e `signin`. O front-end salva esse token em um cookie `httpOnly` próprio do Next.js e retorna ao browser apenas os dados públicos do usuário autenticado.

Fluxo resumido:

```text
Browser -> /api/auth/signin -> Back-end /auth/signin -> cookie httpOnly -> Browser autenticado
```

Chamadas autenticadas posteriores seguem este fluxo:

```text
Browser -> /api/* do Next.js -> Authorization: Bearer <jwt> -> Back-end
```

Detalhes importantes:

- O JWT não é salvo em `localStorage`
- O cookie usa `httpOnly`, `sameSite=lax`, `path=/` e `secure` em produção
- O `middleware.ts` protege páginas autenticadas pela presença do cookie
- A expiração real da sessão é validada pelo back-end nas chamadas autenticadas
- Em `401`, os proxies removem o cookie e o cliente redireciona para `/login`

## Route handlers internos

### `POST /api/auth/signup`

Cria usuário no back-end, salva o token em cookie `httpOnly` e retorna apenas dados públicos.

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
  "name": "User 1"
}
```

### `POST /api/auth/signin`

Autentica no back-end, salva o token em cookie `httpOnly` e retorna apenas dados públicos.

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
  "name": "User 1"
}
```

### `GET /api/auth/session`

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

### `POST /api/auth/logout`

Remove o cookie de autenticação.

Response `200`:

```json
{ "success": true }
```

### `GET /api/entries`

Lista palavras do dicionário local usando o back-end.

Query params:

- `search`: opcional
- `page`: opcional, padrão `1`
- `limit`: opcional, padrão `20`

### `GET /api/entries/[word]`

Consulta detalhes da palavra e registra histórico no back-end.

### `POST /api/entries/[word]/favorite`

Adiciona a palavra aos favoritos.

Response `204` sem body.

### `DELETE /api/entries/[word]/favorite`

Remove a palavra dos favoritos.

Response `204` sem body.

### `GET /api/user/history`

Retorna histórico paginado do usuário autenticado.

### `GET /api/user/favorites`

Retorna favoritos paginados do usuário autenticado.

### `GET /api/user/favorites/status?word=fire`

Retorna se uma palavra está nos favoritos do usuário.

Response `200`:

```json
{ "isFavorite": true }
```

## Páginas

### `GET /`

Landing page pública com chamada para login e cadastro.

### `GET /login`

Formulário de login com validação client-side.

### `GET /register`

Formulário de cadastro com validação de confirmação de senha.

### `GET /home`

Página autenticada com busca de palavras, sugestões aleatórias e histórico recente.

### `GET /dictionary`

Lista paginada do dicionário com busca por prefixo, paginação, seleção de tamanho de página e modal de detalhes.

### `GET /favorites`

Lista paginada dos favoritos com ação inline para remover favorito.

### `GET /word/[word]`

Detalhe da palavra com fonética, pronúncia, definições, sinônimos, antônimos, fonte, tradução externa, cópia e favorito.

### `GET /profile`

Perfil do usuário autenticado e histórico de palavras consultadas.

## Formato de erro

O cliente HTTP espera erros no formato:

```json
{ "message": "Error message" }
```

Quando a resposta não segue esse formato, a UI usa `statusText` ou uma mensagem genérica.

## Paginação

O projeto usa paginação por `page` e `limit` nas listas de dicionário, favoritos e histórico.

Parâmetros padrão:

- `page=1`
- `limit=20`

Opções exibidas pela UI:

- `10`
- `20`
- `50`
- `100`

Formato esperado:

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

## Gestão de estado e cache

- TanStack Query centraliza cache de sessão, dicionário, histórico, favoritos e detalhes
- `staleTime` é configurado por tipo de dado
- Busca usa debounce para reduzir requisições
- Favoritos usam atualização otimista e rollback em erro
- Logout limpa o cache do Query Client

## Segurança aplicada

- Token fora de `localStorage`
- Cookie de autenticação `httpOnly`
- Rotas protegidas por middleware
- Validação de formulários com Zod
- Validação de respostas principais com Zod
- Links externos com `rel="noopener noreferrer"`
- Sem uso de `dangerouslySetInnerHTML`
- Route handlers server-side evitam expor o JWT ao JavaScript do browser

## Acessibilidade aplicada

- Formulários com `label` associado aos campos
- Botões icon-only com `aria-label`
- Dialog com título e descrição acessíveis
- Componentes interativos usam `button`, `a`, `select` e `input` semânticos
- Estados de loading, vazio e erro são exibidos na interface

## Fluxo mínimo para validar manualmente

### 1. Criar usuário

Acesse `http://localhost:3000/register` e preencha nome, e-mail e senha.

### 2. Autenticar

Acesse `http://localhost:3000/login` e entre com o usuário criado.

### 3. Buscar palavras

Use a busca da home ou abra `http://localhost:3000/dictionary`.

### 4. Consultar detalhe

Abra uma palavra pela listagem ou acesse `http://localhost:3000/word/fire`.

### 5. Favoritar

Clique no botão de coração na página de detalhe.

### 6. Consultar favoritos

Acesse `http://localhost:3000/favorites`.

### 7. Consultar histórico

Acesse `http://localhost:3000/profile` ou confira o painel lateral da home.

### 8. Encerrar sessão

Use o menu de usuário no header e clique em `Sair`.

## Testes e qualidade

```bash
npm run lint
npm run test
npm run test:coverage
npm run format
npm run build
```

Comandos focados para a suíte de front-end:

```bash
npm test -- --runInBand
npm test -- --runInBand src/app/\(auth\)/login/page.test.tsx
npm test -- --runInBand src/app/\(protected\)/dictionary/page.test.tsx
```

Observações da suíte:

- os testes não dependem do back-end em execução
- integrações externas são mockadas para manter execução determinística
- a cobertura prioriza comportamento observável com seletores acessíveis

## Observações

- O front-end depende do contrato documentado em `../back-end/README.md`
- A lista inicial da home usa uma página aleatória do dicionário importado no back-end
- A rota de status de favorito percorre páginas de favoritos quando necessário, pois o back-end documentado expõe favoritos paginados
- O comando `npm run format` ignora artefatos gerados por `.prettierignore`
- O build usa `output: "standalone"` para execução em container
