import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_NAME } from '../data/store';
import { CartLines, CartSummary } from '../shared/cart';
import { Icon } from '../shared/icon';
import { Seo } from '../shared/seo';
import { Store } from '../state';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, Icon, CartLines, CartSummary],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap pt-10 sm:pt-14">
      <p class="eyebrow">Sua compra</p>
      <h1 class="h-display mt-3 text-[38px] sm:text-[52px]">Carrinho</h1>
      @if (store.view().length) {
        <div class="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section class="panel px-5" aria-label="Itens"><app-cart-lines /></section>
          <aside class="self-start lg:sticky lg:top-32" aria-label="Resumo do pedido">
            <div class="card ticks p-5 sm:p-6">
              <h2 class="text-[17px] font-medium">Resumo</h2>
              <app-cart-summary class="mt-4" />
              <a routerLink="/checkout" class="btn btn-primary mt-6 w-full">Ir para o pagamento <app-icon name="arrow-right" [size]="16" /></a>
              <a routerLink="/jogos" class="btn btn-ghost mt-2 w-full">Continuar comprando</a>
              <p class="mt-3 text-center text-[12px] text-dim">Simulação: nenhuma cobrança é feita.</p>
            </div>
          </aside>
        </div>
      } @else {
        <div class="panel mt-10 flex flex-col items-center gap-3 px-6 py-20 text-center">
          <span class="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-well text-ink-2"><app-icon name="bag" [size]="24" /></span>
          <p class="text-[16px] font-medium">Seu carrinho está vazio</p>
          <p class="max-w-sm text-[13.5px] text-ink-2">Que tal começar pela pré-venda de GTA VI ou pelas promoções da semana?</p>
          <div class="mt-3 flex flex-wrap justify-center gap-2">
            <a routerLink="/jogo/grand-theft-auto-vi" class="btn btn-primary">Ver GTA VI</a>
            <a routerLink="/promocoes" class="btn btn-line">Promoções</a>
          </div>
        </div>
      }
    </div>
  `,
})
export class CartPage {
  protected store = inject(Store);
  constructor() {
    inject(Seo).set({ title: `Carrinho | ${SITE_NAME}`, description: 'Carrinho da G2Store, loja simulada de jogos digitais. Nenhuma compra é real.', path: '/carrinho/', noindex: true });
  }
}
