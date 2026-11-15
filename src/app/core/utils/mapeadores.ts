import { EspecieApi, HabitatApi, ItemApi, PokemonApi } from '../models/pokeapi.models';
import { BallInfo, FichaPokemon, Habitat, IdBall } from '../models/safari.models';
import { HABITATS, ORDEN_HABITATS, REGLAS_BALLS, STATS } from './catalogos';
import {
  formatearNombre,
  idDesdeUrl,
  limpiarTexto,
  nombreEnEspanol,
  ultimoEnEspanol,
} from './texto';

/** /pokemon-habitat/{nombre} → Habitat */
export function aHabitat(api: HabitatApi): Habitat {
  const info = HABITATS[api.name];
  return {
    nombre: api.name,
    etiqueta: info?.nombre ?? nombreEnEspanol(api.names, api.name),
    descripcion: info?.descripcion ?? '',
    icono: info?.icono ?? '📍',
    color: info?.color ?? '#2f7d4a',
    especies: api.pokemon_species
      .map((especie) => ({ id: idDesdeUrl(especie.url), nombre: especie.name }))
      .sort((a, b) => a.id - b.id),
  };
}

export function ordenarHabitats(habitats: Habitat[]): Habitat[] {
  const posicion = (nombre: string) => {
    const indice = ORDEN_HABITATS.indexOf(nombre);
    return indice === -1 ? ORDEN_HABITATS.length : indice;
  };
  return [...habitats].sort((a, b) => posicion(a.nombre) - posicion(b.nombre));
}

/** /pokemon-species/{id} + /pokemon/{id} → FichaPokemon */
export function aFicha(especie: EspecieApi, pokemon: PokemonApi): FichaPokemon {
  const otros = pokemon.sprites.other;
  const arte = otros?.['official-artwork'];
  const animado = otros?.showdown;
  const descripcion = ultimoEnEspanol(especie.flavor_text_entries);
  const categoria = ultimoEnEspanol(especie.genera);

  return {
    id: especie.id,
    nombreApi: especie.name,
    nombre: nombreEnEspanol(especie.names, especie.name),
    categoria: categoria?.genus ?? 'Pokémon',
    descripcion: descripcion ? limpiarTexto(descripcion.flavor_text) : 'Sin descripción en español.',
    tipos: [...pokemon.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    stats: pokemon.stats.map((s) => ({
      clave: s.stat.name,
      nombre: STATS[s.stat.name] ?? formatearNombre(s.stat.name),
      valor: s.base_stat,
    })),
    tasaCaptura: especie.capture_rate,
    habitat: especie.habitat?.name ?? null,
    generacion: especie.generation.name,
    legendario: especie.is_legendary,
    mitico: especie.is_mythical,
    altura: pokemon.height / 10,
    peso: pokemon.weight / 10,
    sprite: pokemon.sprites.front_default ?? arte?.front_default ?? '',
    spriteShiny: pokemon.sprites.front_shiny ?? pokemon.sprites.front_default ?? '',
    artwork: arte?.front_default ?? pokemon.sprites.front_default ?? '',
    artworkShiny: arte?.front_shiny ?? arte?.front_default ?? pokemon.sprites.front_shiny ?? '',
    animado: animado?.front_default ?? null,
    animadoShiny: animado?.front_shiny ?? null,
    grito: pokemon.cries?.latest ?? pokemon.cries?.legacy ?? null,
  };
}

/** /item/{nombre} → BallInfo (con el bono definido en REGLAS_BALLS). */
export function aBall(id: IdBall, api: ItemApi): BallInfo {
  const descripcion = ultimoEnEspanol(api.flavor_text_entries);
  return {
    id,
    nombre: nombreEnEspanol(api.names, REGLAS_BALLS[id].respaldo),
    descripcion: descripcion ? limpiarTexto(descripcion.text) : '',
    sprite: api.sprites.default ?? '',
    costo: precioDeCompra(api),
    bono: REGLAS_BALLS[id].bono,
  };
}

/** Versiones principales más recientes cuyo precio se prefiere mostrar. */
const VERSIONES_PRECIO = ['scarlet-violet', 'sword-shield'];

/** Precio de compra de un objeto según "prices" (0 si PokéAPI no lo registra). */
function precioDeCompra(api: ItemApi): number {
  const precios = (api.prices ?? []).filter((p) => p.purchase_price > 0);
  for (const version of VERSIONES_PRECIO) {
    const precio = precios.find((p) => p.version_group.name === version);
    if (precio) {
      return precio.purchase_price;
    }
  }
  return precios.at(-1)?.purchase_price ?? api.cost ?? 0;
}

/** Datos mínimos de una ball si /item no responde (la lógica sigue funcionando). */
export function ballDeRespaldo(id: IdBall): BallInfo {
  return {
    id,
    nombre: REGLAS_BALLS[id].respaldo,
    descripcion: '',
    sprite: '',
    costo: 0,
    bono: REGLAS_BALLS[id].bono,
  };
}

/** Imagen pequeña de un Pokémon a partir de su id (repositorio oficial de sprites de PokéAPI). */
export function spriteDesdeId(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}
