import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Game, brl, coverSet, families, fromPrice, img, labelsOf, listPrice, salePrice, shipsOn } from '../data/catalog';
import { FAMILIES, FAMILY_ORDER, Family, HardwareArt } from '../data/store';
import { Clock } from '../state';
import { FAMILY_ICON, Icon } from './icon';

/** Small brand marks for the families a product ships on. */
@Component({
  selector: 'app-platforms',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center gap-1.5' },
  template: `
    @for (f of list(); track f) {
      <span class="inline-flex" [title]="label(f)"><app-icon [name]="icon[f]" [size]="size()" /></span>
    }
    <span class="sr-only">Plataformas: {{ names() }}</span>
  `,
})
export class Platforms {
  families = input.required<Family[]>();
  size = input(13);
  protected icon = FAMILY_ICON;
  protected list = computed(() => FAMILY_ORDER.filter((f) => this.families().includes(f)));
  protected names = computed(() => this.list().map((f) => FAMILIES[f].label).join(', '));
  protected label = (f: Family) => FAMILIES[f].label;
}

@Component({
  selector: 'app-price',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex flex-wrap items-center gap-x-2 gap-y-1' },
  template: `
    @if (off()) {
      <span class="off">-{{ off() }}%</span>
      <span class="strike text-[12px]"><span class="sr-only">De </span>{{ fmt(list()) }}</span>
    }
    <span class="font-semibold tracking-tight text-ink" [class]="big() ? 'text-[26px]' : 'text-[15px]'">
      @if (off()) {<span class="sr-only">por </span>}{{ fmt(sale()) }}
    </span>
  `,
})
export class Price {
  list = input.required<number>();
  sale = input.required<number>();
  off = input<number | undefined>(0);
  big = input(false);
  protected fmt = brl;
}

@Component({
  selector: 'app-classind',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center gap-2.5' },
  template: `
    <span class="classind" [class]="'ci-' + rating()" role="img" [attr.aria-label]="aria()">{{ rating() }}</span>
    @if (withText()) { <span class="text-[13px] leading-tight text-ink-2">{{ text() }}</span> }
  `,
})
export class ClassInd {
  rating = input.required<string>();
  withText = input(true);
  protected text = computed(() => (this.rating() === 'L' ? 'Livre para todos os públicos' : `Não recomendado para menores de ${this.rating()} anos`));
  protected aria = computed(() => `Classificação indicativa: ${this.rating() === 'L' ? 'livre' : this.rating() + ' anos'}`);
}

// ponytail: `sizes` says 140px on phones so ~1.75x screens take the 264w cover (sharp enough, ~3x lighter than 528w).
@Component({
  selector: 'app-game-card',
  imports: [RouterLink, Platforms, Price],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let g = game();
    <article class="stretch lift group">
      <div class="relative aspect-[264/374] overflow-hidden rounded-[12px] border border-white/10 bg-panel-2">
        @if (g.cover) {
          <img class="zoom absolute inset-0 h-full w-full object-cover" [src]="cover(g.cover)" [srcset]="coverSet(g.cover)"
               sizes="(min-width: 1024px) 200px, 140px" width="264" height="374" [attr.loading]="eager() ? null : 'lazy'"
               [attr.fetchpriority]="eager() ? 'high' : null" decoding="async" alt="" />
        }
        <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#050826]/70 to-transparent"></div>
        @if (labels().length) {
          <div class="absolute left-2 top-2 flex flex-wrap gap-1">
            @for (l of labels(); track l.text) { <span class="label" [class.label-accent]="l.kind === 'accent'" [class.label-line]="l.kind === 'line'">{{ l.text }}</span> }
          </div>
        }
        <app-platforms class="absolute bottom-2 left-2 text-white/85" [families]="ships()" [size]="13" />
      </div>
      <h3 class="mt-3 text-[14px] font-medium leading-snug clamp-2 min-h-[2.6em]">
        <a class="stretch-link" [routerLink]="['/jogo', g.slug]">{{ g.name }}</a>
      </h3>
      <div class="mt-1.5">
        @if (sellable()) {
          <app-price [list]="price().list" [sale]="price().sale" [off]="g.off" />
        } @else {
          <span class="text-[13px] text-ink-2">Em breve</span>
        }
      </div>
    </article>
  `,
})
export class GameCard {
  game = input.required<Game>();
  eager = input(false);
  /** Show the price of this platform family (catalogue filtered by platform). */
  family = input<Family | null>(null);
  private clock = inject(Clock);
  protected cover = (id: string) => img(id, 'cover_big');
  protected coverSet = coverSet;
  protected labels = computed(() => labelsOf(this.game(), this.clock.now()));
  protected ships = computed(() => shipsOn(this.game()));
  protected sellable = computed(() => families(this.game(), this.clock.now()).length > 0);
  protected price = computed(() => {
    const f = this.family();
    if (!f) return fromPrice(this.game(), this.clock.now());
    const list = listPrice(this.game(), f);
    return { list, sale: salePrice(list, this.game().off) };
  });
}

/** Titled horizontal shelf with scroll buttons. Cards are projected. */
@Component({
  selector: 'app-shelf',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="mb-5 flex items-end justify-between gap-4">
      <div>
        <p class="eyebrow">{{ eyebrow() }}</p>
        <h2 class="h2 mt-2.5 text-[24px] sm:text-[30px]" [attr.id]="anchor()">{{ heading() }}</h2>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        @if (link()) {
          <a class="btn btn-ghost !min-h-[40px] !px-3 text-[13px]" [routerLink]="link()" [queryParams]="query()">Ver tudo <app-icon name="arrow-right" [size]="15" /></a>
        }
        <button type="button" class="icon-btn hidden sm:inline-grid" (click)="scroll(-1)" [attr.aria-label]="'Rolar ' + heading() + ' para a esquerda'"><app-icon name="chevron-left" /></button>
        <button type="button" class="icon-btn hidden sm:inline-grid" (click)="scroll(1)" [attr.aria-label]="'Rolar ' + heading() + ' para a direita'"><app-icon name="chevron-right" /></button>
      </div>
    </div>
    <div #track class="shelf" role="list" [attr.aria-labelledby]="anchor()"><ng-content /></div>
  `,
})
export class Shelf {
  eyebrow = input('');
  heading = input.required<string>();
  anchor = input.required<string>();
  link = input<string | null>(null);
  query = input<Record<string, string> | null>(null);
  private track = viewChild.required<ElementRef<HTMLElement>>('track');
  protected scroll(dir: number) {
    const el = this.track().nativeElement;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? 'auto' : 'smooth' });
  }
}

const GIFT_BG: Record<Family, string> = {
  pc: 'linear-gradient(135deg, #0b1740 0%, #16327a 55%, #2a5bc2 100%)',
  playstation: 'linear-gradient(135deg, #071a5c 0%, #1440b8 60%, #3d74f0 100%)',
  xbox: 'linear-gradient(135deg, #062a17 0%, #0f6a33 58%, #2fa457 100%)',
  nintendo: 'linear-gradient(135deg, #5c0a14 0%, #b81c2e 58%, #ef4152 100%)',
};

/** Our own gift card artwork: gradient, family mark, face value. No official card art. */
@Component({
  selector: 'app-gift-visual',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="relative aspect-[1.586] overflow-hidden rounded-[12px] border border-white/15 text-white" [style.background]="bg()">
      <div class="absolute inset-0 dotgrid opacity-60"></div>
      <div class="absolute -right-[18%] -top-[30%] aspect-square w-[70%] rounded-full border border-white/15"></div>
      <div class="absolute -right-[4%] -top-[12%] aspect-square w-[44%] rounded-full border border-white/10"></div>
      <div class="relative flex h-full flex-col justify-between" [class]="compact() ? 'p-2' : 'p-4'">
        <div class="flex items-center justify-between">
          <app-icon [name]="icon()" [size]="compact() ? 12 : 20" />
          @if (!compact()) { <span class="font-mono text-[10px] uppercase tracking-[.14em] text-white/70">G2Store · gift</span> }
        </div>
        <div>
          @if (!compact()) { <p class="font-mono text-[10px] uppercase tracking-[.14em] text-white/70">{{ store() }}</p> }
          @if (value()) { <p class="font-semibold tracking-tight" [class]="compact() ? 'text-[11px]' : 'text-[28px] leading-none mt-1'">R$ {{ value() }}</p> }
        </div>
      </div>
    </div>
  `,
})
export class GiftVisual {
  family = input.required<Family>();
  value = input<number | undefined>();
  compact = input(false);
  protected bg = computed(() => GIFT_BG[this.family()]);
  protected icon = computed(() => FAMILY_ICON[this.family()]);
  protected store = computed(() => FAMILIES[this.family()].store);
}

/** Flat, original hardware illustrations (no product photos). */
@Component({
  selector: 'app-hw-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <svg viewBox="0 0 200 150" class="h-full w-full" role="img" [attr.aria-label]="label()">
      <ellipse cx="100" cy="134" rx="62" ry="6" fill="#000" opacity=".35" />
      @switch (art()) {
        @case ('tower') {
          <rect x="89" y="20" width="22" height="110" rx="4" fill="#0b0f2c" />
          <path d="M89 24C72 16 58 24 58 40l3 78c0 11 13 16 28 12z" fill="#eef0fa" />
          <path d="M111 24c17-8 31 0 31 16l-3 78c0 11-13 16-28 12z" fill="#eef0fa" />
          <path d="M95 30h10" stroke="#c8f53c" stroke-width="2.4" stroke-linecap="round" />
          <rect x="84" y="128" width="32" height="5" rx="2.5" fill="#0b0f2c" />
        }
        @case ('tower-pro') {
          <rect x="89" y="18" width="22" height="112" rx="4" fill="#0b0f2c" />
          <path d="M89 22C72 14 58 22 58 38l3 80c0 11 13 16 28 12z" fill="#eef0fa" />
          <path d="M111 22c17-8 31 0 31 16l-3 80c0 11-13 16-28 12z" fill="#eef0fa" />
          <path d="M58 62h31M58 70h31M58 78h31M111 62h31M111 70h31M111 78h31" stroke="#0b0f2c" stroke-width="2.2" />
          <path d="M95 28h10" stroke="#c8f53c" stroke-width="2.4" stroke-linecap="round" />
          <rect x="84" y="128" width="32" height="5" rx="2.5" fill="#0b0f2c" />
        }
        @case ('monolith') {
          <rect x="68" y="18" width="64" height="112" rx="6" fill="#161c4a" stroke="#3a46a8" stroke-width="1.5" />
          <path d="M68 30h64" stroke="#3a46a8" />
          <ellipse cx="100" cy="24" rx="26" ry="4" fill="#060a24" />
          @for (x of [84, 92, 100, 108, 116]; track x) { <circle [attr.cx]="x" cy="24" r="1.4" fill="#c8f53c" /> }
          <circle cx="78" cy="38" r="2.2" fill="#e9ecf8" />
        }
        @case ('compact') {
          <rect x="62" y="38" width="76" height="92" rx="6" fill="#eef0fa" />
          <circle cx="112" cy="70" r="18" fill="#0b0f2c" />
          @for (r of [5, 10, 14]; track r) { <circle cx="112" cy="70" [attr.r]="r" fill="none" stroke="#2c3790" stroke-width="1.2" /> }
          <circle cx="72" cy="48" r="2" fill="#c8f53c" />
        }
        @case ('hybrid') {
          <rect x="44" y="44" width="22" height="62" rx="10" [attr.fill]="accent() ? '#c8f53c' : '#1f6fe0'" />
          <rect x="134" y="44" width="22" height="62" rx="10" [attr.fill]="accent() ? '#c8f53c' : '#e8394b'" />
          <rect x="64" y="42" width="72" height="66" rx="4" fill="#0b0f2c" stroke="#2c3790" />
          <rect x="70" y="48" width="60" height="54" rx="2" fill="#141c5c" />
          <path d="M70 90l18-16 14 10 12-8 16 14v12H70z" fill="#1d2a8a" opacity=".9" />
          <circle cx="55" cy="60" r="4" fill="#0b0f2c" /><circle cx="145" cy="88" r="4" fill="#0b0f2c" />
        }
        @case ('deck') {
          <rect x="22" y="48" width="156" height="62" rx="24" fill="#12163a" stroke="#2c3790" />
          <rect x="62" y="56" width="76" height="46" rx="3" fill="#060a24" />
          <path d="M66 94l16-14 12 8 12-9 28 15v6H66z" fill="#c8f53c" opacity=".55" />
          <circle cx="42" cy="66" r="7" fill="#060a24" /><circle cx="158" cy="66" r="7" fill="#060a24" />
          <rect x="34" y="84" width="16" height="16" rx="4" fill="#060a24" /><rect x="150" y="84" width="16" height="16" rx="4" fill="#060a24" />
        }
        @default {
          <path d="M58 58c6-10 18-12 30-12h24c12 0 24 2 30 12 8 14 14 40 10 52-3 9-14 10-20 3l-12-14H80l-12 14c-6 7-17 6-20-3-4-12 2-38 10-52z" [attr.fill]="accent() ? '#eef0fa' : '#12163a'" stroke="#2c3790" />
          <circle cx="78" cy="72" r="7" [attr.fill]="accent() ? '#0b0f2c' : '#060a24'" /><circle cx="114" cy="86" r="7" [attr.fill]="accent() ? '#0b0f2c' : '#060a24'" />
          <circle cx="126" cy="66" r="3" fill="#c8f53c" /><circle cx="134" cy="72" r="3" fill="#c8f53c" opacity=".7" />
          <circle cx="118" cy="72" r="3" fill="#c8f53c" opacity=".7" /><circle cx="126" cy="78" r="3" fill="#c8f53c" opacity=".5" />
        }
      }
    </svg>
  `,
})
export class HwArt {
  art = input.required<HardwareArt | string>();
  label = input('');
  /** Variant color (special edition, white controller). */
  accent = input(false);
}
