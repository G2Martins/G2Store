import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { brl, dateBR } from '../data/catalog';
import { COUPON } from '../data/store';
import { Store, View } from '../state';
import { Icon } from './icon';
import { GiftVisual, HwArt } from './ui';

/** Thumbnail for any cart/order item: game cover, gift card art or hardware illustration. */
@Component({
  selector: 'app-thumb',
  imports: [GiftVisual, HwArt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block shrink-0' },
  template: `
    @if (image(); as im) {
      <img [src]="im.src" width="64" height="90" class="rounded-lg border border-white/10 object-cover" [class]="small() ? 'h-[60px] w-[43px]' : 'h-[90px] w-16'" alt="" loading="lazy" />
    } @else if (visual()?.kind === 'gift') {
      <app-gift-visual [class]="small() ? 'w-[43px]' : 'mt-5 w-16'" [family]="visual()!.family" [value]="visual()!.value" [compact]="true" />
    } @else {
      <div class="dotgrid grid place-items-center rounded-lg border border-line bg-well p-1" [class]="small() ? 'h-[43px] w-[43px]' : 'h-16 w-16'"><app-hw-art [art]="visual()?.art ?? 'pad'" /></div>
    }
  `,
})
export class Thumb {
  image = input<View['image']>();
  visual = input<View['visual']>();
  small = input(false);
}

@Component({
  selector: 'app-cart-lines',
  imports: [RouterLink, Icon, Thumb],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <ul class="divide-y divide-line" aria-label="Itens no carrinho">
      @for (v of store.view(); track v.key) {
        <li class="flex gap-3.5 py-4">
          <a [routerLink]="v.href" tabindex="-1" aria-hidden="true"><app-thumb [image]="v.image" [visual]="v.visual" /></a>
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <a [routerLink]="v.href" class="block text-[14.5px] font-medium leading-snug hover:text-accent">{{ v.name }}</a>
                <p class="mt-0.5 text-[12.5px] text-ink-2">{{ v.detail }}</p>
                @if (v.launch) { <p class="mt-1 font-mono text-[10.5px] uppercase tracking-[.08em] text-accent">Pré-venda · código em {{ dateBR(v.launch) }}</p> }
              </div>
              <button type="button" class="icon-btn -mr-2 -mt-1.5 !h-9 !w-9" (click)="store.remove(v.key, v.name)" [attr.aria-label]="'Remover ' + v.name"><app-icon name="trash" [size]="15" /></button>
            </div>
            <div class="mt-2.5 flex items-center justify-between gap-2">
              <div class="inline-flex items-center rounded-lg border border-line-2" role="group" [attr.aria-label]="'Quantidade de ' + v.name">
                <button type="button" class="grid h-9 w-9 place-items-center text-ink-2 hover:text-ink disabled:opacity-40" [disabled]="v.line.qty <= 1"
                        (click)="store.setQty(v.key, v.line.qty - 1)" aria-label="Diminuir quantidade"><app-icon name="minus" [size]="14" /></button>
                <span class="w-7 text-center text-[13px]">{{ v.line.qty }}</span>
                <button type="button" class="grid h-9 w-9 place-items-center text-ink-2 hover:text-ink disabled:opacity-40" [disabled]="v.line.qty >= 10"
                        (click)="store.setQty(v.key, v.line.qty + 1)" aria-label="Aumentar quantidade"><app-icon name="plus" [size]="14" /></button>
              </div>
              <div class="text-right">
                @if (v.list > v.unit) { <span class="strike mr-1.5 text-[12px]">{{ brl(v.list * v.line.qty) }}</span> }
                <span class="text-[15px] font-semibold">{{ brl(v.unit * v.line.qty) }}</span>
              </div>
            </div>
          </div>
        </li>
      }
    </ul>
  `,
})
export class CartLines {
  protected store = inject(Store);
  protected brl = brl;
  protected dateBR = dateBR;
}

@Component({
  selector: 'app-cart-summary',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (coupon()) {
      <form class="flex gap-2" (submit)="apply($event, code.value)">
        <label for="cupom" class="sr-only">Cupom de desconto</label>
        <input #code id="cupom" class="field !min-h-[42px] uppercase" placeholder="Cupom (teste {{ demo }})" autocomplete="off" [value]="store.coupon() ?? ''" />
        <button type="submit" class="btn btn-line !min-h-[42px]">Aplicar</button>
      </form>
      @if (error()) { <p class="mt-2 text-[12.5px] text-warn" role="alert">Cupom inválido. Use {{ demo }} para testar.</p> }
      @if (store.coupon()) {
        <p class="mt-2 flex items-center justify-between text-[12.5px] text-accent">
          <span class="inline-flex items-center gap-1.5"><app-icon name="tag" [size]="13" /> {{ store.coupon() }} aplicado</span>
          <button type="button" class="text-ink-2 underline-offset-2 hover:underline" (click)="store.coupon.set(null)">remover</button>
        </p>
      }
    }
    <dl class="mt-5 space-y-2.5 text-[14px]">
      <div class="flex justify-between"><dt class="text-ink-2">Subtotal</dt><dd>{{ brl(store.subtotal() + store.savings()) }}</dd></div>
      @if (store.savings() > 0) { <div class="flex justify-between"><dt class="text-ink-2">Descontos dos produtos</dt><dd class="text-accent">-{{ brl(store.savings()) }}</dd></div> }
      @if (store.discount() > 0) { <div class="flex justify-between"><dt class="text-ink-2">Cupom {{ store.coupon() }} ({{ percent }}%)</dt><dd class="text-accent">-{{ brl(store.discount()) }}</dd></div> }
      @if (store.physical()) { <div class="flex justify-between"><dt class="text-ink-2">Frete simulado</dt><dd>{{ brl(store.shipping()) }}</dd></div> }
      <div class="flex items-baseline justify-between border-t border-line pt-3.5">
        <dt class="font-medium">Total</dt><dd class="text-[24px] font-semibold tracking-tight">{{ brl(store.total()) }}</dd>
      </div>
    </dl>
    @if (store.coupon() && hasGift()) { <p class="mt-2 text-[12px] text-dim">O cupom não vale para gift cards.</p> }
  `,
})
export class CartSummary {
  coupon = input(true);
  protected store = inject(Store);
  protected brl = brl;
  protected demo = COUPON.code;
  protected percent = COUPON.percent;
  protected error = signal(false);
  protected hasGift = () => this.store.view().some((v) => !v.couponable);
  protected apply(e: Event, code: string) {
    e.preventDefault();
    this.error.set(!this.store.applyCoupon(code));
  }
}
