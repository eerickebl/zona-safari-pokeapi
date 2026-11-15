import { IdBall, Inventario } from '../models/safari.models';

/** Nombre en español y colores de cada tipo de Pokémon. */
export const TIPOS: Record<string, { nombre: string; fondo: string; texto: string }> = {
  normal: { nombre: 'Normal', fondo: '#a8a77a', texto: '#1f1f1f' },
  fighting: { nombre: 'Lucha', fondo: '#c22e28', texto: '#ffffff' },
  flying: { nombre: 'Volador', fondo: '#a98ff3', texto: '#1f1f1f' },
  poison: { nombre: 'Veneno', fondo: '#a33ea1', texto: '#ffffff' },
  ground: { nombre: 'Tierra', fondo: '#e2bf65', texto: '#1f1f1f' },
  rock: { nombre: 'Roca', fondo: '#b6a136', texto: '#1f1f1f' },
  bug: { nombre: 'Bicho', fondo: '#a6b91a', texto: '#1f1f1f' },
  ghost: { nombre: 'Fantasma', fondo: '#735797', texto: '#ffffff' },
  steel: { nombre: 'Acero', fondo: '#b7b7ce', texto: '#1f1f1f' },
  fire: { nombre: 'Fuego', fondo: '#ee8130', texto: '#1f1f1f' },
  water: { nombre: 'Agua', fondo: '#6390f0', texto: '#ffffff' },
  grass: { nombre: 'Planta', fondo: '#7ac74c', texto: '#1f1f1f' },
  electric: { nombre: 'Eléctrico', fondo: '#f7d02c', texto: '#1f1f1f' },
  psychic: { nombre: 'Psíquico', fondo: '#f95587', texto: '#1f1f1f' },
  ice: { nombre: 'Hielo', fondo: '#96d9d6', texto: '#1f1f1f' },
  dragon: { nombre: 'Dragón', fondo: '#6f35fc', texto: '#ffffff' },
  dark: { nombre: 'Siniestro', fondo: '#705746', texto: '#ffffff' },
  fairy: { nombre: 'Hada', fondo: '#d685ad', texto: '#1f1f1f' },
};

/** Textos propios para cada hábitat de /pokemon-habitat (la API solo entrega el nombre y las especies). */
export const HABITATS: Record<string, { nombre: string; descripcion: string; icono: string; color: string }> = {
  grassland: {
    nombre: 'Pradera',
    descripcion: 'Hierba alta y campo abierto: el hábitat con más especies.',
    icono: '🌾',
    color: '#7fae45',
  },
  forest: {
    nombre: 'Bosque',
    descripcion: 'Árboles frondosos llenos de Pokémon bicho y planta.',
    icono: '🌲',
    color: '#2f7d4a',
  },
  'waters-edge': {
    nombre: 'Orilla del agua',
    descripcion: 'Ríos, lagos y pantanos con Pokémon anfibios.',
    icono: '🏞️',
    color: '#2f9c8f',
  },
  sea: {
    nombre: 'Mar',
    descripcion: 'Mar abierto y profundidades donde nadan Pokémon acuáticos.',
    icono: '🌊',
    color: '#2b6cb0',
  },
  cave: {
    nombre: 'Cueva',
    descripcion: 'Cuevas oscuras y húmedas, hogar de quienes evitan la luz.',
    icono: '🦇',
    color: '#5a4636',
  },
  mountain: {
    nombre: 'Montaña',
    descripcion: 'Laderas rocosas y cumbres frías para Pokémon resistentes.',
    icono: '⛰️',
    color: '#7a6f60',
  },
  'rough-terrain': {
    nombre: 'Terreno agreste',
    descripcion: 'Volcanes, desiertos y terrenos ásperos.',
    icono: '🌋',
    color: '#a5602d',
  },
  urban: {
    nombre: 'Ciudad',
    descripcion: 'Calles, centrales eléctricas y edificios abandonados.',
    icono: '🏙️',
    color: '#5c6b7a',
  },
  rare: {
    nombre: 'Zona rara',
    descripcion: 'Lugares misteriosos donde aparecen legendarios y míticos.',
    icono: '✨',
    color: '#6b4fa3',
  },
};

/** Orden en que se muestran los hábitats (del más común al más difícil). */
export const ORDEN_HABITATS = Object.keys(HABITATS);

export const STATS: Record<string, string> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'At. Esp.',
  'special-defense': 'Def. Esp.',
  speed: 'Velocidad',
};

export const GENERACIONES: Record<string, string> = {
  'generation-i': 'I · Kanto',
  'generation-ii': 'II · Johto',
  'generation-iii': 'III · Hoenn',
  'generation-iv': 'IV · Sinnoh',
  'generation-v': 'V · Teselia',
  'generation-vi': 'VI · Kalos',
  'generation-vii': 'VII · Alola',
  'generation-viii': 'VIII · Galar',
  'generation-ix': 'IX · Paldea',
};

/**
 * Reglas propias de cada ball: bono de captura y cantidad inicial en la mochila.
 * El nombre, la imagen, la descripción y el precio se obtienen de /item.
 */
export const REGLAS_BALLS: Record<IdBall, { bono: number; inicial: number; respaldo: string }> = {
  'safari-ball': { bono: 1.5, inicial: 10, respaldo: 'Safari Ball' },
  'poke-ball': { bono: 1, inicial: 15, respaldo: 'Poké Ball' },
  'great-ball': { bono: 1.5, inicial: 8, respaldo: 'Super Ball' },
  'ultra-ball': { bono: 2, inicial: 4, respaldo: 'Ultra Ball' },
};

export const ORDEN_BALLS: IdBall[] = ['safari-ball', 'poke-ball', 'great-ball', 'ultra-ball'];

export function inventarioInicial(): Inventario {
  return {
    'safari-ball': REGLAS_BALLS['safari-ball'].inicial,
    'poke-ball': REGLAS_BALLS['poke-ball'].inicial,
    'great-ball': REGLAS_BALLS['great-ball'].inicial,
    'ultra-ball': REGLAS_BALLS['ultra-ball'].inicial,
  };
}

/** Probabilidad de que un encuentro sea shiny (aumentada respecto a los juegos para hacerlo divertido). */
export const PROBABILIDAD_SHINY = 1 / 64;
