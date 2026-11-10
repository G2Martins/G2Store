import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import {
  CATALOG, GENRES, Game, dateMs, families, fromPrice, isNew, listPrice, offerState, salePrice, search,
} from '../data/catalog';
import { FAMILIES, FAMILY_ORDER, Family, SITE_NAME } from '../data/store';
import { FAMILY_ICON, Icon } from '../shared/icon';
import { Seo } from '../shared/seo';
import { GameCard } from '../shared/ui';
import { Clock } from '../state';

const PRICES = [
  { key: 'ate-100', label: 'Até R$ 100', min: 0, max: 100 },
  { key: '100-200', label: 'R$ 100 a R$ 200', min: 100, max: 200 },
  { key: '200-300', label: 'R$ 200 a R$ 300', min: 200, max: 300 },
  { key: '300-mais', label: 'Acima de R$ 300', min: 300, max: Infinity },
];
const SORTS = [
  { key: 'relevancia', label: 'Relevância' },
  { key: 'menor-preco', label: 'Menor preço' },
  { key: 'maior-desconto', label: 'Maior desconto' },
  { key: 'lancamento', label: 'Lançamento' },
];
const PAGE = 12;

export interface Filters {
  q: string;
  plataforma: Family | null;
  genero: string | null;
  preco: string | null;
  promo: boolean;
  status: 'lancamento' | 'pre-venda' | null;
  ordem: string;
}

/** Pure filter + sort, shared by /jogos and /promocoes. */
export function filterGames(f: Filters, now: number): Game[] {
  const price = (g: Game) => (f.plataforma ? salePrice(listPrice(g, f.plataforma), g.off) : fromPrice(g, now).sale);
  const band = PRICES.find((p) => p.key === f.preco);
  const hits = f.q.trim().length >= 2 ? new Set(search(f.q, 100)) : null;
  const list = CATALOG.filter((g) => {
    const fams = families(g, now);
    if (!fams.length) return false;
    if (hits && !hits.has(g)) return false;
    if (f.plataforma && !fams.includes(f.plataforma)) return false;
    if (f.genero && !g.genres.includes(f.genero)) return false;
    if (f.promo && !g.off) return false;
    if (band && (price(g) < band.min || price(g) >= band.max)) return false;
    if (f.status === 'lancamento' && !isNew(g, now, 90)) return false;
    if (f.status === 'pre-venda') {
      const offers = g.offers.filter((o) => !f.plataforma || o.family === f.plataforma);
      if (!offers.some((o) => offerState(o, g, now) === 'preorder')) return false;
    }
    return true;
  });
  const latest = (g: Game) => (g.released ? dateMs(g.released) : 0);
  const sorters: Record<string, (a: Game, b: Game) => number> = {
    relevancia: (a, b) => (a.top ?? 99) - (b.top ?? 99) || latest(b) - latest(a),
    'menor-preco': (a, b) => price(a) - price(b),
    'maior-desconto': (a, b) => (b.off ?? 0) - (a.off ?? 0) || price(a) - price(b),
    lancamento: (a, b) => latest(b) - latest(a),
  };
  return list.sort(sorters[f.ordem] ?? sorters['relevancia']);
}

@Component({
  selector: 'app-catalog',
  imports: [RouterLink, Icon, GameCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalog.html',
})
export class Catalog {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clock = inject(Clock);

  protected promoPage = !!this.route.snapshot.data['promo'];
  protected readonly prices = PRICES;
  protected readonly sorts = SORTS;
  protected readonly genres = GENRES;
  protected readonly platforms = FAMILY_ORDER.map((f) => ({ key: f, label: FAMILIES[f].label, icon: FAMILY_ICON[f] }));

  // Query params are applied after hydration, so the prerendered HTML (no params) hydrates cleanly.
  private live = signal(this.clock.hydrated());
  private qp = toSignal(this.route.queryParamMap);
  protected filters = computed<Filters>(() => {
    const p: ParamMap | undefined = this.live() ? this.qp() : undefined;
    const get = (k: string) => p?.get(k) ?? null;
    const plat = get('plataforma') as Family | null;
    const status = get('status');
    return {
      q: get('q') ?? '',
      plataforma: plat && plat in FAMILIES ? plat : null,
      genero: GENRES.includes(get('genero') ?? '') ? get('genero') : null,
      preco: PRICES.some((x) => x.key === get('preco')) ? get('preco') : null,
      promo: this.promoPage || get('promo') === '1',
      status: status === 'lancamento' || status === 'pre-venda' ? status : null,
      ordem: SORTS.some((s) => s.key === get('ordem')) ? get('ordem')! : this.promoPage ? 'maior-desconto' : 'relevancia',
    };
  });
  protected results = computed(() => filterGames(this.filters(), this.clock.now()));
  protected shown = signal(PAGE);
  protected visible = computed(() => this.results().slice(0, this.shown()));
  protected showFilters = signal(false);

  protected heading = computed(() => {
    const f = this.filters();
    if (this.promoPage) return f.plataforma ? `Promoções de ${FAMILIES[f.plataforma].label}` : 'Promoções';
    if (f.q) return `Resultados para "${f.q}"`;
    if (f.status === 'pre-venda') return 'Pré-vendas';
    if (f.plataforma) return `Jogos de ${FAMILIES[f.plataforma].label}`;
    return 'Todos os jogos';
  });

  protected chips = computed(() => {
    const f = this.filters();
    const out: { key: string; label: string }[] = [];
    if (f.q) out.push({ key: 'q', label: `Busca: ${f.q}` });
    if (f.plataforma) out.push({ key: 'plataforma', label: FAMILIES[f.plataforma].label });
    if (f.status) out.push({ key: 'status', label: f.status === 'pre-venda' ? 'Pré-venda' : 'Lançamentos' });
    if (f.genero) out.push({ key: 'genero', label: f.genero });
    if (f.preco) out.push({ key: 'preco', label: PRICES.find((p) => p.key === f.preco)!.label });
    if (f.promo && !this.promoPage) out.push({ key: 'promo', label: 'Em promoção' });
    return out;
  });

  constructor() {
    afterNextRender(() => this.live.set(true));
    const promo = this.promoPage;
    inject(Seo).set({
      title: promo ? `Promoções de jogos digitais | ${SITE_NAME}` : `Catálogo de jogos para PC, PlayStation, Xbox e Nintendo | ${SITE_NAME}`,
      description: promo
        ? 'Jogos digitais com desconto para PC, PlayStation, Xbox e Nintendo: Elden Ring, Red Dead Redemption 2, EA Sports FC 26 e mais. Loja simulada de portfólio.'
        : 'Catálogo completo da G2Store: filtre por plataforma, gênero, faixa de preço, promoções, lançamentos e pré-vendas. Cada jogo só aparece para as plataformas em que foi lançado.',
      path: promo ? '/promocoes/' : '/jogos/',
    });
  }

  protected set(key: string, value: string | null) {
    this.shown.set(PAGE);
    this.router.navigate([], { relativeTo: this.route, queryParams: { [key]: value || null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected clear() {
    this.shown.set(PAGE);
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  protected familyFor = (g: Game) => this.filters().plataforma && families(g, this.clock.now()).includes(this.filters().plataforma!) ? this.filters().plataforma : null;
}
