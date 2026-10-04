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
│   ├── endpoints/  # auth, categories, products, campaigns, contact, cart, reviews, shipping,
│   │                 orders, payments, addresses, profile, notifications
│   ├── schema.d.ts # GERADO do OpenAPI — não editar à mão
│   └── types.ts    # aliases legíveis sobre o schema
├── app/            # providers (React Query + Auth), router, query client, testes de integração
├── components/
│   ├── brand/      # logo (mandala real + versão vetorial pequena), faixa ornamental
│   ├── layout/     # header, menus, footer, layout raiz
│   └── ui/         # botão, campos, select, textarea, paginação, avaliação em estrelas, seletor de
│                    # quantidade, trilha de navegação, diálogo de confirmação, badge de status,
│                    # alertas, skeleton, estados, toast
├── features/
│   ├── auth/       # sessão, guards, formulários (login, cadastro, senha)
│   ├── categories/ # menu de categorias, tile, queries
│   ├── catalog/    # grid/card de produto, galeria, filtros, "mais desta categoria", parâmetros de URL
│   ├── product/    # painel de compra da página do produto (preço, quantidade, adicionar ao carrinho)
│   ├── cart/       # página do carrinho: linha do item (quantidade com debounce), resumo, mutações
│   ├── checkout/   # etapas do checkout (dados, endereço, frete) e a combinação de fretes por item
│   ├── orders/     # mapa de status, listagem/detalhe de pedidos, cancelamento
│   ├── payments/   # forma de pagamento, formulário de cartão, exibição de Pix/boleto
│   ├── reviews/     # resumo e lista de avaliações do produto
│   ├── shipping/    # cálculo de frete (Frenet) na página do produto
│   ├── campaigns/  # carrossel de banners (campanhas ativas)
│   ├── contact/    # validação do formulário de contato
│   ├── home/       # seções da home (hero estático, destaques, categorias, novidades)
│   └── notifications/ # contagem do sino (header)
├── hooks/          # useDismissable, useFocusTrap, useDebouncedValue, usePrefersReducedMotion
├── lib/            # env, cn, toast, safe-redirect, safe-url, format (BRL/data), slug, mask
│                    # (e-mail/CEP/telefone), cpf, card (cartão), br-states, clipboard
└── pages/          # Home, Produtos, Categorias, Produto, Carrinho, Checkout, Pedidos (lista,
                      # detalhe, pagamento), Contato, 404, erro de rota, "em breve"
```

## Checkout e pagamentos (como o backend funciona)

- O checkout exige perfil completo (nome, sobrenome e CPF) — regra do backend (`ClientCompleteProfileAuth`). A etapa "Seus dados" abre sozinha quando falta algo.
- Endereço de entrega é obrigatório antes de cotar o frete; a API só cota frete **por produto**, então o checkout cota cada item do carrinho para o CEP escolhido e cruza as transportadoras/serviços (`service_code`) comuns a todos os itens, somando o preço e usando o maior prazo. É uma estimativa do frontend — a API não cota o carrinho inteiro de uma vez.
- `POST /orders/` cria o pedido, baixa o estoque e esvazia o carrinho — depois disso não tem volta por aqui (o backend não reabre um pedido).
- Pagamento é um passo à parte (`POST /orders/{id}/payments`), criado só quando a pessoa escolhe a forma: Pix mostra QR Code (a imagem vem em base64 da própria API) e código copia-e-cola; boleto mostra o link e o vencimento; cartão nunca fica em memória além do formulário — os campos são limpos logo após o envio, com sucesso ou não.
- A página de pagamento faz polling (5 s) enquanto o pedido está `PENDING` e existe cobrança em aberto — é assim que o site percebe um Pix/boleto pago fora da tela (confirmação chega por webhook da Asaas, não por ação da pessoa aqui).
- Cancelar só é permitido com o pedido `PENDING`. **O backend não cancela a cobrança já gerada na Asaas** ao cancelar o pedido — um Pix/boleto em aberto pode continuar pagável mesmo depois do cancelamento.

## Convenções

- **Identidade visual:** tokens em `src/index.css` (`oxblood` = vinho, `gold`, `leather`, `parchment` = fundo do logo, `espresso`). Títulos em Cormorant Garamond, texto em DM Sans. Ornamentos discretos (rosácea de oito pontas, faixa geométrica); o logo oficial (`src/assets/logo-mandala-*.webp`) aparece no hero e nas telas de login.
- **Rotas em português** (`/entrar`, `/cadastro`, `/produtos`…). O backend já emite links para `/painel/meus-pedidos`, `/redefinir-senha` e `/verificacao-concluida`, então esses caminhos são respeitados.
- **Query string de filtros:** `?categoria=<uuid>` (já usado pelo menu de categorias).
- **Erros da API:** `src/api/errors.ts` normaliza `{detail: string}` e o `422` de validação; `toUserMessage()` nunca expõe detalhe técnico (5xx vira mensagem genérica).
- **Cache:** TanStack Query (`staleTime` 60 s; categorias 10 min; carrinho 30 s; pedido/pagamento fazem polling de 5 s enquanto há cobrança em aberto). Dados privados são descartados no login/logout.
- **Recuperação de erro por página:** o `errorElement` do router fica um nível abaixo do layout raiz — um erro de render numa página troca só o conteúdo do `<Outlet>`; header e footer continuam funcionando, então a pessoa nunca fica presa numa tela sem navegação nenhuma.

## Observações sobre a API (limitações encontradas)

Ver o resumo de análise entregue junto com a Fase 1. Em resumo: não há favoritos, preço promocional, variações (tamanho/cor), ordenação por preço nem filtro de faixa de preço; produto e categoria não têm slug (a URL usa UUID, o slug no path é só cosmético); avaliações públicas expõem o e-mail do autor — o frontend mascara (`an***@dominio.com`) antes de exibir, mas o dado sensível continua saindo da API; não há endpoint de "produtos relacionados" — a seção "Mais nesta categoria" reaproveita o filtro por categoria do catálogo; o carrinho (`cart.total_shipping`) ainda vem sempre zerado — nenhuma rota grava o frete calculado num item do carrinho, então o resumo mostra uma nota avisando que o frete é calculado no checkout; a API só cota frete por produto (não por carrinho inteiro), então o checkout cota cada item separadamente para o CEP escolhido e oferece as transportadoras/serviços que atendem TODOS os itens, somando o preço e usando o maior prazo — uma estimativa do frontend, não um valor devolvido pela API; cancelar um pedido não cancela a cobrança já gerada na Asaas (o backend não chama a rotina de cancelamento da cobrança), então um Pix/boleto em aberto pode continuar pagável mesmo com o pedido cancelado.