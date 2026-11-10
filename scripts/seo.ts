// Writes public/sitemap.xml and public/robots.txt from the catalogue (runs before every build).
import { writeFile } from 'node:fs/promises';
import { GAMES, SITE_URL } from '../src/app/data/store.ts';

const today = new Date().toISOString().slice(0, 10);
const pages = [
  { path: '/', priority: '1.0' },
  { path: '/jogos/', priority: '0.9' },
  { path: '/promocoes/', priority: '0.8' },
  { path: '/gift-cards/', priority: '0.7' },
  { path: '/consoles/', priority: '0.7' },
  ...GAMES.map((g) => ({ path: `/jogo/${g.slug}/`, priority: '0.8' })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE_URL}${p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>
`;

// ponytail: GitHub Pages project sites cannot own the domain-root robots.txt; this copy documents intent
// and points to the sitemap (submit it in Search Console).
const robots = `User-agent: *
Allow: /
Disallow: /G2Store/carrinho/
Disallow: /G2Store/checkout/
Disallow: /G2Store/meus-pedidos/
Disallow: /G2Store/lista-de-desejos/

Sitemap: ${SITE_URL}/sitemap.xml
`;

await writeFile(new URL('../public/sitemap.xml', import.meta.url), sitemap);
await writeFile(new URL('../public/robots.txt', import.meta.url), robots);
console.log(`seo: sitemap.xml with ${pages.length} urls, robots.txt`);
