import { EstadoAnimo, FichaPokemon } from '../models/safari.models';

/**
 * Reglas de captura y huida de la Zona Safari (lógica propia de la aplicación).
 *
 * PokéAPI solo entrega los datos (tasa de captura de /pokemon-species, PS y velocidad de /pokemon);
 * las reglas se basan en la fórmula de captura de la 3.ª y 4.ª generación de los juegos:
 *
 *   a = ((3·PSmáx − 2·PSactual) · tasa · bonoBall) / (3·PSmáx)
 *   b = 1048560 / √(√(16711680 / a))
 *   P(captura) = (b / 65536)^4        (la ball debe superar 4 comprobaciones)
 *
 * En la Zona Safari no se combate, así que el Pokémon siempre está con los PS completos
 * y el primer factor vale 1/3. Lanzar una roca o un cebo cambia su ánimo durante 1–5 turnos.
 */

/** Efecto del ánimo sobre la tasa de captura. */
export const MODIFICADOR_CAPTURA: Record<EstadoAnimo, number> = {
  tranquilo: 1,
  enojado: 2,
  comiendo: 0.5,
};

/** Efecto del ánimo sobre la probabilidad de huida. */
export const MODIFICADOR_HUIDA: Record<EstadoAnimo, number> = {
  tranquilo: 1,
  enojado: 2,
  comiendo: 0.5,
};

/** Valor "a" de la fórmula con el Pokémon a PS completos. */
export function valorCaptura(tasaCaptura: number, bonoBall: number, animo: EstadoAnimo): number {
  const tasa = Math.min(255, Math.max(1, Math.floor(tasaCaptura * MODIFICADOR_CAPTURA[animo])));
  return Math.max(1, Math.floor((tasa * bonoBall) / 3));
}

/** Umbral "b" que debe superar cada una de las 4 comprobaciones de la ball. */
export function umbralSacudida(a: number): number {
  return Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / a)));
}

export function probabilidadCaptura(
  tasaCaptura: number,
  bonoBall: number,
  animo: EstadoAnimo = 'tranquilo',
): number {
  const a = valorCaptura(tasaCaptura, bonoBall, animo);
  if (a >= 255) {
    return 1;
  }
  return Math.pow(umbralSacudida(a) / 65536, 4);
}

export interface ResultadoLanzamiento {
  capturado: boolean;
  /** Veces que se movió la ball antes de abrirse (0 a 3). */
  sacudidas: number;
}

/** Simula un lanzamiento: 4 comprobaciones aleatorias contra el umbral "b". */
export function simularLanzamiento(
  tasaCaptura: number,
  bonoBall: number,
  animo: EstadoAnimo,
  aleatorio: () => number = Math.random,
): ResultadoLanzamiento {
  const a = valorCaptura(tasaCaptura, bonoBall, animo);
  if (a >= 255) {
    return { capturado: true, sacudidas: 3 };
  }
  const b = umbralSacudida(a);
  let superadas = 0;
  for (let comprobacion = 0; comprobacion < 4; comprobacion++) {
    if (Math.floor(aleatorio() * 65536) >= b) {
      return { capturado: false, sacudidas: Math.min(superadas, 3) };
    }
    superadas++;
  }
  return { capturado: true, sacudidas: 3 };
}

/**
 * Regla propia de huida por turno: depende de la velocidad base del Pokémon,
 * es mayor para legendarios/míticos y cambia con el ánimo (roca ×2, cebo ×0,5).
 */
export function probabilidadHuida(velocidad: number, legendario: boolean, animo: EstadoAnimo): number {
  const base = 0.05 + velocidad / 400 + (legendario ? 0.1 : 0);
  return Math.min(0.9, Math.max(0.02, base * MODIFICADOR_HUIDA[animo]));
}

/** El enojo o la distracción por el cebo duran entre 1 y 5 turnos. */
export function turnosDeAnimo(aleatorio: () => number = Math.random): number {
  return 1 + Math.floor(aleatorio() * 5);
}

export function velocidadDe(ficha: FichaPokemon): number {
  return ficha.stats.find((s) => s.clave === 'speed')?.valor ?? 50;
}

export function esEspecial(ficha: FichaPokemon): boolean {
  return ficha.legendario || ficha.mitico;
}
