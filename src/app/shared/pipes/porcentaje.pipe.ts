import { Pipe, PipeTransform } from '@angular/core';

import { formatearPorcentaje } from '../../core/utils/texto';

/** Muestra una probabilidad (0 a 1) como porcentaje en formato de Ecuador: 0.247 → "24,7 %". */
@Pipe({ name: 'porcentaje' })
export class PorcentajePipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? '—' : formatearPorcentaje(valor);
  }
}
