import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BallInfo, Captura, IdBall } from '../../core/models/safari.models';
import { ColeccionService } from '../../core/services/coleccion.service';
import { SafariService } from '../../core/services/safari.service';
import { HABITATS } from '../../core/utils/catalogos';
import { ballDeRespaldo } from '../../core/utils/mapeadores';
import { formatearFecha, formatearNombre, normalizarBusqueda, numeroPokedex } from '../../core/utils/texto';
import { FichaDetalle } from '../../shared/components/ficha-detalle/ficha-detalle';
import { TipoBadge } from '../../shared/components/tipo-badge/tipo-badge';
import { PorcentajePipe } from '../../shared/pipes/porcentaje.pipe';

@Component({
  selector: 'app-coleccion',
  imports: [RouterLink, FichaDetalle, TipoBadge, PorcentajePipe],
  templateUrl: './coleccion.html',
  styleUrl: './coleccion.css',
  host: { '(document:keydown.escape)': 'cerrar()' },
})
export class Coleccion {
  coleccion = inject(ColeccionService);
  private safari = inject(SafariService);

  texto = signal('');
  habitat = signal('todos');
  orden = signal('recientes');
  seleccionada = signal<Captura | null>(null);
  confirmarLiberar = signal(false);
  confirmarBorrar = signal(false);

  numero = numeroPokedex;
  fecha = formatearFecha;

  // habitats que hay en la coleccion, para el select
  habitats = computed(() => [...new Set(this.coleccion.capturas().map((c) => c.habitat))]);

  visibles = computed(() => {
    const texto = normalizarBusqueda(this.texto());
    let lista = this.coleccion.capturas().filter((c) => {
      const coincideTexto =
        texto === '' || normalizarBusqueda(c.ficha.nombre).includes(texto) || String(c.ficha.id) === texto;
      const coincideHabitat = this.habitat() === 'todos' || c.habitat === this.habitat();
      return coincideTexto && coincideHabitat;
    });

    if (this.orden() === 'numero') {
      lista = [...lista].sort((a, b) => a.ficha.id - b.ficha.id);
    } else if (this.orden() === 'nombre') {
      lista = [...lista].sort((a, b) => a.ficha.nombre.localeCompare(b.ficha.nombre));
    }
    return lista;
  });

  constructor() {
    this.safari.cargarBalls();
  }

  limpiarFiltros(): void {
    this.texto.set('');
    this.habitat.set('todos');
  }

  abrir(captura: Captura): void {
    this.confirmarLiberar.set(false);
    this.seleccionada.set(captura);
  }

  cerrar(): void {
    this.seleccionada.set(null);
    this.confirmarLiberar.set(false);
  }

  liberar(captura: Captura): void {
    if (!this.confirmarLiberar()) {
      this.confirmarLiberar.set(true);
      return;
    }
    this.coleccion.liberar(captura.uid);
    this.cerrar();
  }

  borrarTodo(): void {
    if (!this.confirmarBorrar()) {
      this.confirmarBorrar.set(true);
      return;
    }
    this.coleccion.vaciar();
    this.confirmarBorrar.set(false);
    this.limpiarFiltros();
  }

  nombreHabitat(nombre: string): string {
    return HABITATS[nombre]?.nombre ?? formatearNombre(nombre);
  }

  ball(id: IdBall): BallInfo {
    return this.safari.balls().find((b) => b.id === id) ?? ballDeRespaldo(id);
  }
}
