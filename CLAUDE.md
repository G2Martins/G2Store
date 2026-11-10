# CLAUDE.md, G2Store

> **Spec viva.** Porta de entrada lida pelo agente em toda sessão. Não duplica o [README.md](README.md), **aponta** pra ele. Atualize quando uma regra, comando, módulo ou hurdle mudar.
>
> **Última revisão:** 2026-11-10
> **Detalhes de features, rodar, dados e deploy:** [README.md](README.md)

---

## 1. O que é

MVP de **loja digital de jogos simulada** (chaves/códigos para PC, PlayStation, Xbox e Nintendo, gift cards, consoles, pré-venda, promoções, carrinho, "Meus pedidos"). Peça de portfólio de **Gustavo Martins Gripaldi**, linkada em https://g2portfolio.grovicdata.com/projetos/g2store. Ao vivo: https://g2martins.github.io/G2Store/. **Nenhuma compra é real**: preços fictícios, Pix simulado, códigos de demonstração. Referência funcional: Nuuvem (só features, nunca layout, logo, cores ou textos).

## 2. Stack + Comandos

Angular 21.2 standalone + zoneless + signals, SSG (`outputMode: "static"`), `provideClientHydration(withEventReplay())`, Tailwind v4 (`@tailwindcss/postcss`), TS ~5.9, Node 22 (scripts `.ts` nativos). GitHub Pages em `main:/docs`, `baseHref` `/G2Store/`.

```bash
npm start            # seo + ng serve (http://localhost:4200/G2Store/)
npm run games        # IGDB -> src/app/data/games.json (lê .env); "-- --search nome" acha ids
npm run build        # seo (sitemap/robots) + ng build com prerender
npm run check        # smoke pós-build: SEO por página, regra de plataforma, zero travessão longo
npm run build:pages  # build + check + copia para docs/ (.nojekyll, 404.html, shells das rotas client)
npm run og           # python scripts/og.py: OG 1200x630 + ícones PNG via Playwright
```

## 3. Mapa de módulos

| Caminho | Responsabilidade |
|---|---|
| `src/app/data/store.ts` | Curadoria: lista de jogos (id IGDB, slug, preço, edições, desconto, tags, ranking, descrição PT-BR), famílias de plataforma e lojas, passos de ativação, gift cards, consoles, constantes do site. Sem imports (scripts leem direto). |
| `src/app/data/games.json` | Snapshot IGDB (capa, screenshots, artworks, gêneros, estúdios, datas por plataforma, ClassInd, vídeos). Gerado por `npm run games`. |
| `src/app/data/catalog.ts` | Junta os dois e concentra as regras: estado da oferta por família (`available`/`preorder`/`soon`/`none`), preço por família e edição, labels, busca, URLs de imagem IGDB. |
| `src/app/state.ts` | `Clock` (hora do prerender via TransferState, depois hora real) e `Store` (carrinho, cupom, wishlist, pedidos, códigos demo, `localStorage`). |
| `src/app/pages/` | `home`, `catalog` (também `/promocoes`), `game`, `gift-cards`, `consoles` (prerender) · `cart`, `checkout`, `orders`, `wishlist`, `not-found` (client). |
| `src/app/shared/` | `ui.ts` (card, preço, ClassInd, prateleira, arte de gift card e hardware), `cart.ts`, `order.ts`, `search.ts`, `countdown.ts`, `icon.ts`, `seo.ts`, `reveal.ts`. |
| `src/app/app.*` | Shell: barra de aviso, header, busca, gaveta do carrinho e menu mobile (`<dialog>`), footer, toast/aria-live. Rotas e modos de render. |
| `scripts/` | `fetch-games.ts`, `seo.ts`, `check.ts`, `pages.ts`, `og.py` + `og.html`. |
| `docs/` | Saída do build publicada. Nunca editar à mão. |

## 4. Regras SEMPRE-ATIVAS

- **Dados só em `games.json` + `store.ts`** (regras em `catalog.ts`). Nada de preço ou texto de produto espalhado em componente.
- **Regra de plataforma:** um jogo só é vendido nas plataformas em que sai (datas do IGDB, não memória). PC = Steam, PS5/PS4 = PlayStation Store, Xbox Series/One = Microsoft Store, Switch/Switch 2 = Nintendo eShop. Pré-venda só com dia exato anunciado; data só com ano vira "Em breve" (não vende). `npm run check` trava GTA VI (só PS/Xbox) e Zelda OoT (só Nintendo).
- **SSG:** toda rota de catálogo é pré-renderizada. APIs do browser só em `afterNextRender`, eventos ou `isPlatformBrowser`. Estado do navegador (carrinho, query params, hora real) entra **depois** da hidratação para o HTML bater.
- **Animação só `transform`/`opacity`**, com `prefers-reduced-motion`. Conteúdo visível sem JS (gate `.js` no `styles.css`). Nada animado de `opacity: 0` no elemento de LCP.
- **Design Valerium:** Geist + Geist Mono, eyebrow mono, card "well", ticks, dot grid, out-expo. Cores só pelos tokens de `:root` em `styles.css` (azul profundo + um acento lime); exceção documentada: cores oficiais da ClassInd e o fundo dos gift cards.
- **Zero travessão longo (U+2014, em dash)** em qualquer texto visível; usar ":", ",", "." ou "·". O `check` varre html/js/json do build.
- **Checkout sempre simulado:** nunca campo de cartão, CVV, validade, CPF, e-mail ou endereço completo. Hardware pede só CEP de 8 dígitos + nome opcional.
- **Créditos:** "Dados de jogos fornecidos por IGDB.com" e a nota de marcas no footer de toda página; marcas de plataforma só como ícone/rótulo de compatibilidade.
- **`npm run build:pages` verde** antes de publicar.
- **`docs/` é build.** Não editar à mão.

## 5. Segurança

- Credenciais Twitch só no `.env` (gitignored, `.env.example` vazio versionado), lidas por `process.loadEnvFile` **dentro** de `scripts/fetch-games.ts`. Nunca logar client id, secret ou token; em erro de auth reportar só o status HTTP. Shell não lê `.env` (hook bloqueia).
- `localStorage` guarda só estado de demonstração (carrinho, wishlist, pedidos fake). Nada sensível.
- Texto do usuário só via interpolação do Angular (escapado); nada de `innerHTML` com texto externo. JSON-LD escapa `<`.
- Trailer: fachada com imagem do IGDB, iframe `youtube-nocookie.com` só após clique; id do vídeo validado por regex antes do `bypassSecurityTrustResourceUrl`.

## 6. Common Hurdles

- **Node 22 `cpSync` sai com 127 em silêncio** no caminho com "Programação": usar `cp` de `fs/promises` (ver `scripts/pages.ts`).
- **EBUSY** ao recriar `docs/` se um shell ou servidor estiver com cwd dentro dela.
- **Base `/G2Store/`:** links relativos à base; rotas client ganham `docs/<rota>/index.html` (cópia de `index.csr.html`) e o resto cai no `404.html`, que sobe o app.
- **Kaspersky injeta script** nas páginas locais e derruba o Lighthouse: rodar o Lighthouse via Chromium do Playwright (`--remote-debugging-port` + `lighthouse --port`) ou bloquear com `--blocked-url-patterns='*kaspersky-labs.com*'`. Servidor local precisa de gzip para números realistas.
- **IGDB mudou campos:** `category` virou `game_type`, `age_ratings` usa `organization` + `rating_category`, datas usam `date_format.format` (`YYYYMMDD`, `YYYY`...). Ano sozinho vem como 31/12.
- **Input de componente com nome de atributo HTML** (`id`, `title`) vira atributo no host: id duplicado e tooltip. Por isso a prateleira usa `heading`/`anchor`.
- **Ícone de marca inline em todo card** inchava o HTML (~170 KB): marcas viraram máscara CSS (`.bi-*` em `styles.css`).
- **Imagem dentro de `<dialog>` fechado ainda baixa:** o lightbox só renderiza a imagem 1080p quando aberto.
- **Performance da home (2026-11-10):** `index.preloadInitial: false` no `angular.json` (sem modulepreload do framework antes do primeiro paint, FCP caiu ~0,8 s no Lighthouse); prateleiras abaixo da dobra em `@defer (on viewport(ref))` com placeholder do mesmo tamanho (o trigger precisa de ref explícita quando o placeholder tem vários elementos); só a arte do slide ativo baixa, a próxima vem no idle; no celular o hero vira arte 16:9 em cima + texto embaixo (`sizes` de 320px pega `t_screenshot_med`).
- **Não usar `@defer (hydrate on ...)`** com o `Clock`: um bloco hidratado depois do `sync()` pode ver outro estado (ex.: GTA VI saiu da pré-venda) e quebrar com NG0500. Por isso o relógio é por dia (`setHours(0,0,0,0)`): no mesmo dia do build a sincronização nem re-renderiza.
- **Links internos sempre com barra no fim** (`/filmes/x/`): o GitHub Pages responde `/x` com 301. O `TrailingSlashSerializer` (`src/app/shared/trailing-slash.ts`, registrado em `app.config.ts`) cuida disso no router.
