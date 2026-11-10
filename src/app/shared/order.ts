import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { brl, dateBR, dateMs } from '../data/catalog';
import { FAMILIES } from '../data/store';
import { Clock, Order, OrderItem, Store } from '../state';
import { Thumb } from './cart';
import { Icon } from './icon';

const MIN = 6e4;
const time = (ms: number) => new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** One order: status timeline, demo codes with copy, simulated delivery. */
@Component({
  selector: 'app-order',
  imports: [RouterLink, Icon, Thumb],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let o = order();
    <article class="card overflow-hidden" [attr.aria-labelledby]="'ord-' + o.id">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 [id]="'ord-' + o.id" class="font-mono text-[15px] font-medium tracking-tight">Pedido {{ o.id }}</h2>
          <p class="text-[12.5px] text-ink-2">{{ time(o.at) }} · Pix (simulação)</p>
        </div>
        <p class="text-right"><span class="block text-[12px] text-ink-2">Total</span><span class="text-[18px] font-semibold">{{ brl(o.total) }}</span></p>
      </header>

      <ol class="grid grid-cols-3 gap-2 border-b border-line px-5 py-4" aria-label="Andamento do pedido">
        @for (s of steps(); track s.label) {
          <li class="relative">
            <span class="block h-1 rounded-full" [class]="s.done ? 'bg-accent' : 'bg-line'"></span>
            <span class="mt-2.5 flex items-center gap-1.5 text-[12.5px] font-medium" [class.text-ink-2]="!s.done">
              @if (s.done) { <app-icon name="check" [size]="13" class="text-accent" /> } @else { <app-icon name="clock" [size]="13" class="text-dim" /> }
              {{ s.label }}
            </span>
            <span class="mt-0.5 block text-[11.5px] text-dim">{{ s.note }}</span>
          </li>
        }
      </ol>

      <ul class="divide-y divide-line px-5">
        @for (it of o.items; track $index) {
          <li class="flex gap-3.5 py-4">
            <a [routerLink]="it.href" tabindex="-1" aria-hidden="true"><app-thumb [image]="it.image" [visual]="it.visual" /></a>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-start justify-between gap-x-3">
                <a [routerLink]="it.href" class="text-[14.5px] font-medium leading-snug hover:text-accent">{{ it.name }}</a>
                <span class="text-[13px] text-ink-2">{{ it.qty }} × {{ brl(it.unit) }}</span>
              </div>
              <p class="mt-0.5 text-[12.5px] text-ink-2">{{ it.detail }}</p>

              @if (it.kind === 'hw') {
                <p class="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-line bg-well px-3 py-2 text-[12.5px]">
                  <app-icon name="truck" [size]="15" class="text-accent" /> {{ delivery() }}
                </p>
              } @else if (it.launch && !released(it)) {
                <p class="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/[.06] px-3 py-2 text-[12.5px] text-accent">
                  <app-icon name="clock" [size]="14" /> Pré-venda confirmada · código liberado em {{ dateBR(it.launch) }}
                </p>
              } @else {
                <ul class="mt-2.5 space-y-2">
                  @for (c of it.codes; track c) {
                    <li class="flex flex-wrap items-center gap-2">
                      <code class="rounded-lg border border-dashed border-line-2 bg-well px-3 py-1.5 font-mono text-[13.5px] tracking-[.08em] text-ink">{{ c }}</code>
                      <button type="button" class="btn btn-ghost !min-h-[34px] !px-2.5 text-[12px]" (click)="copy(c)" [attr.aria-label]="'Copiar código ' + c">
                        <app-icon [name]="copied() === c ? 'check' : 'copy'" [size]="14" /> {{ copied() === c ? 'Copiado' : 'Copiar' }}
                      </button>
                    </li>
                  }
                </ul>
                <p class="mt-1.5 text-[11.5px] text-warn">Código de demonstração, não é válido. Ativação em: {{ store(it) }}.</p>
              }
            </div>
          </li>
        }
      </ul>

      <footer class="flex flex-wrap justify-between gap-2 border-t border-line bg-well/60 px-5 py-3 text-[12.5px] text-ink-2">
        <span>Subtotal {{ brl(o.subtotal) }}@if (o.discount) { · cupom {{ o.coupon }} -{{ brl(o.discount) }}}@if (o.shipping) { · frete simulado {{ brl(o.shipping) }}}</span>
        @if (o.delivery) { <span>Entrega simulada para o CEP {{ o.delivery.cep }}@if (o.delivery.name) { · {{ o.delivery.name }}}</span> }
      </footer>
    </article>
  `,
})
export class OrderCard {
  order = input.required<Order>();
  private clock = inject(Clock);
  private cart = inject(Store);
  protected brl = brl;
  protected dateBR = dateBR;
  protected time = time;
  protected copied = signal<string | null>(null);

  protected released = (it: OrderItem) => !it.launch || dateMs(it.launch) <= this.clock.now();
  protected store = (it: OrderItem) => FAMILIES[it.family].store;

  protected steps = computed(() => {
    const o = this.order();
    const digital = o.items.filter((i) => i.kind !== 'hw');
    const ready = digital.filter((i) => this.released(i));
    const codeStep = !digital.length
      ? { label: 'Entrega', done: this.clock.now() - o.at > 10 * MIN, note: this.delivery() }
      : { label: 'Código liberado', done: ready.length > 0, note: ready.length === digital.length ? time(o.at) : `${ready.length} de ${digital.length} itens, o resto no lançamento` };
    return [
      { label: 'Pedido recebido', done: true, note: time(o.at) },
      { label: 'Pago', done: true, note: 'Pix simulado aprovado' },
      codeStep,
    ];
  });

  /** Simulated shipping timeline driven by the order age. */
  protected delivery = computed(() => {
    const age = this.clock.now() - this.order().at;
    if (age > 10 * MIN) return 'Entregue (simulação)';
    if (age > 2 * MIN) return 'Enviado, a caminho (simulação)';
    return 'Em separação no estoque (simulação)';
  });

  protected async copy(code: string) {
    try { await navigator.clipboard.writeText(code); } catch { return; }
    this.copied.set(code);
    this.cart.announce.set('Código copiado.');
    setTimeout(() => this.copied.set(null), 2000);
  }
}
