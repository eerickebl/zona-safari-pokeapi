import { Component, computed, input, output, signal } from '@angular/core';

import { BallInfo, Estadisticas, Inventario } from '../../../core/models/safari.models';
import { PorcentajePipe } from '../../../shared/pipes/porcentaje.pipe';

@Component({
  selector: 'app-mochila',
  imports: [PorcentajePipe],
  templateUrl: './mochila.html',
  styleUrl: './mochila.css',
})
export class Mochila {
  balls = input.required<BallInfo[]>();
  inventario = input.required<Inventario>();
  estadisticas = input.required<Estadisticas>();
  error = input<string | null>(null);
  bloqueado = input(false);

  reintentar = output<void>();
  reiniciar = output<void>();

  confirmando = signal(false);

  total = computed(() => Object.values(this.inventario()).reduce((suma, n) => suma + n, 0));

  efectividad = computed(() => {
    const e = this.estadisticas();
    return e.lanzamientos > 0 ? e.capturas / e.lanzamientos : 0;
  });

  precio(ball: BallInfo): string {
    if (ball.costo > 0) {
      return 'Precio: ' + ball.costo;
    }
    return ball.id === 'safari-ball' ? 'Solo en la Zona Safari' : 'Sin precio';
  }

  // la primera vez pide confirmar y la segunda reinicia
  clicReiniciar(): void {
    if (this.confirmando()) {
      this.confirmando.set(false);
      this.reiniciar.emit();
    } else {
      this.confirmando.set(true);
    }
  }
}
