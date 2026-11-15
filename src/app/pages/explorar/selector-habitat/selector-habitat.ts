import { Component, input, output } from '@angular/core';

import { Habitat } from '../../../core/models/safari.models';
import { spriteDesdeId } from '../../../core/utils/mapeadores';

@Component({
  selector: 'app-selector-habitat',
  templateUrl: './selector-habitat.html',
  styleUrl: './selector-habitat.css',
})
export class SelectorHabitat {
  habitats = input.required<Habitat[]>();
  seleccionado = input<string | null>(null);
  capturados = input<Set<number>>(new Set());
  bloqueado = input(false);

  elegir = output<string>();

  sprite = spriteDesdeId;

  // cuantas especies del habitat ya estan en la coleccion
  capturadas(habitat: Habitat): number {
    return habitat.especies.filter((e) => this.capturados().has(e.id)).length;
  }

  porcentaje(habitat: Habitat): number {
    if (habitat.especies.length === 0) {
      return 0;
    }
    return (this.capturadas(habitat) / habitat.especies.length) * 100;
  }
}
