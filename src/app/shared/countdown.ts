import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { dateBR, dateMs } from '../data/catalog';

/** Launch countdown. Prerendered HTML shows the date; the ticking starts in the browser. */
@Component({
  selector: 'app-countdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <p class="sr-only">Lançamento em {{ label() }}.</p>
    <div class="flex items-stretch gap-1.5" aria-hidden="true">
      @for (p of parts(); track p.unit) {
        <div class="min-w-[54px] rounded-[10px] border border-white/15 bg-[#050826]/70 px-2 py-1.5 text-center">
          <div class="font-mono text-[22px] font-medium leading-tight tracking-tight">{{ p.value }}</div>
          <div class="font-mono text-[9.5px] uppercase tracking-[.14em] text-ink-2">{{ p.unit }}</div>
        </div>
      }
    </div>
  `,
})
export class Countdown {
  to = input.required<string>();
  private now = signal<number | null>(null);
  protected label = computed(() => dateBR(this.to()));
  protected parts = computed(() => {
    const now = this.now();
    const left = now === null ? null : Math.max(0, dateMs(this.to()) - now);
    const pad = (n: number) => String(n).padStart(2, '0');
    const v = (div: number, mod: number) => (left === null ? '--' : pad(Math.floor(left / div) % mod));
    return [
      { unit: 'dias', value: left === null ? '--' : pad(Math.floor(left / 864e5)) },
      { unit: 'horas', value: v(36e5, 24) },
      { unit: 'min', value: v(6e4, 60) },
      { unit: 'seg', value: v(1e3, 60) },
    ];
  });

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      this.now.set(Date.now());
      const t = setInterval(() => this.now.set(Date.now()), 1000);
      destroy.onDestroy(() => clearInterval(t));
    });
  }
}
