# G2Store

Loja digital de jogos **simulada**, feita como peça de portfólio por [Gustavo Martins Gripaldi](https://g2portfolio.grovicdata.com).
Vende chaves e códigos para PC, PlayStation, Xbox e Nintendo, gift cards e consoles, com pré-venda, promoções, carrinho e "Meus pedidos".

**Ao vivo:** https://g2martins.github.io/G2Store/ · **No portfólio:** https://g2portfolio.grovicdata.com/projetos/g2store

> Nenhuma compra, pagamento ou código é real. Preços são fictícios, o Pix é uma simulação e os códigos entregues são de demonstração.

## O que tem

- **Catálogo real via IGDB**: 42 jogos com capas, screenshots, trailers, gêneros, estúdios, datas por plataforma e classificação indicativa (ClassInd quando existe, senão PEGI/ESRB convertido).
- **Regra de plataforma**: um jogo só é vendido onde foi lançado. PC = chave Steam, PS5/PS4 = PlayStation Store, Xbox Series/One = Microsoft Store, Switch/Switch 2 = Nintendo eShop. Ex.: GTA VI só em PS5 e Xbox Series X|S (pré-venda até 19/11/2026); Zelda: Ocarina of Time só no Switch 2.
- **Pré-venda por plataforma** com contagem regressiva (ex.: Forza Horizon 6 já saiu no Xbox/PC e é pré-venda no PS5).
- **Home** com carrossel acessível, prateleiras (Lançamentos, Pré-venda, Mais vendidos, Promoções, por plataforma), gift cards e consoles.
- **Catálogo `/jogos`** com filtros na URL (plataforma, gênero, faixa de preço, promoção, lançamento/pré-venda), ordenação e "Carregar mais"; `/promocoes` reaproveita a mesma página.
- **Página do jogo** com galeria (lightbox), trailer só carregado ao clicar (youtube-nocookie), seletor de plataforma e edição, ClassInd nas cores oficiais, "Como ativar" por loja e jogos relacionados.
- **Carrinho** (gaveta + página) com quantidade, cupom `G2DEMO10` (10%, não vale para gift card) e frete fixo simulado para hardware.
- **Checkout simulado**: Pix com QR decorativo e botão "Simular pagamento". Não existe campo de cartão nem coleta de dados pessoais; para console pede só um CEP de 8 dígitos e, opcionalmente, um nome.
- **Meus pedidos** e **lista de desejos** no `localStorage`: linha do tempo do pedido, códigos de demonstração com botão copiar, pré-venda liberando o código só no lançamento, entrega simulada.
- **SEO**: todas as páginas de catálogo pré-renderizadas, title/description/canonical por rota, Open Graph, JSON-LD `WebSite` e `VideoGame` (sem `Offer`, os preços são falsos), sitemap e robots gerados.
- **Acessibilidade e performance**: navegação por teclado, `<dialog>` nativo (foco preso e Esc), `aria-live` no carrinho, `prefers-reduced-motion`, conteúdo visível sem JS. Lighthouse mobile local: performance 91 a 94, acessibilidade, boas práticas e SEO 100.

## Stack

Angular 21 (standalone, zoneless, signals) com SSG (`outputMode: "static"`) e hidratação com event replay · Tailwind CSS v4 · TypeScript 5.9 · Geist e Geist Mono · scripts em Node 22 com TypeScript nativo · Playwright (Python) para a imagem social. Linguagem visual baseada no design system Valerium da Grovic Data.

## Rodar

```bash
npm install
npm start            # http://localhost:4200/G2Store/
npm run build:pages  # build + checagem + publica em docs/
```

## Atualizar os dados dos jogos (IGDB)

1. Crie uma app em https://dev.twitch.tv/console e copie `.env.example` para `.env` com `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET`.
2. `npm run games` busca os jogos listados em `src/app/data/store.ts` e grava `src/app/data/games.json`.
3. Para achar o id de um jogo novo: `npm run games -- --search "nome do jogo"`.

Preços, edições, descontos e descrições em PT-BR ficam em `src/app/data/store.ts` e não dependem do IGDB.

## Estrutura

```
src/app/data/       store.ts (curadoria: preços, textos, gift cards, consoles) · games.json (IGDB) · catalog.ts (regras)
src/app/pages/      home, catalog, game, gift-cards, consoles, cart, checkout, orders, wishlist, not-found
src/app/shared/     componentes (card, preço, ClassInd, busca, carrinho, pedido), SEO, ícones, reveal
src/app/state.ts    carrinho, lista de desejos, pedidos e relógio (signals + localStorage)
scripts/            fetch-games.ts, seo.ts, check.ts, pages.ts, og.py
docs/               saída do build (GitHub Pages), não editar à mão
```

## Deploy

GitHub Pages servindo `main:/docs` com base `/G2Store/`. `npm run build:pages` gera o build, roda `npm run check` (SEO de cada página, regra de plataforma, nenhum travessão longo) e copia para `docs/` com `.nojekyll`, `404.html` e os atalhos das rotas que só existem no navegador (carrinho, checkout, pedidos, lista de desejos).

## Avisos

Dados de jogos fornecidos por [IGDB.com](https://www.igdb.com). Marcas e logos pertencem aos respectivos donos. G2Store é um projeto de portfólio sem afiliação com Sony, Microsoft, Nintendo, Valve ou qualquer editora. Ilustrações de consoles e gift cards são próprias.
