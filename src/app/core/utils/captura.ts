import { EstadoAnimo, FichaPokemon } from '../models/safari.models';

// Formula de captura de los juegos de 3ra generacion
// https://bulbapedia.bulbagarden.net/wiki/Catch_rate
// En la zona safari no se pelea, entonces el pokemon siempre tiene la vida completa.

// la roca duplica la tasa de captura y la huida, el cebo las reduce a la mitad
const MODIFICADOR: Record<EstadoAnimo, number> = {
  tranquilo: 1,
  enojado: 2,
  comiendo: 0.5,
};

export function valorCaptura(tasaCaptura: number, bonoBall: number, animo: EstadoAnimo): number {
  const tasa = Math.min(255, Math.max(1, Math.floor(tasaCaptura * MODIFICADOR[animo])));
  return Math.max(1, Math.floor((tasa * bonoBall) / 3));
}

export function umbralSacudida(a: number): number {
  return Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / a)));
}

export function probabilidadCaptura(tasaCaptura: number, bonoBall: number, animo: EstadoAnimo = 'tranquilo'): number {
  const a = valorCaptura(tasaCaptura, bonoBall, animo);
  if (a >= 255) {
    return 1;
  }
  return Math.pow(umbralSacudida(a) / 65536, 4);
}

export interface ResultadoLanzamiento {
  capturado: boolean;
  sacudidas: number;
}

export function simularLanzamiento(tasaCaptura: number, bonoBall: number, animo: EstadoAnimo): ResultadoLanzamiento {
  const a = valorCaptura(tasaCaptura, bonoBall, animo);
  if (a >= 255) {
    return { capturado: true, sacudidas: 3 };
  }
  const b = umbralSacudida(a);
  // la ball tiene que pasar 4 pruebas para atraparlo
  let sacudidas = 0;
  for (let i = 0; i < 4; i++) {
    if (Math.floor(Math.random() * 65536) >= b) {
      return { capturado: false, sacudidas: Math.min(sacudidas, 3) };
    }
    sacudidas++;
  }
  return { capturado: true, sacudidas: 3 };
}

// mientras mas rapido es el pokemon es mas probable que huya
export function probabilidadHuida(velocidad: number, legendario: boolean, animo: EstadoAnimo): number {
  const base = 0.05 + velocidad / 400 + (legendario ? 0.1 : 0);
  return Math.min(0.9, Math.max(0.02, base * MODIFICADOR[animo]));
}

export function turnosDeAnimo(): number {
  return 1 + Math.floor(Math.random() * 5);
}

export function velocidadDe(ficha: FichaPokemon): number {
  return ficha.stats.find((s) => s.clave === 'speed')?.valor ?? 50;
}

export function esEspecial(ficha: FichaPokemon): boolean {
  return ficha.legendario || ficha.mitico;
}
