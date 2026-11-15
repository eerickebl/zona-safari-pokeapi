import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';

import { EspecieApi, HabitatApi, ItemApi, ListaApi, PokemonApi } from '../models/pokeapi.models';
import { BallInfo, FichaPokemon, Habitat } from '../models/safari.models';
import { ORDEN_BALLS } from '../utils/catalogos';
import { aBall, aFicha, aHabitat, ordenarHabitats } from '../utils/mapeadores';
import { idDesdeUrl } from '../utils/texto';

@Injectable({ providedIn: 'root' })
export class PokeApiService {
  private http = inject(HttpClient);
  private url = 'https://pokeapi.co/api/v2';

  // primero trae la lista de habitats y despues el detalle de cada uno
  listarHabitats(): Observable<Habitat[]> {
    return this.http.get<ListaApi>(`${this.url}/pokemon-habitat`).pipe(
      switchMap((lista) => forkJoin(lista.results.map((h) => this.obtenerHabitat(h.name)))),
      map((habitats) => ordenarHabitats(habitats)),
    );
  }

  obtenerHabitat(nombre: string): Observable<Habitat> {
    return this.http.get<HabitatApi>(`${this.url}/pokemon-habitat/${nombre}`).pipe(map(aHabitat));
  }

  // junta los datos de /pokemon-species y /pokemon
  obtenerFicha(idONombre: string | number): Observable<FichaPokemon> {
    return this.http.get<EspecieApi>(`${this.url}/pokemon-species/${idONombre}`).pipe(
      switchMap((especie) => {
        const variedad = especie.varieties.find((v) => v.is_default) ?? especie.varieties[0];
        const id = variedad ? idDesdeUrl(variedad.pokemon.url) : especie.id;
        return this.http
          .get<PokemonApi>(`${this.url}/pokemon/${id}`)
          .pipe(map((pokemon) => aFicha(especie, pokemon)));
      }),
    );
  }

  listarBalls(): Observable<BallInfo[]> {
    return forkJoin(
      ORDEN_BALLS.map((id) => this.http.get<ItemApi>(`${this.url}/item/${id}`).pipe(map((item) => aBall(id, item)))),
    );
  }
}
