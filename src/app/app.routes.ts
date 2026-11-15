import { Routes } from '@angular/router';

// Cada página se carga de forma diferida (lazy loading) para que la carga inicial sea liviana.
export const routes: Routes = [
  {
    path: '',
    title: 'Zona Safari · Inicio',
    loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'explorar',
    title: 'Zona Safari · Explorar',
    loadComponent: () => import('./pages/explorar/explorar').then((m) => m.Explorar),
  },
  {
    path: 'guia',
    title: 'Zona Safari · Guía de campo',
    loadComponent: () => import('./pages/guia/guia').then((m) => m.Guia),
  },
  {
    path: 'coleccion',
    title: 'Zona Safari · Mi colección',
    loadComponent: () => import('./pages/coleccion/coleccion').then((m) => m.Coleccion),
  },
  {
    path: '**',
    title: 'Zona Safari · Página no encontrada',
    loadComponent: () => import('./pages/no-encontrado/no-encontrado').then((m) => m.NoEncontrado),
  },
];
