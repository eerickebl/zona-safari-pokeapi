import { HttpErrorResponse } from '@angular/common/http';

export type TipoError = 'no-encontrado' | 'sin-conexion' | 'servidor' | 'desconocido';

export function clasificarError(error: unknown): TipoError {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 404) {
      return 'no-encontrado';
    }
    if (error.status === 0) {
      return 'sin-conexion';
    }
    if (error.status >= 500) {
      return 'servidor';
    }
  }
  return 'desconocido';
}

/** Mensaje amigable para errores de red o del servidor. */
export function mensajeDeError(error: unknown): string {
  switch (clasificarError(error)) {
    case 'sin-conexion':
      return 'No se pudo conectar con PokéAPI. Revisa tu conexión a internet e inténtalo de nuevo.';
    case 'servidor':
      return 'PokéAPI no está respondiendo en este momento. Inténtalo de nuevo en unos segundos.';
    case 'no-encontrado':
      return 'PokéAPI no encontró el recurso solicitado.';
    default: {
      const codigo = error instanceof HttpErrorResponse ? ` (código ${error.status})` : '';
      return `Ocurrió un error inesperado al consultar PokéAPI${codigo}.`;
    }
  }
}
