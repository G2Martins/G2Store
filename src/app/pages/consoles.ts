import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { brl, salePrice } from '../data/catalog';
import { FAMILIES, FAMILY_ORDER, Family, HARDWARE, Hardware, SHIPPING, SITE_NAME } from '../data/store';
import { FAMILY_ICON, Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';
import { Seo } from '../shared/seo';
import { HwArt } from '../shared/ui';
import { Store } from '../state';

@Component({
  selector: 'app-consoles',
  imports: [RouterLink, Icon, Reveal, HwArt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap pt-10 sm:pt-14">
      <nav aria-label="Trilha" class="font-mono text-[11px] uppercase tracking-[.12em] text-dim">
        <a routerLink="/" class="hover:text-ink">Início</a> <span class="mx-1.5">/</span> <span class="text-ink-2">Consoles</span>
      </nav>
      <p class="eyebrow mt-5">Hardware · entrega física simulada</p>
      <h1 class="h-display mt-3 text-[38px] sm:text-[52px]"><span class="mask"><span class="rise">Consoles e acessórios</span></span></h1>
      <p class="mt-4 max-w-2xl text-ink-2">
        PlayStation, Xbox, Nintendo Switch 2 e Steam Deck. A entrega é simulada: no checkout pedimos só um CEP de 8 dígitos e,
        se quiser, um nome para a entrega. Frete fixo simulado de {{ brl(shipping) }}.
      </p>

      <div class="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar por plataforma">
        <button type="button" class="btn !min-h-[38px] !px-3.5 text-[13px]" [class]="!filter() ? 'btn-primary' : 'btn-line'" [attr.aria-pressed]="!filter()" (click)="filter.set(null)">Todos</button>
        @for (f of fams; track f.key) {
          <button type="button" class="btn !min-h-[38px] !px-3.5 text-[13px]" [class]="filter() === f.key ? 'btn-primary' : 'btn-line'" [attr.aria-pressed]="filter() === f.key" (click)="filter.set(f.key)">
            <app-icon [name]="f.icon" [size]="13" /> {{ f.label }}
          </button>
        }
      </div>

      <ul class="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        @for (h of list(); track h.slug; let i = $index) {
          <li [id]="h.slug" class="card flex scroll-mt-40 flex-col overflow-hidden" [reveal]="(i % 3) * 60">
            <div class="dotgrid relative aspect-[4/3] bg-well p-6">
              <app-hw-art [art]="h.art" [accent]="h.slug.includes('zelda')" [label]="'Ilustração: ' + h.name" />
              <span class="label absolute left-3 top-3">{{ h.kind }}</span>
              @if (h.off) { <span class="off absolute right-3 top-3">-{{ h.off }}%</span> }
            </div>
            <div class="flex flex-1 flex-col p-5">
              <p class="eyebrow">{{ label(h.family) }}</p>
              <h2 class="mt-2 text-[18px] font-medium leading-snug tracking-tight">{{ h.name }}</h2>
              <ul class="mt-3 space-y-1 text-[13px] text-ink-2">
                @for (s of h.specs; track s) { <li class="flex items-center gap-2"><app-icon name="check" [size]="13" class="text-accent" /> {{ s }}</li> }
              </ul>
              @if (h.note) { <p class="mt-3 rounded-lg border border-line bg-well px-3 py-2 text-[12.5px] text-ink-2">{{ h.note }}</p> }
              <div class="mt-auto pt-5">
                <div class="flex flex-wrap items-baseline gap-x-2.5">
                  @if (h.off) { <span class="strike text-[13px]"><span class="sr-only">De </span>{{ brl(h.price) }}</span> }
                  <span class="text-[24px] font-semibold tracking-tight">@if (h.off) {<span class="sr-only">por </span>}{{ brl(sale(h)) }}</span>
                </div>
                <p class="mt-1 text-[12px] text-dim">ou 10x de {{ brl(sale(h) / 10) }} sem juros (simulado)</p>
                <button type="button" class="btn btn-primary mt-4 w-full" (click)="add(h)"><app-icon name="bag" [size]="16" /> Adicionar ao carrinho</button>
              </div>
            </div>
          </li>
        }
      </ul>

      <p class="mt-12 flex items-start gap-2 text-[12.5px] text-dim">
        <app-icon name="info" [size]="14" class="mt-px" /> Ilustrações próprias, sem fotos oficiais. Preços fictícios. Nenhum produto é enviado.
      </p>
    </div>
  `,
})
export class Consoles {
  private store = inject(Store);
  protected brl = brl;
  protected shipping = SHIPPING;
  protected fams = FAMILY_ORDER.map((f) => ({ key: f, label: FAMILIES[f].label, icon: FAMILY_ICON[f] }));
  protected filter = signal<Family | null>(null);
  protected list = computed(() => HARDWARE.filter((h) => !this.filter() || h.family === this.filter()));
  protected sale = (h: Hardware) => salePrice(h.price, h.off);
  protected label = (f: Family) => (f === 'pc' ? 'PC · Valve' : FAMILIES[f].label);

  constructor() {
    inject(Seo).set({
      title: `Consoles PS5, Xbox Series, Switch 2 e Steam Deck | ${SITE_NAME}`,
      description: 'PlayStation 5 Slim e Pro, Xbox Series X e S, Nintendo Switch 2, Steam Deck OLED e controles, com entrega simulada por CEP. Loja simulada de portfólio, preços fictícios.',
      path: '/consoles/',
    });
  }

  protected add(h: Hardware) {
    this.store.add({ kind: 'hw', slug: h.slug, qty: 1 }, h.name);
    this.store.drawerOpen.set(true);
  }
}
