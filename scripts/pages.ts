// Publishes the static build to /docs (GitHub Pages source: main branch, /docs folder, base /G2Store/).
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/g2-store/browser/', import.meta.url);
const docs = new URL('../docs/', import.meta.url);
const shell = new URL('index.csr.html', dist);

// ponytail: async cp on purpose: Node 22's native cpSync exits 127 silently on non-ASCII paths ("Programação").
await rm(docs, { recursive: true, force: true });
await cp(dist, docs, { recursive: true });
await writeFile(new URL('.nojekyll', docs), '');
// The client shell carries noindex: cart, checkout, orders, wishlist and the 404 page must not be indexed.
const noindex = (await readFile(shell, 'utf8')).replace('<head>', '<head><meta name="robots" content="noindex, follow">');
// Unknown URLs boot the client app (router shows the 404 page).
await writeFile(new URL('404.html', docs), noindex);
// Browser-only routes get the client shell at their own path, so a reload answers 200 instead of 404.
for (const route of ['carrinho', 'checkout', 'meus-pedidos', 'lista-de-desejos']) {
  await mkdir(new URL(`${route}/`, docs), { recursive: true });
  await writeFile(new URL(`${route}/index.html`, docs), noindex);
}
console.log('pages: dist/g2-store/browser -> docs/ (+ .nojekyll, 404.html, client route shells)');
