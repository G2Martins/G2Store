import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_NAME } from '../data/store';
import { Icon } from '../shared/icon';
import { OrderCard } from '../shared/order';
import { Seo } from '../shared/seo';
import { Store } from '../state';

@Component({
  selector: 'app-orders',
  imports: [RouterLink, Icon, OrderCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap pt-10 sm:pt-14">
      <p class="eyebrow">Sua conta</p>
      <h1 class="h-display mt-3 text-[38px] sm:text-[52px]">Meus pedidos</h1>
      <p class="mt-4 max-w-xl text-[14px] text-ink-2">Pedidos ficam salvos só neste navegador. Todos os códigos são de demonstração e não funcionam em nenhuma loja.</p>
      @if (store.orders().length) {
        <div class="mt-10 max-w-4xl space-y-8">
          @for (o of store.orders(); track o.id) { <app-order [order]="o" /> }
        </div>
      } @else {
        <div class="panel mt-10 flex max-w-4xl flex-col items-center gap-3 px-6 py-20 text-center">
          <span class="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-well text-ink-2"><app-icon name="package" [size]="24" /></span>
          <p class="text-[16px] font-medium">Nenhum pedido ainda</p>
          <p class="max-w-sm text-[13.5px] text-ink-2">Faça uma compra simulada: escolha um jogo, pague com o Pix de demonstração e o código aparece aqui.</p>
          <a routerLink="/jogos" class="btn btn-primary mt-3">Explorar jogos</a>
        </div>
      }
    </div>
  `,
})
export class Orders {
  protected store = inject(Store);
  constructor() {
    inject(Seo).set({ title: `Meus pedidos | ${SITE_NAME}`, description: 'Pedidos simulados da G2Store com códigos de demonstração, salvos apenas neste navegador.', path: '/meus-pedidos/', noindex: true });
  }
}
