import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-barra-stat',
  templateUrl: './barra-stat.html',
  styleUrl: './barra-stat.css',
})
export class BarraStat {
  nombre = input.required<string>();
  valor = input.required<number>();
  maximo = input(200);

  porcentaje = computed(() => Math.min(100, Math.round((this.valor() / this.maximo()) * 100)));

  color = computed(() => {
    if (this.valor() >= 100) {
      return '#2f9e5b';
    }
    return this.valor() >= 60 ? '#e2b42a' : '#e0663f';
  });
}
