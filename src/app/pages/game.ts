import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import {
  BY_SLUG, CATALOG, Game, OfferState, brl, coverSet, dateBR, dateMs, editions, img, launchOf, listPrice, offerState, platformList,
  salePrice, shipsOn, wideSet,
} from '../data/catalog';
import { ACTIVATION, FAMILIES, FAMILY_ORDER, Family, PLATFORM_LABEL, Platform, SITE_NAME, SITE_URL } from '../data/store';
import { Countdown } from '../shared/countdown';
import { FAMILY_ICON, Icon } from '../shared/icon';
import { Seo } from '../shared/seo';
import { ClassInd, GameCard } from '../shared/ui';
import { Clock, Store } from '../state';

const YT_ID = /^[\w-]{6,20}$/;

@Component({
  selector: 'app-game',
  imports: [RouterLink, Icon, Countdown, ClassInd, GameCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game.html',
})
export class GamePage {
  slug = input<string>('');
  protected store = inject(Store);
  private clock = inject(Clock);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  protected brl = brl;
  protected dateBR = dateBR;
  protected img = img;
  protected coverSet = coverSet;
  protected wideSet = wideSet;
  protected activation = ACTIVATION;
  protected families = FAMILIES;

  protected game = computed<Game | undefined>(() => BY_SLUG.get(this.slug()));

  /** Every platform family, with why it can or cannot be bought. */
  protected options = computed(() => {
    const g = this.game();
    if (!g) return [];
    const now = this.clock.now();
    return FAMILY_ORDER.map((f) => {
      const o = g.offers.find((x) => x.family === f)!;
      const state: OfferState = offerState(o, g, now);
      const launch = launchOf(o, g, now);
      // Platforms the code is actually for: out now (available) or with an announced day (pre-order).
      const names = platformList(o.platforms.filter((p) => {
        const d = g.releases[p];
        return state === 'available' ? !!d && dateMs(d) <= now : !!d && d.length === 10;
      }));
      const hint =
        state === 'available' ? names
        : state === 'preorder' ? `Pré-venda · ${dateBR(launch)}`
        : state === 'soon' ? `Em breve no ${platformList(o.platforms)}`
        : `Não disponível para ${FAMILIES[f].label}`;
      return { family: f, label: FAMILIES[f].label, store: FAMILIES[f].store, icon: FAMILY_ICON[f], state, launch, hint, names, enabled: state === 'available' || state === 'preorder' };
    });
  });

  protected family = linkedSignal<Family | null>(() => this.options().find((o) => o.enabled)?.family ?? null);
  protected current = computed(() => this.options().find((o) => o.family === this.family()));
  protected edition = linkedSignal({ source: this.game, computation: () => 'Standard' });
  protected editions = computed(() => {
    const g = this.game(), f = this.family();
    if (!g || !f) return [];
    return editions(g).map((name) => {
      const list = listPrice(g, f, name);
      return { name, list, sale: salePrice(list, g.off) };
    });
  });
  protected price = computed(() => this.editions().find((e) => e.name === this.edition()) ?? this.editions()[0]);
  protected wished = computed(() => this.store.wish().includes(this.slug()));

  protected releaseRows = computed(() => {
    const g = this.game();
    if (!g) return [];
    return (Object.keys(PLATFORM_LABEL) as Platform[]).filter((p) => p in g.releases).map((p) => ({ label: PLATFORM_LABEL[p], date: dateBR(g.releases[p] ?? null) }));
  });

  protected shots = computed(() => this.game()?.screenshots ?? []);
  protected shot = linkedSignal({ source: this.game, computation: () => 0 });
  protected tab = linkedSignal<Game | undefined, 'sobre' | 'ativar'>({ source: this.game, computation: () => 'sobre' });

  protected video = computed(() => {
    const v = this.game()?.videos.find((x) => YT_ID.test(x.id));
    return v ? { ...v, poster: this.game()!.artworks[1] ?? this.game()!.screenshots[1] ?? this.game()!.screenshots[0] } : null;
  });
  protected playing = linkedSignal({ source: this.game, computation: () => false });
  protected embed = computed(() => {
    const v = this.video();
    return v ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`) : null;
  });

  protected related = computed(() => {
    const g = this.game();
    if (!g) return [];
    const fams = shipsOn(g);
    return CATALOG.filter((x) => x !== g)
      .map((x) => ({ x, s: x.genres.filter((n) => g.genres.includes(n) && n !== 'Aventura').length * 2 + shipsOn(x).filter((f) => fams.includes(f)).length }))
      .sort((a, b) => b.s - a.s || (a.x.top ?? 99) - (b.x.top ?? 99))
      .slice(0, 6)
      .map((r) => r.x);
  });

  private lightbox = viewChild<ElementRef<HTMLDialogElement>>('lightbox');

  constructor() {
    const seo = inject(Seo);
    effect(() => {
      const g = this.game();
      if (!g) {
        seo.set({ title: `Jogo não encontrado | ${SITE_NAME}`, description: 'Este jogo não está no catálogo da G2Store, loja simulada de jogos digitais.', path: `/jogo/${this.slug()}/`, noindex: true });
        return;
      }
      const plats = (Object.keys(g.releases) as Platform[]).map((p) => PLATFORM_LABEL[p]);
      const url = `${SITE_URL}/jogo/${g.slug}/`;
      seo.set({
        title: `${g.name}: comprar código para ${shipsOn(g).map((f) => FAMILIES[f].label).join(', ')} | ${SITE_NAME}`,
        description: `${g.desc.split('. ')[0]}. Código digital para ${plats.join(', ')} na loja simulada G2Store.`.slice(0, 300),
        path: `/jogo/${g.slug}/`,
        image: g.screenshots[0] ? img(g.screenshots[0], '1080p') : undefined,
        imageAlt: `Cena de ${g.name}`,
        // VideoGame without Offer markup on purpose: prices here are fictional.
        jsonLd: [
          {
            '@type': 'VideoGame',
            '@id': `${url}#game`,
            name: g.name,
            url,
            description: g.desc,
            image: g.cover ? img(g.cover, 'cover_big_2x') : undefined,
            genre: g.genres,
            gamePlatform: plats,
            playMode: g.modes,
            datePublished: g.released ?? undefined,
            author: g.developers.map((name) => ({ '@type': 'Organization', name })),
            publisher: g.publishers.map((name) => ({ '@type': 'Organization', name })),
            contentRating: g.classInd ? `ClassInd ${g.classInd === 'L' ? 'Livre' : g.classInd}` : undefined,
            inLanguage: 'pt-BR',
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Jogos', item: `${SITE_URL}/jogos/` },
              { '@type': 'ListItem', position: 3, name: g.name, item: url },
            ],
          },
        ],
      });
    });
  }

  private line() {
    const g = this.game(), f = this.family();
    if (!g || !f || !this.current()?.enabled) return null;
    return { kind: 'game' as const, slug: g.slug, family: f, edition: this.edition(), qty: 1 };
  }

  protected add() {
    const l = this.line();
    if (!l) return;
    this.store.add(l, this.game()!.name);
    this.store.drawerOpen.set(true);
  }

  protected buyNow() {
    const l = this.line();
    if (!l) return;
    this.store.add(l, this.game()!.name);
    this.router.navigate(['/checkout']);
  }

  /** The 1080p image only renders while the lightbox is open (no hidden download). */
  protected lightboxOpen = signal(false);
  protected open(i: number) {
    this.shot.set(i);
    this.lightboxOpen.set(true);
    this.lightbox()?.nativeElement.showModal();
  }
  protected closeLightbox() { this.lightbox()?.nativeElement.close(); }
  protected step(d: number) {
    const n = this.shots().length;
    this.shot.set((this.shot() + d + n) % n);
  }
  protected lightboxKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') this.step(1);
    if (e.key === 'ArrowLeft') this.step(-1);
  }
  protected backdrop(e: MouseEvent) { if (e.target === e.currentTarget) this.closeLightbox(); }

  protected tabKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    this.tab.set(this.tab() === 'sobre' ? 'ativar' : 'sobre');
    document.getElementById(`gtab-${this.tab()}`)?.focus();
  }
}
