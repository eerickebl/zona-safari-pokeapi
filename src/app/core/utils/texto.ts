import { NombreLocalizado } from '../models/pokeapi.models';

const IDIOMA = 'es';

/** Extrae el id numérico de una URL de PokéAPI, por ejemplo .../pokemon-species/25/ → 25. */
export function idDesdeUrl(url: string): number {
  const coincidencia = /\/(\d+)\/?$/.exec(url);
  return coincidencia ? Number(coincidencia[1]) : 0;
}

/** Quita saltos de línea, guiones suaves y espacios repetidos de los textos de PokéAPI. */
export function limpiarTexto(texto: string): string {
  return texto
    .replace(/­\n/g, '')
    .replace(/­/g, '')
    .replace(/[\f\n\r\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** 'mr-mime' → 'Mr Mime' (se usa cuando la API no trae el nombre en español). */
export function formatearNombre(nombreApi: string): string {
  return nombreApi
    .split('-')
    .filter((parte) => parte.length > 0)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ');
}

export function nombreEnEspanol(nombres: NombreLocalizado[], respaldo: string): string {
  return nombres.find((n) => n.language.name === IDIOMA)?.name ?? formatearNombre(respaldo);
}

/** Devuelve la entrada en español más reciente (las últimas son de los juegos más nuevos). */
export function ultimoEnEspanol<T extends { language: { name: string } }>(entradas: T[]): T | undefined {
  return [...entradas].reverse().find((e) => e.language.name === IDIOMA);
}

export function numeroPokedex(id: number): string {
  return `#${String(id).padStart(3, '0')}`;
}

const formatoPorcentaje = new Intl.NumberFormat('es-EC', { style: 'percent', maximumFractionDigits: 1 });
const formatoDecimal = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 1 });
const formatoFecha = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
const formatoFechaHora = new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' });

/** 0.247 → "24,7 %". Valores muy pequeños se muestran como "< 0,1 %". */
export function formatearPorcentaje(valor: number): string {
  if (valor > 0 && valor < 0.001) {
    return '< 0,1 %';
  }
  return formatoPorcentaje.format(valor);
}

export function formatearDecimal(valor: number): string {
  return formatoDecimal.format(valor);
}

export function formatearFecha(iso: string, conHora = false): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  return conHora ? formatoFechaHora.format(fecha) : formatoFecha.format(fecha);
}

/**
 * Convierte lo que escribe el usuario al formato de nombres de PokéAPI:
 * "Mr. Mime" → "mr-mime", "Nidoran♀" → "nidoran-f", "Farfetch'd" → "farfetchd", "025" → "25".
 */
export function normalizarBusqueda(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.'’:]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^0+(?=\d)/, '');
}
