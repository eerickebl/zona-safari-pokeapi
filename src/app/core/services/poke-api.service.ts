import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, shareReplay, switchMap, throwError } from 'rxjs';

import { EspecieApi, HabitatApi, ItemApi, ListaApi, PokemonApi } from '../models/pokeapi.models';
import { BallInfo, EspecieRef, FichaPokemon, Habitat } from '../models/safari.models';
import { ORDEN_BALLS } from '../utils/catalogos';
import { aBall, aFicha, aHabitat, ordenarHabitats } from '../utils/mapeadores';
import { idDesdeUrl } from '../utils/texto';

/**
 * Único punto de acceso a PokéAPI. Endpoints utilizados:
 *  - /pokemon-habitat   → hábitats y especies que viven en cada uno.
 *  - /pokemon-species   → tasa de captura, nombre/descripción en español, legendario, hábitat.
 *  - /pokemon           → imágenes, tipos, estadísticas (PS y velocidad) y grito.
 *  - /item              → nombre, imagen, descripción y precio de cada ball.
 */
@Injectable({ providedIn: 'root' })
export class PokeApiService {
  private readonly http = inject(HttpClient);
  private readonly base = 'https://pokeapi.co/api/v2';
  private readonly cache = new Map<string, Observable<unknown>>();

  /** GET con caché en memoria. Si la petición falla se borra de la caché para poder reintentar. */
  private obtener<T>(ruta: string): Observable<T> {
    const url = `${this.base}/${ruta}`;
    const enCache = this.cache.get(url) as Observable<T> | undefined;
    if (enCache) {
      return enCache;
    }
    const peticion = this.http.get<T>(url).pipe(
      catchError((error: unknown) => {
        this.cache.delete(url);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.cache.set(url, peticion);
    return peticion;
  }

  /** Lista de hábitats con sus especies (1 petición de listado + 1 por hábitat). */
  listarHabitats(): Observable<Habitat[]> {
    return this.obtener<ListaApi>('pokemon-habitat').pipe(
      switchMap((lista) => forkJoin(lista.results.map((h) => this.obtenerHabitat(h.name)))),
      map(ordenarHabitats),
    );
  }

  obtenerHabitat(nombre: string): Observable<Habitat> {
    return this.obtener<HabitatApi>(`pokemon-habitat/${nombre}`).pipe(map(aHabitat));
  }

  /** Combina /pokemon-species/{x} con /pokemon/{variedad por defecto}. */
  obtenerFicha(idONombre: string | number): Observable<FichaPokemon> {
    return this.obtener<EspecieApi>(`pokemon-species/${idONombre}`).pipe(
      switchMap((especie) => {
        const variedad = especie.varieties.find((v) => v.is_default) ?? especie.varieties[0];
        const idPokemon = variedad ? idDesdeUrl(variedad.pokemon.url) : especie.id;
        return this.obtener<PokemonApi>(`pokemon/${idPokemon}`).pipe(
          map((pokemon) => aFicha(especie, pokemon)),
        );
      }),
    );
  }

  /** Nombres de todas las especies (para el autocompletado de la Guía de campo). */
  listarEspecies(): Observable<EspecieRef[]> {
    return this.obtener<ListaApi>('pokemon-species?limit=2000').pipe(
      map((lista) => lista.results.map((r) => ({ id: idDesdeUrl(r.url), nombre: r.name }))),
    );
  }

  /** Datos de las balls que se usan en la Zona Safari. */
  listarBalls(): Observable<BallInfo[]> {
    return forkJoin(
      ORDEN_BALLS.map((id) => this.obtener<ItemApi>(`item/${id}`).pipe(map((item) => aBall(id, item)))),
    );
  }
}
