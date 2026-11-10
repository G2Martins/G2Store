import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { brl } from '../data/catalog';
import { FAMILIES, Family, GIFT_CARDS, GiftCard, SITE_NAME } from '../data/store';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';
import { Seo } from '../shared/seo';
import { GiftVisual } from '../shared/ui';
import { Store } from '../state';

const REDEEM: Record<Family, string[]> = {
  pc: ['Na Steam, abra o menu Jogos e escolha "Resgatar um código da Carteira Steam".', 'Digite o código e confirme.', 'O saldo entra na Carteira Steam na hora, em reais.'],
  playstation: ['No console, abra a PlayStation Store e toque no menu "...".', 'Escolha "Resgatar códigos" e digite o código.', 'O saldo entra na carteira da sua conta PSN.'],
  xbox: ['Acesse microsoft.com/redeem ou abra a Microsoft Store no Xbox.', 'Entre com a sua conta Microsoft e digite o código.', 'O saldo fica disponível na conta Microsoft.'],
  nintendo: ['No Switch ou Switch 2, abra o Nintendo eShop e selecione o perfil.', 'Toque em "Resgatar código" e digite os 16 caracteres.', 'O saldo entra na sua conta Nintendo.'],
};

@Component({
  selector: 'app-gift-cards',
  imports: [RouterLink, Icon, Reveal, GiftVisual],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap pt-10 sm:pt-14">
      <nav aria-label="Trilha" class="font-mono text-[11px] uppercase tracking-[.12em] text-dim">
        <a routerLink="/" class="hover:text-ink">Início</a> <span class="mx-1.5">/</span> <span class="text-ink-2">Gift Cards</span>
      </nav>
      <p class="eyebrow mt-5">Crédito digital em reais</p>
      <h1 class="h-display mt-3 text-[38px] sm:text-[52px]"><span class="mask"><span class="rise">Gift Cards</span></span></h1>
      <p class="mt-4 max-w-xl text-ink-2">Saldo para Steam, PlayStation Store, Microsoft Store e Nintendo eShop. Escolha o valor e receba o código em Meus pedidos, na hora.</p>

      <div class="mt-12 grid gap-8 lg:grid-cols-2">
        @for (c of cards; track c.slug; let i = $index) {
          <section [id]="c.slug" class="card scroll-mt-40 p-5 sm:p-6" [attr.aria-labelledby]="'gc-' + c.slug" [reveal]="i * 60">
            <div class="grid gap-6 sm:grid-cols-[220px_1fr]">
              <app-gift-visual [family]="c.family" [value]="picked()[c.slug]" />
              <div>
                <h2 [id]="'gc-' + c.slug" class="text-[20px] font-medium tracking-tight">{{ c.name }}</h2>
                <p class="mt-1.5 text-[13.5px] text-ink-2">{{ c.note }}</p>
                <fieldset class="mt-4">
                  <legend class="eyebrow">Valor</legend>
                  <div class="mt-3 flex flex-wrap gap-2">
                    @for (v of c.values; track v) {
                      <label class="opt !min-h-[40px] !px-3 text-[14px] font-medium">
                        <input type="radio" [name]="'valor-' + c.slug" [checked]="picked()[c.slug] === v" (change)="pick(c.slug, v)" />
                        R$ {{ v }}
                      </label>
                    }
                  </div>
                </fieldset>
              </div>
            </div>
            <div class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
              <div>
                <p class="text-[24px] font-semibold leading-none tracking-tight">{{ brl(picked()[c.slug]) }}</p>
                <p class="mt-1.5 text-[12px] text-dim">Resgate na {{ store(c) }} · código de demonstração</p>
              </div>
              <button type="button" class="btn btn-primary" (click)="add(c)"><app-icon name="bag" [size]="16" /> Adicionar ao carrinho</button>
            </div>
            <details class="group mt-4 text-[13.5px] text-ink-2">
              <summary class="flex cursor-pointer list-none items-center gap-2 py-1 text-ink hover:text-accent">
                <app-icon name="chevron-right" [size]="14" class="transition-transform group-open:rotate-90" /> Como resgatar
              </summary>
              <ol class="mt-3 list-decimal space-y-1.5 pl-9">
                @for (s of steps(c); track $index) { <li>{{ s }}</li> }
              </ol>
            </details>
          </section>
        }
      </div>
    </div>
  `,
})
export class GiftCards {
  private cart = inject(Store);
  protected cards = GIFT_CARDS;
  protected brl = brl;
  protected picked = signal<Record<string, number>>(Object.fromEntries(GIFT_CARDS.map((c) => [c.slug, c.values.includes(100) ? 100 : c.values[0]])));
  protected store = (c: GiftCard) => FAMILIES[c.family].store;
  protected steps = (c: GiftCard) => REDEEM[c.family];

  constructor() {
    inject(Seo).set({
      title: `Gift Cards Steam, PlayStation, Xbox e Nintendo eShop | ${SITE_NAME}`,
      description: 'Cartões presente digitais em reais para Steam, PlayStation Store, Xbox e Nintendo eShop, de R$ 30 a R$ 500. Loja simulada de portfólio: códigos de demonstração.',
      path: '/gift-cards/',
    });
  }

  protected pick(slug: string, v: number) { this.picked.update((p) => ({ ...p, [slug]: v })); }

  protected add(c: GiftCard) {
    const value = this.picked()[c.slug];
    this.cart.add({ kind: 'gift', slug: c.slug, value, qty: 1 }, `${c.name} R$ ${value}`);
    this.cart.drawerOpen.set(true);
  }
}
