import { Routes } from '@angular/router';

const catalog = () => import('./pages/catalog').then((m) => m.Catalog);

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then((m) => m.Home) },
  { path: 'jogos', loadComponent: catalog },
  { path: 'promocoes', loadComponent: catalog, data: { promo: true } },
  { path: 'jogo/:slug', loadComponent: () => import('./pages/game').then((m) => m.GamePage) },
  { path: 'gift-cards', loadComponent: () => import('./pages/gift-cards').then((m) => m.GiftCards) },
  { path: 'consoles', loadComponent: () => import('./pages/consoles').then((m) => m.Consoles) },
  { path: 'carrinho', loadComponent: () => import('./pages/cart').then((m) => m.CartPage) },
  { path: 'checkout', loadComponent: () => import('./pages/checkout').then((m) => m.Checkout) },
  { path: 'meus-pedidos', loadComponent: () => import('./pages/orders').then((m) => m.Orders) },
  { path: 'lista-de-desejos', loadComponent: () => import('./pages/wishlist').then((m) => m.Wishlist) },
  { path: '**', loadComponent: () => import('./pages/not-found').then((m) => m.NotFound) },
];
