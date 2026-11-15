import { Component, computed, input } from '@angular/core';

import { TIPOS } from '../../../core/utils/catalogos';
import { formatearNombre } from '../../../core/utils/texto';

/** Etiqueta de color con el nombre del tipo en español (Fuego, Agua, Planta…). */
@Component({
  selector: 'app-tipo-badge',
  templateUrl: './tipo-badge.html',
  styleUrl: './tipo-badge.css',
})
export class TipoBadge {
  readonly tipo = input.required<string>();

  protected readonly info = computed(
    () =>
      TIPOS[this.tipo()] ?? { nombre: formatearNombre(this.tipo()), fondo: '#777777', texto: '#ffffff' },
  );
}
