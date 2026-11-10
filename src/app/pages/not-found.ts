import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_NAME } from '../data/store';
import { Seo } from '../shared/seo';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap py-28 text-center">
      <p class="eyebrow justify-center">Erro 404</p>
      <h1 class="h-display mt-4 text-[44px] sm:text-[60px]">Fase não encontrada</h1>
      <p class="mx-auto mt-4 max-w-md text-ink-2">Essa página não existe na G2Store. Volte para o início ou explore o catálogo.</p>
      <div class="mt-8 flex justify-center gap-2">
        <a routerLink="/" class="btn btn-primary">Ir para o início</a>
        <a routerLink="/jogos" class="btn btn-line">Ver jogos</a>
      </div>
    </div>
  `,
})
export class NotFound {
  constructor() {
    inject(Seo).set({ title: `Página não encontrada | ${SITE_NAME}`, description: 'Esta página não existe na G2Store, loja simulada de jogos digitais.', path: '/404/', noindex: true });
  }
}
