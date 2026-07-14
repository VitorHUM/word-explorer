# Word Explorer Web

> Aplicação web em Next.js para autenticação, busca de palavras, histórico, favoritos e visualização de detalhes em inglês.

## Descrição

O front-end:

- entrega a interface web
- protege rotas autenticadas
- mantém o JWT fora do JavaScript do browser
- usa route handlers `/api/*` como proxy para a API NestJS
- centraliza cache de interface com TanStack Query

## Funcionalidades

| Funcionalidade | Status | Observação |
| --- | --- | --- |
| Login | Implementado | validação com Zod + React Hook Form |
| Cadastro | Implementado | confirmação de senha e critérios visuais |
| Sessão protegida | Implementado | middleware + validação de sessão |
| Busca | Implementado | home com sugestões aleatórias e dicionário completo |
| Paginação | Implementado | listas com `page` e `limit` |
| Detalhes | Implementado | página dedicada e modal |
| Favoritos | Implementado | atualização otimista com rollback |
| Histórico | Implementado | home e perfil |
| Testes | Implementado | Jest + Testing Library |
| Deploy público | Não configurado | nenhum link público informado |

## Arquitetura

```text
Browser -> Next.js pages/components -> /api/* route handlers -> Back-end API
```

### Decisão principal

O browser não conversa diretamente com a API autenticada. Em vez disso:

- o browser chama `/api/*` do próprio Next.js
- os route handlers falam com o Back-end
- o token fica salvo em cookie `httpOnly`

## Estrutura de Pastas

```text
front-end/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── test/
│   └── types/
├── Dockerfile
└── README.md
```

### Organização interna

| Pasta | Papel |
| --- | --- |
| `src/app` | páginas, layouts e route handlers |
| `src/app/(auth)` | login e cadastro |
| `src/app/(protected)` | páginas autenticadas |
| `src/app/api` | proxies server-side para o Back-end |
| `src/components` | UI básica e componentes compartilhados |
| `src/features` | seções específicas de páginas |
| `src/hooks` | hooks de sessão, palavras e favoritos |
| `src/services` | clientes HTTP e contratos |
| `src/lib` | validações, sessão, constantes e utilitários |

## Tecnologias

| Categoria | Tecnologias |
| --- | --- |
| Runtime | Node.js, TypeScript |
| Framework | Next.js 15 App Router, React 19 |
| UI | Tailwind CSS, Radix UI, Lucide |
| Estado | TanStack Query |
| Formulários | React Hook Form, Zod |
| Testes | Jest, Testing Library |
| Infra | Docker |

## Requisitos

| Item | Versão sugerida |
| --- | --- |
| Node.js | 20+ |
| npm | 10+ |
| Back-end | em execução |
| Docker | opcional |

## Configuração do Ambiente

```bash
cp .env.example .env.local
```

## Variáveis de Ambiente

| Variável | Exemplo | Uso |
| --- | --- | --- |
| `API_BASE_URL` | `http://localhost:3001` | URL interna usada pelo servidor Next.js para falar com a API |

### Exemplo

```env
API_BASE_URL=http://localhost:3001
```

### Diferença entre URL do navegador e URL interna

| Contexto | URL |
| --- | --- |
| Navegador -> Front-end | `http://localhost:3000` |
| Navegador -> API | normalmente não usada diretamente |
| Next.js fora do Docker -> API | `http://localhost:3001` |
| Next.js no Docker -> API | `http://back-end:3001` |

## Execução Local

<details>
<summary><strong>Passo a passo</strong></summary>

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar ambiente

```bash
cp .env.example .env.local
```

### 3. Garantir que o back-end esteja rodando

Por padrão, o front-end espera a API em `http://localhost:3001`.

### 4. Iniciar a aplicação

```bash
npm run dev
```

</details>

### URLs locais

| Recurso | URL |
| --- | --- |
| Landing page | `http://localhost:3000` |
| Login | `http://localhost:3000/login` |
| Cadastro | `http://localhost:3000/register` |
| Home protegida | `http://localhost:3000/home` |

## Execução com Docker

### Build

```bash
docker compose build front-end
```

### Subir container

```bash
docker compose up -d front-end
```

### Logs

```bash
docker compose logs -f front-end
```

### Características da imagem

| Item | Status |
| --- | --- |
| Multi-stage | sim |
| `output: "standalone"` | sim |
| Usuário não-root | sim |
| Healthcheck | sim |

### Fluxo completo com Docker

```bash
docker compose up -d postgres redis
docker compose --profile tools run --rm back-end-migrate
docker compose --profile tools run --rm back-end-import
docker compose up -d back-end front-end
```

## Migrations

O front-end não possui migrations próprias.

Dependência operacional:

- a API precisa estar com migrations aplicadas para que login, histórico, favoritos e listagem funcionem corretamente

## Importação do Dicionário

O front-end não importa palavras diretamente.

Dependência operacional:

- a tela de dicionário e a busca ficam úteis apenas depois da importação feita no back-end

## Testes

### Comandos testados

| Tipo | Comando |
| --- | --- |
| Lint | `npm run lint` |
| Testes | `npm run test -- --runInBand` |
| Build | `npm run build` |
| Build Docker | `docker compose build front-end` |

### Outros comandos úteis

| Tipo | Comando |
| --- | --- |
| Testes padrão | `npm run test` |
| Cobertura | `npm run test:coverage` |
| Formatação | `npm run format` |

### O que a suíte cobre

| Área | Cobertura |
| --- | --- |
| Auth | validação, login válido, falha de login, logout |
| Proteção | middleware |
| UI | busca, modal, paginação, detalhes, favoritos |
| Dados | histórico vazio/preenchido, lista, campos opcionais |

## Swagger

Swagger não existe no front-end.

Se precisar da documentação OpenAPI, use a API em:

- `http://localhost:3001/docs`
- `http://localhost:3001/docs/json`

## Endpoints

### Route handlers internos

| Método | Rota | Papel |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | cadastro via proxy |
| `POST` | `/api/auth/signin` | login via proxy |
| `GET` | `/api/auth/session` | perfil da sessão |
| `POST` | `/api/auth/logout` | logout |
| `GET` | `/api/entries` | listagem de palavras |
| `GET` | `/api/entries/[word]` | detalhes |
| `POST` | `/api/entries/[word]/favorite` | favoritar |
| `DELETE` | `/api/entries/[word]/favorite` | desfavoritar |
| `GET` | `/api/user/history` | histórico |
| `GET` | `/api/user/favorites` | favoritos |
| `GET` | `/api/user/favorites/status` | status de favorito |

### Páginas principais

| Rota | Tipo |
| --- | --- |
| `/` | pública |
| `/login` | pública |
| `/register` | pública |
| `/home` | protegida |
| `/dictionary` | protegida |
| `/favorites` | protegida |
| `/profile` | protegida |
| `/word/[word]` | protegida |

## Cache

### No cliente

| Dado | Estratégia |
| --- | --- |
| Sessão | TanStack Query |
| Dicionário | TanStack Query + `staleTime` |
| Favoritos | TanStack Query + atualização otimista |
| Histórico | TanStack Query |
| Detalhes | TanStack Query |

### No servidor Next.js

- o Front-end não implementa cache próprio equivalente ao Redis da API
- os route handlers apenas repassam as chamadas ao Back-end autenticado

## Headers `x-cache` e `x-response-time`

| Header | Observação no front-end |
| --- | --- |
| `x-response-time` | produzido pelo back-end, não exibido diretamente na UI |
| `x-cache` | produzido pelo back-end nas rotas cacheáveis, não exibido diretamente na UI |

## Decisões Técnicas

- cookie `httpOnly` em vez de `localStorage`
- route handlers para não expor o JWT ao browser
- middleware para experiência rápida de proteção de rotas
- validação de formulários com Zod
- TanStack Query para estado assíncrono e rollback otimista
- `output: "standalone"` para imagem Docker de produção menor

## Limitações

- o Front-end depende do contrato da API para funcionar
- os dados iniciais do dicionário dependem da importação feita no Back-end

## Links de Deploy

| Tipo | Valor |
| --- | --- |
| Front-end público | Não configurado |
