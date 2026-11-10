// Post-build smoke check (npm run check, also part of build:pages). Exits 1 on any failure.
// SEO essentials per prerendered page, no em dash anywhere, and the platform rule on key games.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { GAMES, SITE_URL } from '../src/app/data/store.ts';

const root = new URL('../dist/g2-store/browser/', import.meta.url);
const file = (p: string) => new URL(p.replace(/^\//, ''), root);
const fails: string[] = [];
const must = (ok: unknown, msg: string) => ok || fails.push(msg);

const sitemap = readFileSync(file('sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE_URL, ''));
must(urls.length === GAMES.length + 5, `sitemap has ${urls.length} urls`);

const html = (u: string) => readFileSync(file(`${u}index.html`), 'utf8');
for (const u of urls) {
  if (!existsSync(file(`${u}index.html`))) { fails.push(`not prerendered: ${u}`); continue; }
  const h = html(u);
  must((h.match(/<h1[\s>]/g) ?? []).length === 1, `${u}: expected exactly one <h1>`);
  must(h.includes(`<link rel="canonical" href="${SITE_URL}${u}">`), `${u}: canonical mismatch`);
  must(/<meta name="description" content="[^"]{70,}/.test(h), `${u}: description missing/short`);
  must(h.includes('Projeto de portfólio de Gustavo Martins Gripaldi'), `${u}: disclaimer missing`);
  must(h.includes('https://www.igdb.com'), `${u}: IGDB attribution missing`);
  const ld = h.match(/<script id="ld-json" type="application\/ld\+json">(.*?)<\/script>/s)?.[1];
  try {
    const graph = JSON.parse(ld ?? '')['@graph'] as { '@type': string; offers?: unknown }[];
    must(graph.some((n) => n['@type'] === 'WebSite'), `${u}: WebSite JSON-LD missing`);
    if (u.startsWith('/jogo/')) {
      const game = graph.find((n) => n['@type'] === 'VideoGame');
      must(game && !('offers' in game), `${u}: VideoGame JSON-LD missing or has offers`);
    }
  } catch { fails.push(`${u}: invalid JSON-LD`); }
}

// Platform rule, read from the prerendered buy box: radio enabled <=> purchasable.
function radios(u: string) {
  const h = html(u);
  return Object.fromEntries([...h.matchAll(/<input[^>]*name="plataforma"[^>]*>/g)].map(([tag]) => [tag.match(/value="(\w+)"/)?.[1], !/\sdisabled/.test(tag)]));
}
const gta = radios('/jogo/grand-theft-auto-vi/');
must(gta['playstation'] && gta['xbox'] && !gta['pc'] && !gta['nintendo'], `GTA VI platforms wrong: ${JSON.stringify(gta)}`);
must(html('/jogo/grand-theft-auto-vi/').includes('Pré-venda'), 'GTA VI should be a pre-order');
const zelda = radios('/jogo/the-legend-of-zelda-ocarina-of-time/');
must(zelda['nintendo'] && !zelda['pc'] && !zelda['playstation'] && !zelda['xbox'], `Zelda OoT platforms wrong: ${JSON.stringify(zelda)}`);

// No em dash in anything a visitor can read.
const walk = (dir: URL): URL[] => readdirSync(dir).flatMap((n) => {
  const p = new URL(n, dir);
  return statSync(p).isDirectory() ? walk(new URL(`${n}/`, dir)) : [p];
});
for (const f of walk(root).filter((f) => /\.(html|js|json|txt|xml|webmanifest)$/.test(f.pathname) && !f.pathname.endsWith('3rdpartylicenses.txt'))) {
  must(!readFileSync(f, 'utf8').includes(String.fromCharCode(0x2014)), `em dash in ${f.pathname.split('/browser/')[1]}`);
}
for (const f of ['robots.txt', 'sitemap.xml', 'site.webmanifest', 'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'og/g2store.png', 'index.csr.html'])
  must(existsSync(file(f)), `missing /${f}`);

if (fails.length) { console.error(`check: ${fails.length} problem(s)\n- ` + [...new Set(fails)].join('\n- ')); process.exit(1); }
console.log(`check: ${urls.length} urls OK, platform rules OK, no em dash`);
