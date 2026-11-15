import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { ColeccionService } from '../../core/services/coleccion.service';
import { PokeApiService } from '../../core/services/poke-api.service';

interface EndpointUsado {
  ruta: string;
  ejemplo: string;
  uso: string;
}

/** Página de inicio: presentación, progreso del jugador, reglas y endpoints usados. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  private readonly api = inject(PokeApiService);
  protected readonly coleccion = inject(ColeccionService);

  /** Total de especies que viven en la Zona Safari (suma de las especies de cada hábitat). */
  protected readonly totalEspecies = toSignal(
    this.api.listarHabitats().pipe(
      map((habitats) => habitats.reduce((total, h) => total + h.especies.length, 0)),
      catchError(() => of(null)),
    ),
    { initialValue: null },
  );

  protected readonly progreso = computed(() => {
    const total = this.totalEspecies();
    return total ? Math.min(100, (this.coleccion.especiesUnicas() / total) * 100) : 0;
  });

  /** Ilustraciones decorativas de la portada (imágenes oficiales del repositorio de PokéAPI). */
  protected readonly portada = [25, 1, 133, 7].map(
    (id) =>
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  );

  protected readonly endpoints: EndpointUsado[] = [
    {
      ruta: '/pokemon-habitat',
      ejemplo: '/pokemon-habitat/forest',
      uso: 'Lista los 9 hábitats y las especies que viven en cada uno; de ahí sale el Pokémon que aparece al explorar.',
    },
    {
      ruta: '/pokemon-species',
      ejemplo: '/pokemon-species/25',
      uso: 'Tasa de captura (base de la probabilidad), nombre, categoría y descripción en español, legendario/mítico y hábitat.',
    },
    {
      ruta: '/pokemon',
      ejemplo: '/pokemon/25',
      uso: 'Imágenes normales y shiny, tipos, estadísticas (la velocidad decide la huida) y el grito del Pokémon.',
    },
    {
      ruta: '/item',
      ejemplo: '/item/ultra-ball',
      uso: 'Nombre, imagen, descripción y precio de la Safari Ball, Poké Ball, Super Ball y Ultra Ball de tu mochila.',
    },
  ];
}
