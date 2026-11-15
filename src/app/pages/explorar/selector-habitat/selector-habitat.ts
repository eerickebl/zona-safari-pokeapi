import { Component, computed, input, output } from '@angular/core';

import { Habitat } from '../../../core/models/safari.models';
import { spriteDesdeId } from '../../../core/utils/mapeadores';

/** Lista de hábitats de /pokemon-habitat con el progreso de capturas de cada uno. */
@Component({
  selector: 'app-selector-habitat',
  templateUrl: './selector-habitat.html',
  styleUrl: './selector-habitat.css',
})
export class SelectorHabitat {
  readonly habitats = input.required<Habitat[]>();
  readonly seleccionado = input<string | null>(null);
  readonly capturados = input<ReadonlySet<number>>(new Set<number>());
  readonly bloqueado = input(false);

  readonly elegir = output<string>();

  protected readonly sprite = spriteDesdeId;

  /** Especies distintas ya capturadas en cada hábitat. */
  protected readonly progresos = computed(() => {
    const capturados = this.capturados();
    return new Map(
      this.habitats().map((h) => [h.nombre, h.especies.filter((e) => capturados.has(e.id)).length]),
    );
  });

  protected porcentaje(capturadas: number, total: number): number {
    return total > 0 ? (capturadas / total) * 100 : 0;
  }
}
