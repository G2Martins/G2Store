// Joins the IGDB snapshot (games.json) with the curated store layer (store.ts) and holds the
// pricing / availability rules. Anything time-dependent takes `now` so prerender and browser agree.
import RAW from './games.json';
import {
  FAMILIES, FAMILY_ORDER, Family, GAMES, GIFT_CARDS, HARDWARE, Platform, PLATFORM_LABEL, StoreGame,
} from './store';

export type OfferState = 'available' | 'preorder' | 'soon' | 'none';

export interface Offer {
  family: Family;
  /** Platforms of this family the game ships on (any date). */
  platforms: Platform[];
  /** Earliest exact or partial date ("2027", "2027-03", "2027-03-18") across those platforms, null = TBD. */
  date: string | null;
}

export interface Game extends Omit<StoreGame, 'classInd'> {
  name: string;
  cover: string | null;
  screenshots: string[];
  artworks: string[];
  genres: string[];
  themes: string[];
  modes: string[];
  developers: string[];
  publishers: string[];
  released: string | null;
  releases: Partial<Record<Platform, string | null>>;
  classInd: string | null;
  score: number | null;
  videos: { id: string; name: string }[];
  offers: Offer[];
}

type Raw = (typeof RAW)[number];

/** IGDB genre names in PT-BR (only the ones in the catalogue). */
const GENRE: Record<string, string> = {
  'Role-playing (RPG)': 'RPG', Adventure: 'Aventura', Shooter: 'Tiro', Racing: 'Corrida', Platform: 'Plataforma',
  'Hack and slash/Beat \'em up': 'Ação', Puzzle: 'Quebra-cabeça', Simulator: 'Simulação', Sport: 'Esporte',
  Strategy: 'Estratégia', 'Turn-based strategy (TBS)': 'Estratégia', Indie: 'Indie', Arcade: 'Arcade',
};
const MODE: Record<string, string> = {
  'Single player': 'Um jogador', Multiplayer: 'Multijogador', 'Co-operative': 'Cooperativo', 'Split screen': 'Tela dividida',
  'Massively Multiplayer Online (MMO)': 'MMO', 'Battle Royale': 'Battle Royale',
};
const uniq = <T,>(a: T[]) => [...new Set(a)];

const raw = new Map((RAW as Raw[]).map((r) => [r.igdb, r]));

export const CATALOG: Game[] = GAMES.flatMap((s) => {
  const r = raw.get(s.igdb);
  if (!r) return []; // not fetched yet: run `npm run games`
  const releases = r.releases as Partial<Record<Platform, string | null>>;
  const offers = FAMILY_ORDER.map((family): Offer => {
    const platforms = FAMILIES[family].platforms.filter((p) => p in releases);
    const dates = platforms.map((p) => releases[p]).filter((d): d is string => !!d).sort();
    return { family, platforms, date: dates[0] ?? null };
  });
  return [{
    ...s,
    name: s.name ?? r.name,
    cover: r.cover,
    screenshots: r.screenshots,
    artworks: r.artworks,
    genres: uniq(r.genres.map((g) => GENRE[g] ?? g)),
    themes: r.themes,
    modes: uniq(r.modes.map((m) => MODE[m] ?? m)),
    developers: r.developers,
    publishers: r.publishers,
    released: r.released,
    releases,
    classInd: s.classInd ?? r.classInd,
    score: r.score,
    videos: r.videos,
    offers,
  }];
});

export const BY_SLUG = new Map(CATALOG.map((g) => [g.slug, g]));
export const GENRES = uniq(CATALOG.flatMap((g) => g.genres)).sort((a, b) => a.localeCompare(b, 'pt-BR'));

/** "2026-11-19" -> ms at local midnight; partial dates sort to their last day so "2027" stays future. */
export function dateMs(d: string): number {
  const [y, m, day] = d.split('-').map(Number);
  if (day) return new Date(y, m - 1, day).getTime();
  if (m) return new Date(y, m, 0).getTime();
  return new Date(y, 11, 31).getTime();
}

/**
 * available: out now on at least one platform of the family.
 * preorder: only future releases, with an exact day announced.
 * soon: announced for the family but without a firm day (not sold yet).
 */
export function offerState(o: Offer, game: Game, now: number): OfferState {
  if (!o.platforms.length) return 'none';
  const dates = o.platforms.map((p) => game.releases[p]);
  if (dates.some((d) => d && dateMs(d) <= now)) return 'available';
  if (dates.some((d) => d && d.length === 10)) return 'preorder';
  return 'soon';
}

/** Earliest future, exact launch date of this family (pre-order target). */
export function launchOf(o: Offer, game: Game, now: number): string | null {
  return o.platforms.map((p) => game.releases[p]).filter((d): d is string => !!d && d.length === 10 && dateMs(d) > now).sort()[0] ?? null;
}

export const buyable = (s: OfferState) => s === 'available' || s === 'preorder';

export function gameState(g: Game, now: number): 'available' | 'preorder' | 'soon' {
  const states = g.offers.map((o) => offerState(o, g, now));
  return states.includes('available') ? 'available' : states.includes('preorder') ? 'preorder' : 'soon';
}

/** Families where this game can be bought right now (incl. pre-order). */
export const families = (g: Game, now: number) => g.offers.filter((o) => buyable(offerState(o, g, now))).map((o) => o.family);
/** Families where the game exists at all (for compatibility icons). */
export const shipsOn = (g: Game) => g.offers.filter((o) => o.platforms.length).map((o) => o.family);

/** Next launch across families when the whole game is still in pre-order. */
export function nextLaunch(g: Game, now: number): string | null {
  return g.offers.map((o) => launchOf(o, g, now)).filter((d): d is string => !!d).sort()[0] ?? null;
}

/** Has at least one platform family still in pre-order. */
export const hasPreorder = (g: Game, now: number) => g.offers.some((o) => offerState(o, g, now) === 'preorder');

export const isNew = (g: Game, now: number, days = 60) =>
  !!g.released && dateMs(g.released) <= now && now - dateMs(g.released) < days * 864e5;

// ---------- Money ----------
const cents = (v: number) => Math.round(v * 100) / 100;
/** PC keys are ~15% cheaper, ending in ",90". */
const pcPrice = (v: number) => Math.max(9.9, Math.round((v * 0.85) / 10) * 10 - 0.1);

export const editions = (g: Game) => ['Standard', ...Object.keys(g.ed ?? {})];

export function listPrice(g: Game, family: Family, edition = 'Standard'): number {
  const base = edition === 'Standard' ? g.price : g.ed?.[edition] ?? g.price;
  return cents(family === 'pc' ? pcPrice(base) : base);
}
export const salePrice = (list: number, off = 0) => cents(list * (1 - off / 100));

/** Cheapest buyable price, used on cards and for sorting / filtering. */
export function fromPrice(g: Game, now: number): { list: number; sale: number } {
  const fams = families(g, now);
  const list = Math.min(...(fams.length ? fams : shipsOn(g)).map((f) => listPrice(g, f)));
  return { list, sale: salePrice(list, g.off) };
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
/** Intl uses a non-breaking space after "R$"; keep it, it never wraps. */
export const brl = (v: number) => BRL.format(v);

// ---------- Dates / labels ----------
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function dateBR(d: string | null): string {
  if (!d) return 'A definir';
  const [y, m, day] = d.split('-');
  if (day) return `${day}/${m}/${y}`;
  if (m) return `${MONTHS[+m - 1]}/${y}`;
  return y;
}

export const platformList = (ps: Platform[]) => ps.map((p) => PLATFORM_LABEL[p]).join(' · ');

/** Cover labels, max 2, most important first. */
export function labelsOf(g: Game, now: number): { text: string; kind: 'accent' | 'line' | 'plain' }[] {
  const out: { text: string; kind: 'accent' | 'line' | 'plain' }[] = [];
  const state = gameState(g, now);
  if (state === 'preorder') out.push({ text: 'Pré-venda', kind: 'line' });
  else if (state === 'soon') out.push({ text: 'Em breve', kind: 'line' });
  else if (isNew(g, now)) out.push({ text: 'Lançamento', kind: 'accent' });
  else {
    // Out now somewhere, still a pre-order on another platform (e.g. a later Switch 2 port).
    const pre = g.offers.find((o) => offerState(o, g, now) === 'preorder');
    if (pre) out.push({ text: `Pré-venda ${PLATFORM_LABEL[pre.platforms.find((p) => !g.releases[p] || dateMs(g.releases[p]!) > now) ?? pre.platforms[0]]}`, kind: 'line' });
  }
  if (shipsOn(g).length === 1) out.push({ text: 'Exclusivo', kind: 'plain' });
  for (const t of g.tags ?? []) out.push({ text: t, kind: 'plain' });
  return out.slice(0, 2);
}

// ---------- IGDB images ----------
export type ImgSize = 'cover_big' | 'cover_big_2x' | 'screenshot_med' | 'screenshot_big' | '720p' | '1080p' | 'thumb';
export const img = (id: string, size: ImgSize) => `https://images.igdb.com/igdb/image/upload/t_${size}/${id}.jpg`;
export const coverSet = (id: string) => `${img(id, 'cover_big')} 264w, ${img(id, 'cover_big_2x')} 528w`;
export const wideSet = (id: string) => `${img(id, 'screenshot_med')} 569w, ${img(id, 'screenshot_big')} 889w, ${img(id, '720p')} 1280w, ${img(id, '1080p')} 1920w`;
/** Best wide key art for heroes: artworks first, then screenshots. */
export const heroArt = (g: Game) => g.artworks[0] || g.screenshots[0] || g.cover;

// ---------- Search ----------
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function search(q: string, limit = 6): Game[] {
  const t = fold(q.trim());
  if (t.length < 2) return [];
  const hit = (g: Game) => {
    const name = fold(g.name);
    if (name.startsWith(t)) return 3;
    if (name.includes(t)) return 2;
    if (g.genres.some((x) => fold(x).includes(t)) || g.developers.some((x) => fold(x).includes(t))) return 1;
    return 0;
  };
  return CATALOG.map((g) => [g, hit(g)] as const).filter(([, s]) => s).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([g]) => g);
}

// ---------- Other products ----------
export const GIFT_BY_SLUG = new Map(GIFT_CARDS.map((c) => [c.slug, c]));
export const HW_BY_SLUG = new Map(HARDWARE.map((h) => [h.slug, h]));
