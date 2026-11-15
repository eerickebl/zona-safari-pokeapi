import { EspecieApi, HabitatApi, ItemApi, PokemonApi } from '../models/pokeapi.models';
import { BallInfo, FichaPokemon, Habitat, IdBall } from '../models/safari.models';
import { HABITATS, ORDEN_HABITATS, REGLAS_BALLS, STATS } from './catalogos';
import { formatearNombre, idDesdeUrl, limpiarTexto, nombreEnEspanol, ultimoEnEspanol } from './texto';

// Funciones para pasar las respuestas de la api a los modelos de la app

export function aHabitat(api: HabitatApi): Habitat {
  const datos = HABITATS[api.name];
  return {
    nombre: api.name,
    etiqueta: datos ? datos.nombre : nombreEnEspanol(api.names, api.name),
    color: datos ? datos.color : '#2f7d4a',
    especies: api.pokemon_species
      .map((especie) => ({ id: idDesdeUrl(especie.url), nombre: especie.name }))
      .sort((a, b) => a.id - b.id),
  };
}

export function ordenarHabitats(habitats: Habitat[]): Habitat[] {
  return [...habitats].sort((a, b) => ORDEN_HABITATS.indexOf(a.nombre) - ORDEN_HABITATS.indexOf(b.nombre));
}

export function aFicha(especie: EspecieApi, pokemon: PokemonApi): FichaPokemon {
  const arte = pokemon.sprites.other?.['official-artwork'];
  const animado = pokemon.sprites.other?.showdown;
  const descripcion = ultimoEnEspanol(especie.flavor_text_entries);
  const categoria = ultimoEnEspanol(especie.genera);

  return {
    id: especie.id,
    nombreApi: especie.name,
    nombre: nombreEnEspanol(especie.names, especie.name),
    categoria: categoria ? categoria.genus : 'Pokémon',
    descripcion: descripcion ? limpiarTexto(descripcion.flavor_text) : 'Sin descripción.',
    tipos: [...pokemon.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    stats: pokemon.stats.map((s) => ({
      clave: s.stat.name,
      nombre: STATS[s.stat.name] ?? formatearNombre(s.stat.name),
      valor: s.base_stat,
    })),
    tasaCaptura: especie.capture_rate,
    habitat: especie.habitat ? especie.habitat.name : null,
    generacion: especie.generation.name,
    legendario: especie.is_legendary,
    mitico: especie.is_mythical,
    altura: pokemon.height / 10,
    peso: pokemon.weight / 10,
    sprite: pokemon.sprites.front_default ?? '',
    spriteShiny: pokemon.sprites.front_shiny ?? pokemon.sprites.front_default ?? '',
    artwork: arte?.front_default ?? pokemon.sprites.front_default ?? '',
    artworkShiny: arte?.front_shiny ?? arte?.front_default ?? '',
    animado: animado?.front_default ?? null,
    animadoShiny: animado?.front_shiny ?? null,
    grito: pokemon.cries?.latest ?? pokemon.cries?.legacy ?? null,
  };
}

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

// se usa el precio de Escarlata/Purpura y si no hay, el ultimo que tenga la api
function precioDeCompra(api: ItemApi): number {
  const precios = (api.prices ?? []).filter((p) => p.purchase_price > 0);
  const escarlata = precios.find((p) => p.version_group.name === 'scarlet-violet');
  if (escarlata) {
    return escarlata.purchase_price;
  }
  return precios.length > 0 ? precios[precios.length - 1].purchase_price : 0;
}

// si /item falla se usan estos datos para que el juego siga funcionando
export function ballDeRespaldo(id: IdBall): BallInfo {
  return {
    id,
    nombre: REGLAS_BALLS[id].respaldo,
    descripcion: '',
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${id}.png`,
    costo: 0,
    bono: REGLAS_BALLS[id].bono,
  };
}

export function spriteDesdeId(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}
