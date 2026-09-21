# Sol e Arte — Frontend

Loja virtual de artesanato com alma. Visual clássico de inspiração árabe — couro, vinho, marrom e dourado sobre tons de pergaminho — e logo em mandala.
React + TypeScript + Vite + Tailwind CSS v4, consumindo a API Django Ninja do projeto `atelier`.

> **Fonte de verdade:** o backend. Nada aqui inventa endpoint, campo ou regra — os tipos são gerados do OpenAPI da própria API.

## Como rodar

```bash
cp .env.example .env        # ajuste VITE_API_URL se necessário
npm install
npm run dev                 # http://localhost:5173
```

### Variáveis de ambiente

| Variável       | Exemplo                     | Descrição                                          |
| -------------- | --------------------------- | -------------------------------------------------- |
| `VITE_API_URL` | `http://localhost:8000/api` | URL base da API (com `/api`, sem barra no final). |

Tudo com prefixo `VITE_` vai para o navegador. **Nunca** coloque secrets aqui.

### Configuração necessária no backend (`.env` do Django)

- `FRONTEND_URL=http://localhost:5173` — o backend monta os links de **verificação de e-mail** (`/verificacao-concluida`) e **redefinição de senha** (`/redefinir-senha`) a partir dele. O default do backend é `:3000`.
- `CORS_ALLOWED_ORIGINS` — em dev o backend já libera `localhost:5173`. Em produção, liste o domínio do frontend (o CORS usa `credentials`, então não pode ser `*`).
- **Cookie do refresh token:** o backend usa `SameSite=Lax` por padrão. Isso funciona quando front e API estão no **mesmo site** (ex.: `solearte.com.br` e `api.solearte.com.br`, ou `localhost` com portas diferentes). Se estiverem em domínios diferentes, defina `COOKIE_SAMESITE=None` e `COOKIE_SECURE=True`.

## Scripts

| Script                | O que faz                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `npm run dev`         | Servidor de desenvolvimento                                      |
| `npm run build`       | Typecheck (`tsc -b`) + build de produção em `dist/`              |
| `npm run preview`     | Serve o build localmente                                         |
| `npm run typecheck`   | Só o typecheck                                                   |
| `npm test`            | Testes (Vitest + Testing Library, API simulada)                  |
| `npm run gen:api`     | Regenera `src/api/schema.d.ts` a partir do OpenAPI da API        |

Regenerar os tipos (com a API no ar):

```bash
VITE_API_URL=http://localhost:8000/api npm run gen:api
```

## Autenticação (como o backend funciona)

- `POST /auth/login` devolve o **access token** no corpo e grava o **refresh token** em um cookie `httpOnly` (`path=/api/auth`).
- O access token fica **só em memória** (`src/api/token-store.ts`) — nunca em `localStorage`.
- Ao abrir o app: `POST /auth/refresh` (cookie) → `GET /auth/me`. Sem cookie válido, o visitante é anônimo.
- Em qualquer `401`, o client faz **um** refresh e repete a requisição. O backend **rotaciona** o refresh a cada uso, então as chamadas concorrentes compartilham a mesma promise (single-flight) e, entre abas, um Web Lock — ver `src/api/session.ts`.
- Refresh recusado (`401`) = sessão perdida: limpa cache e rotas privadas redirecionam para `/entrar?next=…`. Queda de rede **não** derruba a sessão.
- Cadastro cria a conta **inativa**; o backend devolve um access token que não dá acesso a nada até o e-mail ser confirmado. Por isso o front **não** inicia sessão após o cadastro: leva para `/verifique-seu-email`.
- Login com e-mail não verificado responde `403` → a tela mostra "reenviar confirmação".

## Estrutura

```text
src/
├── api/            # client HTTP, sessão/refresh, erros, tipos gerados, endpoints por domínio
│   ├── endpoints/  # auth, categories, cart, notifications (1 arquivo por recurso)
│   ├── schema.d.ts # GERADO do OpenAPI — não editar à mão
│   └── types.ts    # aliases legíveis sobre o schema
├── app/            # providers (React Query + Auth), router, query client
├── components/
│   ├── brand/      # logo, bandeirinhas, ilustração
│   ├── layout/     # header, menus, footer, layout raiz
│   └── ui/         # botão, campos, alertas, skeleton, estados de erro/vazio, toast
├── features/       # auth, categories, cart, notifications (queries + telas do domínio)
├── hooks/          # useDismissable, useFocusTrap
├── lib/            # env, cn, toast, safe-redirect
└── pages/          # Home, 404, erro de rota, "em breve"
```

## Convenções

- **Identidade visual:** tokens em `src/index.css` (`oxblood` = vinho, `gold`, `leather`, `parchment` = fundo do logo, `espresso`). Títulos em Cormorant Garamond, texto em DM Sans. Ornamentos discretos (rosácea de oito pontas, faixa geométrica); o logo oficial (`src/assets/logo-mandala-*.webp`) aparece no hero e nas telas de login.
- **Rotas em português** (`/entrar`, `/cadastro`, `/produtos`…). O backend já emite links para `/painel/meus-pedidos`, `/redefinir-senha` e `/verificacao-concluida`, então esses caminhos são respeitados.
- **Query string de filtros:** `?categoria=<uuid>` (já usado pelo menu de categorias).
- **Erros da API:** `src/api/errors.ts` normaliza `{detail: string}` e o `422` de validação; `toUserMessage()` nunca expõe detalhe técnico (5xx vira mensagem genérica).
- **Cache:** TanStack Query (`staleTime` 60 s; categorias 10 min; carrinho 30 s). Dados privados são descartados no login/logout.

## Observações sobre a API (limitações encontradas)

Ver o resumo de análise entregue junto com a Fase 1. Em resumo: não há favoritos, preço promocional, variações (tamanho/cor), ordenação por preço nem filtro de faixa de preço; o frete é cotado por produto mas **não é gravado no carrinho/pedido**; avaliações públicas expõem o e-mail do autor.
