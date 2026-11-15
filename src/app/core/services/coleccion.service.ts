import { Injectable, computed, effect, signal } from '@angular/core';

import { Captura } from '../models/safari.models';

const CLAVE_ALMACENAMIENTO = 'zona-safari:coleccion';

/** Pokémon capturados. Se guardan en localStorage para que no se pierdan al recargar. */
@Injectable({ providedIn: 'root' })
export class ColeccionService {
  readonly capturas = signal<Captura[]>(leerCapturas());

  readonly total = computed(() => this.capturas().length);
  readonly idsCapturados = computed(() => new Set(this.capturas().map((c) => c.ficha.id)));
  readonly especiesUnicas = computed(() => this.idsCapturados().size);
  readonly shinies = computed(() => this.capturas().filter((c) => c.shiny).length);

  constructor() {
    // Cada vez que cambia la colección se guarda automáticamente.
    effect(() => guardarCapturas(this.capturas()));
  }

  agregar(captura: Captura): void {
    this.capturas.update((lista) => [captura, ...lista]);
  }

  liberar(uid: string): void {
    this.capturas.update((lista) => lista.filter((c) => c.uid !== uid));
  }

  vaciar(): void {
    this.capturas.set([]);
  }
}

function leerCapturas(): Captura[] {
  try {
    const texto = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    const datos: unknown = texto ? JSON.parse(texto) : [];
    return Array.isArray(datos) ? datos.filter(esCapturaValida) : [];
  } catch {
    return [];
  }
}

function guardarCapturas(capturas: Captura[]): void {
  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(capturas));
  } catch {
    // El navegador no permite guardar (modo privado o almacenamiento lleno): se ignora.
  }
}

function esCapturaValida(dato: unknown): dato is Captura {
  if (typeof dato !== 'object' || dato === null) {
    return false;
  }
  const captura = dato as Partial<Captura>;
  return (
    typeof captura.uid === 'string' &&
    typeof captura.ficha === 'object' &&
    captura.ficha !== null &&
    typeof captura.ficha.id === 'number' &&
    Array.isArray(captura.ficha.tipos)
  );
}
