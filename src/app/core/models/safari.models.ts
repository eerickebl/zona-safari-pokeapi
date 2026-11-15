export type IdBall = 'safari-ball' | 'poke-ball' | 'great-ball' | 'ultra-ball';

export type EstadoAnimo = 'tranquilo' | 'enojado' | 'comiendo';

export type ResultadoEncuentro = 'activo' | 'capturado' | 'huyo' | 'escapaste';

export interface EspecieRef {
  id: number;
  nombre: string;
}

export interface Habitat {
  nombre: string;
  etiqueta: string;
  color: string;
  especies: EspecieRef[];
}

export interface StatPokemon {
  clave: string;
  nombre: string;
  valor: number;
}

export interface FichaPokemon {
  id: number;
  nombreApi: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  tipos: string[];
  stats: StatPokemon[];
  tasaCaptura: number;
  habitat: string | null;
  generacion: string;
  legendario: boolean;
  mitico: boolean;
  altura: number;
  peso: number;
  sprite: string;
  spriteShiny: string;
  artwork: string;
  artworkShiny: string;
  animado: string | null;
  animadoShiny: string | null;
  grito: string | null;
}

export interface BallInfo {
  id: IdBall;
  nombre: string;
  descripcion: string;
  sprite: string;
  costo: number;
  bono: number;
}

export type Inventario = Record<IdBall, number>;

export interface Encuentro {
  ficha: FichaPokemon;
  shiny: boolean;
  habitat: string;
  animo: EstadoAnimo;
  turnosAnimo: number;
  intentos: number;
  resultado: ResultadoEncuentro;
}

export interface Captura {
  uid: string;
  ficha: FichaPokemon;
  shiny: boolean;
  habitat: string;
  ball: IdBall;
  intentos: number;
  probabilidad: number;
  fecha: string;
}

export interface EntradaBitacora {
  id: number;
  texto: string;
  tipo: 'info' | 'exito' | 'fallo';
}

export interface Estadisticas {
  encuentros: number;
  capturas: number;
  huidas: number;
  lanzamientos: number;
}
