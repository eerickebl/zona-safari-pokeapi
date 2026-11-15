import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Zona Safari',
    loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'explorar',
    title: 'Explorar - Zona Safari',
    loadComponent: () => import('./pages/explorar/explorar').then((m) => m.Explorar),
  },
  {
    path: 'guia',
    title: 'Pokédex - Zona Safari',
    loadComponent: () => import('./pages/guia/guia').then((m) => m.Guia),
  },
  {
    path: 'coleccion',
    title: 'Mi colección - Zona Safari',
    loadComponent: () => import('./pages/coleccion/coleccion').then((m) => m.Coleccion),
  },
  {
    path: '**',
    title: 'Página no encontrada',
    loadComponent: () => import('./pages/no-encontrado/no-encontrado').then((m) => m.NoEncontrado),
  },
];
