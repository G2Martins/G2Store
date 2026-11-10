import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Game, brl, fromPrice, img, search, shipsOn } from '../data/catalog';
import { Clock } from '../state';
import { Icon } from './icon';
import { Platforms } from './ui';

/** Header search: instant results by title, genre or studio (ARIA combobox + listbox). */
@Component({
  selector: 'app-search',
  imports: [Icon, Platforms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
  template: `
    <form role="search" (submit)="submit($event)">
      <label class="sr-only" [attr.for]="uid()">Buscar jogos</label>
      <app-icon name="search" [size]="17" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
      <input [id]="uid()" type="search" class="field !rounded-full !pl-10 !pr-4" placeholder="Buscar jogos, gêneros ou estúdios"
             autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list"
             [attr.aria-expanded]="open()" [attr.aria-controls]="uid() + '-list'"
             [attr.aria-activedescendant]="active() >= 0 ? uid() + '-opt-' + active() : null"
             [value]="q()" (input)="type($any($event.target).value)" (keydown)="key($event)"
             (focus)="focused.set(true)" (blur)="focused.set(false)" />
    </form>
    @if (open()) {
      <div class="card absolute inset-x-0 top-[calc(100%+12px)] z-50 overflow-hidden !rounded-[14px] p-1.5" (mousedown)="$event.preventDefault()">
        @if (results().length) {
          <ul [id]="uid() + '-list'" role="listbox" aria-label="Resultados da busca">
            @for (g of results(); track g.slug; let i = $index) {
              <li [id]="uid() + '-opt-' + i" role="option" [attr.aria-selected]="i === active()"
                  class="flex cursor-pointer items-center gap-3 rounded-[10px] p-2"
                  [class.bg-panel-2]="i === active()" (mouseenter)="active.set(i)" (click)="go(g)">
                @if (g.cover) { <img [src]="thumb(g.cover)" width="40" height="53" class="h-[53px] w-10 shrink-0 rounded-md object-cover" alt="" /> }
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[14px] font-medium">{{ g.name }}</span>
                  <span class="mt-0.5 flex items-center gap-2 text-[12px] text-ink-2">
                    <app-platforms [families]="ships(g)" [size]="11" /> <span class="truncate">{{ g.genres.slice(0, 2).join(' · ') }}</span>
                  </span>
                </span>
                <span class="shrink-0 text-[13px] font-semibold">{{ price(g) }}</span>
              </li>
            }
          </ul>
          <button type="button" class="mt-1 w-full rounded-[10px] px-3 py-2.5 text-left text-[13px] text-ink-2 hover:bg-panel-2 hover:text-ink" (click)="all()">
            Ver todos os resultados para "{{ q() }}"
          </button>
        } @else {
          <p class="px-3 py-4 text-[13px] text-ink-2" role="status">Nenhum jogo encontrado para "{{ q() }}".</p>
        }
      </div>
    }
  `,
})
export class Search {
  uid = input('busca');
  private router = inject(Router);
  private clock = inject(Clock);
  protected q = signal('');
  protected focused = signal(false);
  protected active = signal(-1);
  protected results = computed(() => search(this.q()));
  protected open = computed(() => this.focused() && this.q().trim().length >= 2);
  protected thumb = (id: string) => img(id, 'thumb');
  protected ships = shipsOn;
  protected price = (g: Game) => brl(fromPrice(g, this.clock.now()).sale);

  protected type(v: string) { this.q.set(v); this.active.set(-1); }

  protected key(e: KeyboardEvent) {
    const n = this.results().length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); this.active.set((this.active() + 1) % n); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); this.active.set((this.active() - 1 + n) % n); }
    else if (e.key === 'Escape') { this.q.set(''); }
  }

  protected submit(e: Event) {
    e.preventDefault();
    const pick = this.results()[this.active()];
    pick ? this.go(pick) : this.all();
  }

  protected go(g: Game) { this.reset(); this.router.navigate(['/jogo', g.slug]); }
  protected all() { const q = this.q().trim(); this.reset(); this.router.navigate(['/jogos'], { queryParams: { q } }); }
  private reset() { this.q.set(''); this.active.set(-1); (document.activeElement as HTMLElement | null)?.blur(); }
}
