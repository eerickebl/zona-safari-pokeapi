import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ColeccionService } from './core/services/coleccion.service';

/** Componente raíz: cabecera con navegación, contenido de cada página y pie. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly coleccion = inject(ColeccionService);
  protected readonly menuAbierto = signal(false);
  protected readonly anio = new Date().getFullYear();

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }
}
