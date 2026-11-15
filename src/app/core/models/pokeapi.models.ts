// Datos que se usan de cada endpoint de PokéAPI (https://pokeapi.co/docs/v2)

export interface RecursoApi {
  name: string;
  url: string;
}

export interface ListaApi {
  count: number;
  next: string | null;
  previous: string | null;
  results: RecursoApi[];
}

export interface NombreLocalizado {
  name: string;
  language: RecursoApi;
}

export interface HabitatApi {
  id: number;
  name: string;
  names: NombreLocalizado[];
  pokemon_species: RecursoApi[];
}

export interface EspecieApi {
  id: number;
  name: string;
  capture_rate: number;
  is_legendary: boolean;
  is_mythical: boolean;
  habitat: RecursoApi | null;
  generation: RecursoApi;
  names: NombreLocalizado[];
  genera: { genus: string; language: RecursoApi }[];
  flavor_text_entries: { flavor_text: string; language: RecursoApi; version: RecursoApi }[];
  varieties: { is_default: boolean; pokemon: RecursoApi }[];
}

export interface ImagenesApi {
  front_default: string | null;
  front_shiny: string | null;
}

export interface PokemonApi {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: RecursoApi }[];
  stats: { base_stat: number; stat: RecursoApi }[];
  sprites: ImagenesApi & {
    other?: {
      'official-artwork'?: ImagenesApi;
      showdown?: ImagenesApi;
    };
  };
  cries?: { latest: string | null; legacy: string | null };
}

export interface ItemApi {
  id: number;
  name: string;
  prices?: { purchase_price: number; sell_price: number; version_group: RecursoApi }[];
  sprites: { default: string | null };
  names: NombreLocalizado[];
  flavor_text_entries: { text: string; language: RecursoApi; version_group: RecursoApi }[];
}
