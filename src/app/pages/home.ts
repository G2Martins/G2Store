import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BY_SLUG, CATALOG, Game, brl, dateMs, families, fromPrice, gameState, hasPreorder, heroArt, img, isNew, nextLaunch,
  offerState, platformList, wideSet,
} from '../data/catalog';
import { FAMILIES, FAMILY_ORDER, Family, GIFT_CARDS, HARDWARE, OG_IMAGE, SITE_NAME } from '../data/store';
import { Countdown } from '../shared/countdown';
import { FAMILY_ICON, Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';
import { Seo } from '../shared/seo';
import { GameCard, GiftVisual, HwArt, Price, Shelf } from '../shared/ui';
import { Clock } from '../state';

const HERO: { slug: string; tagline: string }[] = [
  { slug: 'grand-theft-auto-vi', tagline: 'Vice City como você nunca viu. Reserve agora e receba o código no dia do lançamento.' },
  { slug: 'the-legend-of-zelda-ocarina-of-time', tagline: 'O clássico de 1998 reconstruído do zero para o Nintendo Switch 2.' },
  { slug: 'marvels-wolverine', tagline: 'Garras de adamantium e combate brutal numa história própria do universo Marvel da Insomniac.' },
  { slug: 'gears-of-war-e-day', tagline: 'A origem da saga: Marcus Fenix e o primeiro dia da Horda Locust.' },
];
const SLIDE_MS = 7000;

@Component({
  selector: 'app-home',
  imports: [RouterLink, Icon, Reveal, Countdown, GameCard, Shelf, Price, GiftVisual, HwArt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
})
export class Home {
  private clock = inject(Clock);
  protected brl = brl;
  protected wideSet = wideSet;
  protected slideMs = SLIDE_MS;

  protected slides = computed(() => {
    const now = this.clock.now();
    return HERO.map(({ slug, tagline }) => {
      const g = BY_SLUG.get(slug)!;
      const state = gameState(g, now);
      const fams = families(g, now);
      const plats = g.offers.filter((o) => fams.includes(o.family)).flatMap((o) => o.platforms.filter((p) => p !== 'ps4' && p !== 'xone'));
      const kicker = state === 'preorder' ? 'Pré-venda' : isNew(g, now) ? 'Lançamento' : 'Destaque';
      const scope = fams.length === 1 ? `Exclusivo ${platformList(plats)}` : platformList(plats);
      return { g, tagline, state, kicker, scope, art: heroArt(g)!, launch: nextLaunch(g, now), price: fromPrice(g, now) };
    });
  });

  protected active = signal(0);
  protected paused = signal(false);
  protected ready = signal(false);
  protected reduced = signal(false);
  /** Slides whose art may download. Starts with the LCP slide only. */
  protected loaded = signal(new Set([0]));
  /** The title mask-rise plays on slide changes, never on first paint (keeps the hero LCP-friendly). */
  protected moved = signal(false);
  protected art = (id: string) => img(id, 'screenshot_big');
  private timer?: ReturnType<typeof setTimeout>;

  private byTop = (a: Game, b: Game) => (a.top ?? 99) - (b.top ?? 99);
  protected releases = computed(() => {
    const now = this.clock.now();
    return CATALOG.filter((g) => g.released && dateMs(g.released) <= now).sort((a, b) => b.released!.localeCompare(a.released!)).slice(0, 10);
  });
  protected preorders = computed(() => {
    const now = this.clock.now();
    return CATALOG.filter((g) => hasPreorder(g, now)).sort((a, b) => Number(gameState(b, now) === 'preorder') - Number(gameState(a, now) === 'preorder') || this.byTop(a, b));
  });
  protected bestsellers = computed(() => CATALOG.filter((g) => g.top).sort(this.byTop).slice(0, 10));
  protected deals = computed(() => CATALOG.filter((g) => g.off).sort((a, b) => (b.off ?? 0) - (a.off ?? 0) || this.byTop(a, b)).slice(0, 12));

  protected tabs = FAMILY_ORDER.map((f) => ({ key: f, label: FAMILIES[f].label, store: FAMILIES[f].store, icon: FAMILY_ICON[f] }));
  protected tab = signal<Family>('playstation');
  protected byFamily = computed(() => {
    const now = this.clock.now();
    const f = this.tab();
    return CATALOG.filter((g) => g.offers.some((o) => o.family === f && offerState(o, g, now) !== 'none' && offerState(o, g, now) !== 'soon'))
      .sort((a, b) => this.byTop(a, b) || (b.released ?? '').localeCompare(a.released ?? '')).slice(0, 10);
  });

  protected gifts = GIFT_CARDS;
  protected hardware = HARDWARE.filter((h) => h.kind !== 'Controle').slice(0, 5);
  protected giftFrom = (values: number[]) => Math.min(...values);
  protected skel = [0, 1, 2, 3, 4, 5];

  constructor() {
    inject(Seo).set({
      title: `${SITE_NAME} | Jogos digitais, pré-vendas, gift cards e consoles`,
      description: 'Loja simulada de jogos digitais para PC, PlayStation, Xbox e Nintendo: GTA VI em pré-venda, lançamentos, promoções, gift cards e consoles. Projeto de portfólio.',
      path: '/',
      image: OG_IMAGE,
    });
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      this.reduced.set(matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.ready.set(true);
      this.schedule();
      // Warm the next slide's art once the page is idle, before autoplay needs it.
      const warm = () => this.preload(1);
      'requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 4000 }) : setTimeout(warm, 3000);
    });
    destroy.onDestroy(() => clearTimeout(this.timer));
  }

  private schedule() {
    clearTimeout(this.timer);
    if (this.paused() || this.reduced()) return;
    this.timer = setTimeout(() => this.go(this.active() + 1, false), SLIDE_MS);
  }

  private preload(i: number) {
    const n = HERO.length;
    this.loaded.update((set) => (set.has((i + n) % n) ? set : new Set([...set, (i + n) % n])));
  }

  protected go(i: number, user = true) {
    const n = HERO.length;
    this.active.set((i + n) % n);
    this.moved.set(true);
    this.preload(i);
    this.preload(i + 1);
    if (user) this.paused.set(true);
    this.schedule();
  }

  protected togglePause() {
    this.paused.update((p) => !p);
    this.schedule();
  }

  /** Hover / focus pauses the rotation without toggling the user's explicit choice. */
  protected hold(on: boolean) {
    if (on) clearTimeout(this.timer);
    else this.schedule();
  }

  protected pickerKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    this.go(this.active() + (e.key === 'ArrowRight' ? 1 : -1));
    (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('button')[this.active()]?.focus();
  }

  protected tabKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const keys = this.tabs.map((t) => t.key);
    const i = (keys.indexOf(this.tab()) + (e.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length;
    this.tab.set(keys[i]);
    (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role=tab]')[i]?.focus();
  }

  protected thumb = (id: string) => img(id, 'screenshot_med');
}
