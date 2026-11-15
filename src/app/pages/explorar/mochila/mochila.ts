import { Component, computed, input, output, signal } from '@angular/core';

import { BallInfo, Estadisticas, Inventario } from '../../../core/models/safari.models';
import { PorcentajePipe } from '../../../shared/pipes/porcentaje.pipe';

/** Inventario de balls (datos de /item), estadísticas y botón para reiniciar la expedición. */
@Component({
  selector: 'app-mochila',
  imports: [PorcentajePipe],
  templateUrl: './mochila.html',
  styleUrl: './mochila.css',
})
export class Mochila {
  readonly balls = input.required<BallInfo[]>();
  readonly inventario = input.required<Inventario>();
  readonly estadisticas = input.required<Estadisticas>();
  readonly error = input<string | null>(null);
  readonly bloqueado = input(false);

  readonly reintentar = output<void>();
  readonly nuevaExpedicion = output<void>();

  /** Primer clic pide confirmación; el segundo reinicia. */
  protected readonly confirmando = signal(false);

  protected readonly total = computed(() =>
    Object.values(this.inventario()).reduce((suma, cantidad) => suma + cantidad, 0),
  );

  protected readonly efectividad = computed(() => {
    const { capturas, lanzamientos } = this.estadisticas();
    return lanzamientos > 0 ? capturas / lanzamientos : 0;
  });

  protected textoPrecio(ball: BallInfo): string {
    if (ball.costo > 0) {
      return `Precio en tienda: ${ball.costo} ₽`;
    }
    return ball.id === 'safari-ball' ? 'Exclusiva de la Zona Safari' : 'PokéAPI no registra su precio';
  }

  protected pedirNuevaExpedicion(): void {
    if (this.confirmando()) {
      this.confirmando.set(false);
      this.nuevaExpedicion.emit();
    } else {
      this.confirmando.set(true);
    }
  }
}
