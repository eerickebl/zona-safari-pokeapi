import { Component, input, output } from '@angular/core';

/** Aviso de error o de resultado inexistente, con botón opcional para reintentar. */
@Component({
  selector: 'app-mensaje-error',
  templateUrl: './mensaje-error.html',
  styleUrl: './mensaje-error.css',
})
export class MensajeError {
  readonly titulo = input('Algo salió mal');
  readonly mensaje = input.required<string>();
  readonly textoBoton = input('Reintentar');
  readonly conBoton = input(true);
  readonly icono = input('⚠️');

  readonly reintentar = output<void>();
}
