import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BY_SLUG, Game } from '../data/catalog';
import { SITE_NAME } from '../data/store';
import { Icon } from '../shared/icon';
import { Seo } from '../shared/seo';
import { GameCard } from '../shared/ui';
import { Store } from '../state';

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, Icon, GameCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap pt-10 sm:pt-14">
      <p class="eyebrow">Sua conta</p>
      <h1 class="h-display mt-3 text-[38px] sm:text-[52px]">Lista de desejos</h1>
      @if (games().length) {
        <h2 class="sr-only">Jogos salvos</h2>
        <ul class="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          @for (g of games(); track g.slug) {
            <li class="relative">
              <app-game-card [game]="g" />
              <button type="button" class="btn btn-ghost mt-1 !min-h-[36px] !px-0 text-[12.5px]" (click)="store.toggleWish(g.slug, g.name)">
                <app-icon name="x" [size]="14" /> Remover
              </button>
            </li>
          }
        </ul>
      } @else {
        <div class="panel mt-10 flex flex-col items-center gap-3 px-6 py-20 text-center">
          <span class="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-well text-ink-2"><app-icon name="heart" [size]="24" /></span>
          <p class="text-[16px] font-medium">Sua lista está vazia</p>
          <p class="max-w-sm text-[13.5px] text-ink-2">Toque no coração na página de um jogo para guardar aqui e acompanhar preço e lançamento.</p>
          <a routerLink="/jogos" class="btn btn-primary mt-3">Explorar jogos</a>
        </div>
      }
    </div>
  `,
})
export class Wishlist {
  protected store = inject(Store);
  protected games = computed(() => this.store.wish().map((s) => BY_SLUG.get(s)).filter((g): g is Game => !!g));
  constructor() {
    inject(Seo).set({ title: `Lista de desejos | ${SITE_NAME}`, description: 'Jogos salvos na lista de desejos da G2Store, guardados apenas neste navegador.', path: '/lista-de-desejos/', noindex: true });
  }
}
