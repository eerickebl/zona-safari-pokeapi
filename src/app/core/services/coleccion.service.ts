import { Injectable, computed, signal } from '@angular/core';

import { Captura } from '../models/safari.models';

const CLAVE = 'zona-safari:coleccion';

// guarda los pokemon atrapados en el localStorage
@Injectable({ providedIn: 'root' })
export class ColeccionService {
  capturas = signal<Captura[]>(this.cargar());

  total = computed(() => this.capturas().length);
  idsCapturados = computed(() => new Set(this.capturas().map((c) => c.ficha.id)));
  especiesUnicas = computed(() => this.idsCapturados().size);
  shinies = computed(() => this.capturas().filter((c) => c.shiny).length);

  agregar(captura: Captura): void {
    this.capturas.update((lista) => [captura, ...lista]);
    this.guardar();
  }

  liberar(uid: string): void {
    this.capturas.update((lista) => lista.filter((c) => c.uid !== uid));
    this.guardar();
  }

  vaciar(): void {
    this.capturas.set([]);
    this.guardar();
  }

  private cargar(): Captura[] {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
      return Array.isArray(datos) ? datos.filter((c) => c && c.ficha) : [];
    } catch {
      return [];
    }
  }

  private guardar(): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(this.capturas()));
    } catch {
      console.log('No se pudo guardar la colección');
    }
  }
}
