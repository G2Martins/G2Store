import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { AUTHOR, OG_IMAGE, PORTFOLIO_URL, SITE_NAME, SITE_URL } from '../data/store';

export interface PageSeo {
  title: string;
  description: string;
  /** Path with trailing slash, e.g. "/jogo/fable/". */
  path: string;
  image?: string;
  imageAlt?: string;
  noindex?: boolean;
  jsonLd?: object[];
}

const abs = (p: string) => (p.startsWith('http') ? p : SITE_URL + p);

export const websiteNode = () => ({
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  inLanguage: 'pt-BR',
  description: 'Loja simulada de jogos digitais, gift cards e consoles. Projeto de portfólio.',
  creator: { '@type': 'Person', '@id': `${PORTFOLIO_URL}#person`, name: AUTHOR, url: PORTFOLIO_URL },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/jogos/?q={busca}` },
    'query-input': 'required name=busca',
  },
});

@Injectable({ providedIn: 'root' })
export class Seo {
  private doc = inject(DOCUMENT);
  private meta = inject(Meta);
  private title = inject(Title);

  set(p: PageSeo) {
    const url = abs(p.path);
    const image = abs(p.image ?? OG_IMAGE);
    this.title.setTitle(p.title);
    const tags: Record<string, string> = {
      description: p.description,
      robots: p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
      'og:type': 'website',
      'og:site_name': SITE_NAME,
      'og:locale': 'pt_BR',
      'og:title': p.title,
      'og:description': p.description,
      'og:url': url,
      'og:image': image,
      'og:image:alt': p.imageAlt ?? p.title,
      'twitter:card': 'summary_large_image',
      'twitter:title': p.title,
      'twitter:description': p.description,
      'twitter:image': image,
    };
    for (const [key, content] of Object.entries(tags)) {
      const attr = key.startsWith('og:') ? 'property' : 'name';
      this.meta.updateTag({ [attr]: key, content }, `${attr}="${key}"`);
    }

    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);

    let ld = this.doc.getElementById('ld-json');
    if (!ld) {
      ld = this.doc.createElement('script');
      ld.id = 'ld-json';
      ld.setAttribute('type', 'application/ld+json');
      this.doc.head.appendChild(ld);
    }
    // Escape "<" so no string in the data can close the script element.
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [websiteNode(), ...(p.jsonLd ?? [])] }).replace(/</g, '\\u003c');
  }
}
