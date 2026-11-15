import { Component, input } from '@angular/core';

/** Indicador de carga mientras se espera la respuesta de PokéAPI. */
@Component({
  selector: 'app-cargando',
  templateUrl: './cargando.html',
  styleUrl: './cargando.css',
})
export class Cargando {
  readonly mensaje = input('Cargando…');
}
