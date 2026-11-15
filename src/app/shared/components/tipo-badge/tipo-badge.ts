import { Component, computed, input } from '@angular/core';

import { TIPOS } from '../../../core/utils/catalogos';
import { formatearNombre } from '../../../core/utils/texto';

@Component({
  selector: 'app-tipo-badge',
  templateUrl: './tipo-badge.html',
  styleUrl: './tipo-badge.css',
})
export class TipoBadge {
  tipo = input.required<string>();

  info = computed(() => TIPOS[this.tipo()] ?? { nombre: formatearNombre(this.tipo()), fondo: '#777777', texto: '#ffffff' });
}
