import { Component, computed, input } from '@angular/core';

import { FichaPokemon } from '../../../core/models/safari.models';
import { GENERACIONES, HABITATS } from '../../../core/utils/catalogos';
import { formatearDecimal, formatearNombre, numeroPokedex } from '../../../core/utils/texto';
import { BarraStat } from '../barra-stat/barra-stat';
import { TipoBadge } from '../tipo-badge/tipo-badge';

/** Ficha completa de un Pokémon (datos de /pokemon-species y /pokemon). */
@Component({
  selector: 'app-ficha-detalle',
  imports: [TipoBadge, BarraStat],
  templateUrl: './ficha-detalle.html',
  styleUrl: './ficha-detalle.css',
})
export class FichaDetalle {
  readonly ficha = input.required<FichaPokemon>();
  readonly shiny = input(false);

  protected readonly numero = computed(() => numeroPokedex(this.ficha().id));
  protected readonly imagen = computed(() =>
    this.shiny() ? this.ficha().artworkShiny : this.ficha().artwork,
  );
  protected readonly altura = computed(() => `${formatearDecimal(this.ficha().altura)} m`);
  protected readonly peso = computed(() => `${formatearDecimal(this.ficha().peso)} kg`);
  protected readonly generacion = computed(
    () => GENERACIONES[this.ficha().generacion] ?? formatearNombre(this.ficha().generacion),
  );
  protected readonly habitat = computed(() => {
    const habitat = this.ficha().habitat;
    return habitat ? (HABITATS[habitat]?.nombre ?? formatearNombre(habitat)) : 'Sin registro';
  });
  protected readonly totalStats = computed(() =>
    this.ficha().stats.reduce((suma, stat) => suma + stat.valor, 0),
  );

  protected reproducirGrito(): void {
    const url = this.ficha().grito;
    if (!url) {
      return;
    }
    const audio = new Audio(url);
    audio.volume = 0.35;
    audio.play().catch(() => undefined);
  }
}
