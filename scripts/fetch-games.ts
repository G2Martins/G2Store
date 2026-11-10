// Refreshes src/app/data/games.json from IGDB (Twitch client credentials in .env, never printed).
//   npm run games                    -> fetch every game listed in src/app/data/store.ts
//   npm run games -- --search "halo|zelda" -> print search hits (id, slug, platforms) to pick new ids
import { writeFile } from 'node:fs/promises';
import { GAMES } from '../src/app/data/store.ts';

process.loadEnvFile(new URL('../.env', import.meta.url));
const { TWITCH_CLIENT_ID: id, TWITCH_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) throw new Error('TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET missing in .env');

const auth = await fetch('https://id.twitch.tv/oauth2/token', {
  method: 'POST',
  body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'client_credentials' }),
});
if (!auth.ok) throw new Error(`Twitch auth failed: HTTP ${auth.status}`);
const token = ((await auth.json()) as { access_token: string }).access_token;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// ponytail: serial calls + 260ms gap keeps us under IGDB's 4 req/s; parallelism is not worth it for ~10 calls.
async function igdb<T>(endpoint: string, body: string): Promise<T[]> {
  await sleep(260);
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: { 'Client-ID': id!, Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body,
  });
  if (!res.ok) throw new Error(`IGDB ${endpoint}: HTTP ${res.status} ${await res.text()}`);
  return res.json() as Promise<T[]>;
}

const PLATFORM: [RegExp, string][] = [
  [/^PC \(Microsoft Windows\)$/, 'pc'],
  [/^PlayStation 5$/, 'ps5'],
  [/^PlayStation 4$/, 'ps4'],
  [/^Xbox Series X\|S$/, 'xsx'],
  [/^Xbox One$/, 'xone'],
  [/^Nintendo Switch 2$/, 'switch2'],
  [/^Nintendo Switch$/, 'switch'],
];
const platformKey = (name = '') => PLATFORM.find(([re]) => re.test(name))?.[1];
const day = (unix?: number) => (unix ? new Date(unix * 1000).toISOString().slice(0, 10) : null);
// IGDB stores "2027" as 2027-12-31 + date_format YYYY: keep only the precision it really has.
function releaseDay(r: any): string | null {
  const d = day(r.date), f = r.date_format?.format ?? 'YYYYMMDD';
  if (!d || f === 'TBD') return null;
  return f === 'YYYYMMDD' ? d : f === 'YYYYMM' ? d.slice(0, 7) : d.slice(0, 4);
}
// Betas, advanced access and cancelled ports do not make a platform purchasable.
const SELLABLE = new Set([undefined, 'Full Release', 'Early Access', 'Next-Gen Optimization Patch Release']);

const search = process.argv.indexOf('--search');
if (search > -1) {
  for (const term of process.argv[search + 1].split('|')) {
    console.log(`# ${term}`);
    const hits = await igdb<any>('games', `search "${term.replace(/"/g, '')}"; fields name,slug,game_type.type,first_release_date,release_dates.platform.name,release_dates.date,release_dates.status.name,summary; where game_type = (0,8,9,10,11); limit 6;`);
    for (const g of hits) {
      const plats = [...new Set((g.release_dates ?? []).map((r: any) => `${platformKey(r.platform?.name) ?? r.platform?.name}@${day(r.date) ?? 'tbd'}${r.status ? '(' + r.status.name + ')' : ''}`))];
      console.log(`${g.id}\t${g.slug}\t${g.name}\t[${g.game_type?.type}]\t${day(g.first_release_date)}\t${plats.join(' ')}`);
      if (process.argv.includes('--summary')) console.log(`\t${g.summary ?? ''}`);
    }
  }
  process.exit(0);
}

// ClassInd first (Brazil), else map PEGI / ESRB to the closest ClassInd band.
const PEGI: Record<string, string> = { '3': 'L', '7': '10', '12': '12', '16': '16', '18': '18' };
const ESRB: Record<string, string> = { EC: 'L', E: 'L', E10: '10', T: '14', M: '18', AO: '18' };
function classInd(ratings: any[] = []): string | null {
  const by = (org: string) => ratings.find((r) => r.organization?.name === org)?.rating_category?.rating as string | undefined;
  const ci = by('CLASS_IND');
  if (ci) return ci.replace(/^.*?(L|\d+)$/, '$1');
  const pegi = by('PEGI');
  if (pegi && PEGI[pegi.replace(/\D/g, '')]) return PEGI[pegi.replace(/\D/g, '')];
  const esrb = by('ESRB');
  return (esrb && ESRB[esrb.replace(/\W/g, '')]) || null;
}

const fields = [
  'name', 'slug', 'cover.image_id', 'screenshots.image_id', 'artworks.image_id', 'genres.name', 'themes.name',
  'involved_companies.company.name', 'involved_companies.developer', 'involved_companies.publisher',
  'first_release_date', 'release_dates.platform.name', 'release_dates.date', 'release_dates.status.name', 'release_dates.date_format.format',
  'age_ratings.organization.name', 'age_ratings.rating_category.rating', 'total_rating', 'game_modes.name',
  'videos.video_id', 'videos.name',
].join(',');

const ids = GAMES.map((g) => g.igdb).filter(Boolean);
const raw = await igdb<any>('games', `fields ${fields}; where id = (${ids.join(',')}); limit 500;`);

const out = raw.map((g) => {
  const releases = new Map<string, string | null>();
  for (const r of g.release_dates ?? []) {
    const key = platformKey(r.platform?.name);
    if (!key || !SELLABLE.has(r.status?.name)) continue;
    const d = releaseDay(r);
    const prev = releases.get(key);
    // earliest known date per platform wins
    if (!releases.has(key) || (d && (!prev || d < prev))) releases.set(key, d);
  }
  const company = (role: 'developer' | 'publisher') =>
    (g.involved_companies ?? []).filter((c: any) => c[role]).map((c: any) => c.company?.name).filter(Boolean);
  return {
    igdb: g.id,
    igdbSlug: g.slug,
    name: g.name,
    cover: g.cover?.image_id ?? null,
    screenshots: (g.screenshots ?? []).slice(0, 8).map((s: any) => s.image_id),
    artworks: (g.artworks ?? []).slice(0, 4).map((s: any) => s.image_id),
    genres: (g.genres ?? []).map((x: any) => x.name),
    themes: (g.themes ?? []).map((x: any) => x.name),
    modes: (g.game_modes ?? []).map((x: any) => x.name),
    developers: company('developer'),
    publishers: company('publisher'),
    released: day(g.first_release_date),
    releases: Object.fromEntries([...releases].sort()),
    classInd: classInd(g.age_ratings),
    score: g.total_rating ? Math.round(g.total_rating) : null,
    videos: (g.videos ?? []).slice(0, 3).map((v: any) => ({ id: v.video_id, name: v.name })),
  };
});

const missing = ids.filter((i) => !out.some((g) => g.igdb === i));
if (missing.length) console.warn(`games: IGDB returned nothing for ids ${missing.join(', ')}`);
out.sort((a, b) => ids.indexOf(a.igdb) - ids.indexOf(b.igdb));
await writeFile(new URL('../src/app/data/games.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`games: wrote ${out.length} games to src/app/data/games.json`);
