import { Injectable, PLATFORM_ID, TransferState, computed, effect, inject, makeStateKey, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  BY_SLUG, GIFT_BY_SLUG, HW_BY_SLUG, coverSet, img, launchOf, listPrice, offerState, salePrice,
} from './data/catalog';
import { COUPON, FAMILIES, Family, SHIPPING } from './data/store';

const NOW = makeStateKey<number>('now');
/** Release rules work in days, so the clock does too: same-day visits never re-render after hydration. */
const today = () => new Date().setHours(0, 0, 0, 0);

/**
 * One clock for availability rules. The browser first renders with the prerender's day
 * (so hydration matches the static HTML), then App moves it to the visitor's day.
 */
@Injectable({ providedIn: 'root' })
export class Clock {
  private ts = inject(TransferState);
  readonly now = signal(this.ts.get(NOW, today()));
  /** True once the first (hydration) render is done: later renders may use browser-only state freely. */
  readonly hydrated = signal(false);
  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) this.ts.set(NOW, this.now());
  }
  sync() { this.now.set(today()); this.hydrated.set(true); }
}

export type Line =
  | { kind: 'game'; slug: string; family: Family; edition: string; qty: number }
  | { kind: 'gift'; slug: string; value: number; qty: number }
  | { kind: 'hw'; slug: string; qty: number };

export interface View {
  key: string;
  line: Line;
  name: string;
  detail: string;
  href: string;
  image?: { src: string; srcset?: string };
  visual?: { kind: 'gift' | 'hw'; family: Family; value?: number; art?: string };
  unit: number;
  list: number;
  physical: boolean;
  /** Pre-order: code is released on this day. */
  launch: string | null;
  couponable: boolean;
}

export interface OrderItem {
  name: string;
  detail: string;
  href: string;
  family: Family;
  kind: Line['kind'];
  qty: number;
  unit: number;
  codes: string[];
  launch: string | null;
  image?: { src: string; srcset?: string };
  visual?: View['visual'];
}

export interface Order {
  id: string;
  at: number;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon: string | null;
  delivery: { cep: string; name: string } | null;
}

export const lineKey = (l: Line) =>
  l.kind === 'game' ? `game:${l.slug}:${l.family}:${l.edition}` : l.kind === 'gift' ? `gift:${l.slug}:${l.value}` : `hw:${l.slug}`;

const round = (v: number) => Math.round(v * 100) / 100;

/** Demo activation code. Clearly fake: crypto random, no checksum, labelled on screen. */
export function demoCode(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  const s = [...bytes].map((b) => abc[b % abc.length]).join('');
  return `${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10)}`;
}

@Injectable({ providedIn: 'root' })
export class Store {
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private clock = inject(Clock);
  private loaded = signal(false);

  readonly lines = signal<Line[]>([]);
  readonly wish = signal<string[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly coupon = signal<string | null>(null);
  readonly drawerOpen = signal(false);
  /** Polite live-region message (cart updates, copy feedback). */
  readonly announce = signal('');

  readonly count = computed(() => this.lines().reduce((n, l) => n + l.qty, 0));

  /** Cart lines resolved against the catalogue (prices are never stored, so they stay current). */
  readonly view = computed<View[]>(() => {
    const now = this.clock.now();
    return this.lines().flatMap((line): View[] => {
      const key = lineKey(line);
      if (line.kind === 'game') {
        const g = BY_SLUG.get(line.slug);
        const offer = g?.offers.find((o) => o.family === line.family);
        if (!g || !offer) return [];
        const list = listPrice(g, line.family, line.edition);
        const state = offerState(offer, g, now);
        return [{
          key, line, name: g.name, href: `/jogo/${g.slug}`,
          detail: `${FAMILIES[line.family].label} · ${line.edition}`,
          image: g.cover ? { src: img(g.cover, 'cover_big'), srcset: coverSet(g.cover) } : undefined,
          unit: salePrice(list, g.off), list, physical: false,
          launch: state === 'preorder' ? launchOf(offer, g, now) : null, couponable: true,
        }];
      }
      if (line.kind === 'gift') {
        const c = GIFT_BY_SLUG.get(line.slug);
        if (!c) return [];
        return [{
          key, line, name: `${c.name} R$ ${line.value}`, href: '/gift-cards', detail: `Código digital · ${FAMILIES[c.family].store}`,
          visual: { kind: 'gift', family: c.family, value: line.value }, unit: line.value, list: line.value,
          physical: false, launch: null, couponable: false,
        }];
      }
      const h = HW_BY_SLUG.get(line.slug);
      if (!h) return [];
      return [{
        key, line, name: h.name, href: '/consoles', detail: `${h.kind} · entrega física simulada`,
        visual: { kind: 'hw', family: h.family, art: h.art }, unit: salePrice(h.price, h.off), list: h.price,
        physical: true, launch: null, couponable: true,
      }];
    });
  });

  readonly subtotal = computed(() => round(this.view().reduce((s, v) => s + v.unit * v.line.qty, 0)));
  readonly savings = computed(() => round(this.view().reduce((s, v) => s + (v.list - v.unit) * v.line.qty, 0)));
  readonly discount = computed(() =>
    this.coupon() ? round(this.view().filter((v) => v.couponable).reduce((s, v) => s + v.unit * v.line.qty, 0) * COUPON.percent / 100) : 0,
  );
  readonly physical = computed(() => this.view().some((v) => v.physical));
  readonly shipping = computed(() => (this.physical() ? SHIPPING : 0));
  readonly total = computed(() => round(this.subtotal() - this.discount() + this.shipping()));

  constructor() {
    if (!this.browser) return;
    const save = (key: string, value: () => unknown) =>
      effect(() => {
        const v = value();
        if (!this.loaded()) return;
        try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
      });
    save('g2s:cart', this.lines);
    save('g2s:wish', this.wish);
    save('g2s:orders', this.orders);
    save('g2s:coupon', this.coupon);
  }

  /** Called once after hydration so the prerendered HTML (empty cart) matches the first client render. */
  load() {
    const read = <T,>(key: string, fallback: T): T => {
      try { return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback; } catch { return fallback; }
    };
    this.lines.set(read<Line[]>('g2s:cart', []).filter((l) => l && l.qty > 0));
    this.wish.set(read<string[]>('g2s:wish', []));
    this.orders.set(read<Order[]>('g2s:orders', []));
    this.coupon.set(read<string | null>('g2s:coupon', null));
    this.loaded.set(true);
  }

  add(line: Line, name: string) {
    const key = lineKey(line);
    this.lines.update((ls) => {
      const found = ls.find((l) => lineKey(l) === key);
      return found ? ls.map((l) => (l === found ? { ...l, qty: Math.min(10, l.qty + line.qty) } : l)) : [...ls, line];
    });
    this.announce.set(`${name} adicionado ao carrinho. ${this.count()} ${this.count() === 1 ? 'item' : 'itens'} no carrinho.`);
  }

  setQty(key: string, qty: number) {
    this.lines.update((ls) => ls.map((l) => (lineKey(l) === key ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l)));
  }

  remove(key: string, name: string) {
    this.lines.update((ls) => ls.filter((l) => lineKey(l) !== key));
    this.announce.set(`${name} removido do carrinho.`);
  }

  applyCoupon(code: string): boolean {
    const ok = code.trim().toUpperCase() === COUPON.code;
    this.coupon.set(ok ? COUPON.code : null);
    this.announce.set(ok ? `Cupom ${COUPON.code} aplicado: ${COUPON.percent}% de desconto.` : 'Cupom inválido.');
    return ok;
  }

  toggleWish(slug: string, name: string) {
    const on = this.wish().includes(slug);
    this.wish.update((w) => (on ? w.filter((s) => s !== slug) : [slug, ...w]));
    this.announce.set(on ? `${name} saiu da lista de desejos.` : `${name} entrou na lista de desejos.`);
  }

  /** Simulated Pix payment: turns the cart into an order with demo codes. No data leaves the browser. */
  placeOrder(delivery: Order['delivery']): Order {
    const now = Date.now();
    const order: Order = {
      id: `G2-${now.toString(36).toUpperCase().slice(-6)}`,
      at: now,
      items: this.view().map((v) => ({
        name: v.name, detail: v.detail, href: v.href, kind: v.line.kind, qty: v.line.qty, unit: v.unit,
        family: v.line.kind === 'game' ? v.line.family : (v.visual?.family ?? 'pc'),
        codes: v.physical ? [] : Array.from({ length: v.line.qty }, demoCode),
        launch: v.launch, image: v.image, visual: v.visual,
      })),
      subtotal: this.subtotal(),
      discount: this.discount(),
      shipping: this.shipping(),
      total: this.total(),
      coupon: this.coupon(),
      delivery: this.physical() ? delivery : null,
    };
    this.orders.update((o) => [order, ...o]);
    this.lines.set([]);
    this.coupon.set(null);
    return order;
  }
}
