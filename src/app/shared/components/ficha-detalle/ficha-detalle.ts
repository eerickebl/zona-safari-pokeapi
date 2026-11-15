import { Component, computed, input } from '@angular/core';

import { FichaPokemon } from '../../../core/models/safari.models';
import { GENERACIONES, HABITATS } from '../../../core/utils/catalogos';
import { formatearDecimal, formatearNombre, numeroPokedex } from '../../../core/utils/texto';
import { BarraStat } from '../barra-stat/barra-stat';
import { TipoBadge } from '../tipo-badge/tipo-badge';

@Component({
  selector: 'app-ficha-detalle',
  imports: [TipoBadge, BarraStat],
  templateUrl: './ficha-detalle.html',
  styleUrl: './ficha-detalle.css',
})
export class FichaDetalle {
  ficha = input.required<FichaPokemon>();
  shiny = input(false);

  numero = computed(() => numeroPokedex(this.ficha().id));
  imagen = computed(() => (this.shiny() ? this.ficha().artworkShiny : this.ficha().artwork));
  altura = computed(() => formatearDecimal(this.ficha().altura) + ' m');
  peso = computed(() => formatearDecimal(this.ficha().peso) + ' kg');
  generacion = computed(() => GENERACIONES[this.ficha().generacion] ?? formatearNombre(this.ficha().generacion));
  habitat = computed(() => {
    const habitat = this.ficha().habitat;
    if (!habitat) {
      return 'No tiene';
    }
    return HABITATS[habitat]?.nombre ?? formatearNombre(habitat);
  });
  totalStats = computed(() => this.ficha().stats.reduce((suma, stat) => suma + stat.valor, 0));

  escucharGrito(): void {
    const url = this.ficha().grito;
    if (url) {
      const audio = new Audio(url);
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
  }
}
