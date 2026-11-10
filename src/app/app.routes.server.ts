import { RenderMode, ServerRoute } from '@angular/ssr';
import { GAMES } from './data/store';

// Catalogue pages are prerendered to static HTML (GitHub Pages, no server). Cart, checkout, orders and
// wishlist live in localStorage only, so they render in the browser (scripts/pages.ts gives them a shell).
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'jogos', renderMode: RenderMode.Prerender },
  { path: 'promocoes', renderMode: RenderMode.Prerender },
  { path: 'gift-cards', renderMode: RenderMode.Prerender },
  { path: 'consoles', renderMode: RenderMode.Prerender },
  { path: 'jogo/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: async () => GAMES.map((g) => ({ slug: g.slug })) },
  { path: '**', renderMode: RenderMode.Client },
];
