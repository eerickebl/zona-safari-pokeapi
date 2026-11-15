import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ColeccionService } from '../../core/services/coleccion.service';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  coleccion = inject(ColeccionService);

  imagenes = [25, 1, 4, 7].map(
    (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  );
}
