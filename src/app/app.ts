import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, effect, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { brl } from './data/catalog';
import { AUTHOR, FAMILIES, FAMILY_ORDER, PORTFOLIO_URL, PROJECT_URL, REPO_URL } from './data/store';
import { FAMILY_ICON, Brand, Icon } from './shared/icon';
import { Search } from './shared/search';
import { CartLines } from './shared/cart';
import { Clock, Store } from './state';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Brand, Search, CartLines],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  protected store = inject(Store);
  private clock = inject(Clock);
  private router = inject(Router);

  protected readonly families = FAMILY_ORDER.map((f) => ({ key: f, label: FAMILIES[f].label, icon: FAMILY_ICON[f] }));
  protected readonly links = { author: AUTHOR, portfolio: PORTFOLIO_URL, project: PROJECT_URL, repo: REPO_URL };
  protected readonly year = new Date().getFullYear();
  protected brl = brl;

  protected menuOpen = signal(false);
  private cartDialog = viewChild.required<ElementRef<HTMLDialogElement>>('cartDialog');
  private menuDialog = viewChild.required<ElementRef<HTMLDialogElement>>('menuDialog');
  protected toast = signal('');
  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    afterNextRender(() => {
      this.store.load();
      this.clock.sync();
    });
    // Native <dialog>: showModal gives focus trap, inert page and Esc for free.
    effect(() => this.sync(this.cartDialog().nativeElement, this.store.drawerOpen()));
    effect(() => this.sync(this.menuDialog().nativeElement, this.menuOpen()));
    effect(() => {
      const msg = this.store.announce();
      if (!msg) return;
      this.toast.set(msg);
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => { this.toast.set(''); this.store.announce.set(''); }, 3200);
    });
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) { this.store.drawerOpen.set(false); this.menuOpen.set(false); }
    });
  }

  private sync(d: HTMLDialogElement, open: boolean) {
    if (typeof d.showModal !== 'function') return; // server render
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }

  /** Close on backdrop click (the dialog element itself is the backdrop hit target). */
  protected backdrop(e: MouseEvent, close: () => void) {
    if (e.target === e.currentTarget) close();
  }
  protected closeCart = () => this.store.drawerOpen.set(false);
  protected closeMenu = () => this.menuOpen.set(false);
}
