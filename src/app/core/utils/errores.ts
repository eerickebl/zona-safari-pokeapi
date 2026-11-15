import { HttpErrorResponse } from '@angular/common/http';

export function mensajeDeError(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'No se pudo conectar con PokéAPI. Revisa tu conexión a internet.';
  }
  if (error instanceof HttpErrorResponse && error.status === 404) {
    return 'No se encontró la información en PokéAPI.';
  }
  return 'Ocurrió un error al consultar PokéAPI. Intenta de nuevo.';
}
