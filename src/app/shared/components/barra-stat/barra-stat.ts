import { Component, computed, input } from '@angular/core';

/** Barra horizontal para una estadística base (PS, Ataque, Velocidad…). */
@Component({
  selector: 'app-barra-stat',
  templateUrl: './barra-stat.html',
  styleUrl: './barra-stat.css',
})
export class BarraStat {
  readonly nombre = input.required<string>();
  readonly valor = input.required<number>();
  /** Valor que llena la barra completa (pocas estadísticas base superan 200). */
  readonly maximo = input(200);

  protected readonly porcentaje = computed(() =>
    Math.min(100, Math.round((this.valor() / this.maximo()) * 100)),
  );

  protected readonly color = computed(() => {
    const valor = this.valor();
    if (valor >= 100) {
      return '#2f9e5b';
    }
    return valor >= 60 ? '#e2b42a' : '#e0663f';
  });
}
