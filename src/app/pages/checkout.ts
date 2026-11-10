import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { brl } from '../data/catalog';
import { SITE_NAME } from '../data/store';
import { CartSummary, Thumb } from '../shared/cart';
import { Icon } from '../shared/icon';
import { OrderCard } from '../shared/order';
import { Seo } from '../shared/seo';
import { Order, Store } from '../state';

/** Decorative pseudo QR: three finder squares + seeded noise. Not a real Pix payload. */
function fakeQr(seed: number, n = 25): boolean[][] {
  let s = Math.floor(seed * 100) % 2147483647 || 1;
  const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647;
  const corners = [[0, 0], [0, n - 7], [n - 7, 0]];
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => {
    const k = corners.find(([y, x]) => r >= y && r < y + 7 && c >= x && c < x + 7);
    if (!k) return rnd() > 0.52;
    const dy = r - k[0], dx = c - k[1];
    return dy === 0 || dy === 6 || dx === 0 || dx === 6 || (dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4);
  }));
}

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, Icon, CartSummary, Thumb, OrderCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.html',
})
export class Checkout {
  protected store = inject(Store);
  protected brl = brl;
  protected cep = signal('');
  protected name = signal('');
  protected touched = signal(false);
  protected paying = signal(false);
  protected placed = signal<Order | null>(null);

  protected cepDigits = computed(() => this.cep().replace(/\D/g, '').slice(0, 8));
  protected cepOk = computed(() => this.cepDigits().length === 8);
  protected qr = computed(() => fakeQr(this.store.total()));

  constructor() {
    inject(Seo).set({ title: `Pagamento simulado | ${SITE_NAME}`, description: 'Checkout simulado da G2Store com Pix de demonstração. Nenhuma cobrança é feita e nenhum dado de pagamento é pedido.', path: '/checkout/', noindex: true });
  }

  protected formatCep(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 8);
    this.cep.set(d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d);
  }

  protected pay() {
    this.touched.set(true);
    if (this.store.physical() && !this.cepOk()) {
      document.getElementById('cep')?.focus();
      return;
    }
    this.paying.set(true);
    // ponytail: fixed 1.4s "processing" delay, purely cosmetic.
    setTimeout(() => {
      const delivery = { cep: this.cep(), name: this.name().trim().slice(0, 60) };
      this.placed.set(this.store.placeOrder(delivery));
      this.paying.set(false);
      this.store.announce.set('Pagamento simulado aprovado. Seus códigos de demonstração foram liberados.');
      scrollTo({ top: 0 });
    }, 1400);
  }
}
