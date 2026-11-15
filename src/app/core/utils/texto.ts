import { NombreLocalizado } from '../models/pokeapi.models';

// .../pokemon-species/25/ -> 25
export function idDesdeUrl(url: string): number {
  const partes = url.split('/').filter((p) => p !== '');
  return Number(partes[partes.length - 1]) || 0;
}

export function limpiarTexto(texto: string): string {
  return texto.replace(/­\n/g, '').replace(/­/g, '').replace(/\s+/g, ' ').trim();
}

// mr-mime -> Mr Mime
export function formatearNombre(nombre: string): string {
  return nombre
    .split('-')
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ');
}

export function nombreEnEspanol(nombres: NombreLocalizado[], respaldo: string): string {
  const espanol = nombres.find((n) => n.language.name === 'es');
  return espanol ? espanol.name : formatearNombre(respaldo);
}

export function ultimoEnEspanol<T extends { language: { name: string } }>(lista: T[]): T | undefined {
  const enEspanol = lista.filter((e) => e.language.name === 'es');
  return enEspanol[enEspanol.length - 1];
}

export function numeroPokedex(id: number): string {
  return '#' + String(id).padStart(3, '0');
}

// convierte lo que escribe el usuario al formato de la api: "Mr. Mime" -> "mr-mime", "025" -> "25"
export function normalizarBusqueda(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.':]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^0+(?=\d)/, '');
}

// 0.247 -> "24,7%"
export function formatearPorcentaje(valor: number): string {
  const porcentaje = Math.round(valor * 1000) / 10;
  return String(porcentaje).replace('.', ',') + '%';
}

export function formatearDecimal(valor: number): string {
  return String(valor).replace('.', ',');
}

export function formatearFecha(iso: string, conHora = false): string {
  const fecha = new Date(iso);
  return conHora ? fecha.toLocaleString('es-EC') : fecha.toLocaleDateString('es-EC');
}
