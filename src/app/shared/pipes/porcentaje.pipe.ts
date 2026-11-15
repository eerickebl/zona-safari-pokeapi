import { Pipe, PipeTransform } from '@angular/core';

import { formatearPorcentaje } from '../../core/utils/texto';

@Pipe({ name: 'porcentaje' })
export class PorcentajePipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '-';
    }
    return formatearPorcentaje(valor);
  }
}
