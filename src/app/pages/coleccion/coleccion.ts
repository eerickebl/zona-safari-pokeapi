import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Captura, IdBall } from '../../core/models/safari.models';
import { ColeccionService } from '../../core/services/coleccion.service';
import { SafariService } from '../../core/services/safari.service';
import { HABITATS, REGLAS_BALLS } from '../../core/utils/catalogos';
import { formatearFecha, formatearNombre, normalizarBusqueda, numeroPokedex } from '../../core/utils/texto';
import { FichaDetalle } from '../../shared/components/ficha-detalle/ficha-detalle';
import { TipoBadge } from '../../shared/components/tipo-badge/tipo-badge';
import { PorcentajePipe } from '../../shared/pipes/porcentaje.pipe';

type Orden = 'recientes' | 'numero' | 'nombre';

/** Colección de Pokémon capturados con filtros, orden y detalle de cada captura. */
@Component({
  selector: 'app-coleccion',
  imports: [RouterLink, FichaDetalle, TipoBadge, PorcentajePipe],
  templateUrl: './coleccion.html',
  styleUrl: './coleccion.css',
  host: { '(document:keydown.escape)': 'cerrar()' },
})
export class Coleccion {
  protected readonly coleccion = inject(ColeccionService);
  private readonly safari = inject(SafariService);

  protected readonly filtroTexto = signal('');
  protected readonly filtroHabitat = signal('todos');
  protected readonly orden = signal<Orden>('recientes');
  protected readonly seleccionada = signal<Captura | null>(null);
  protected readonly confirmarLiberar = signal(false);
  protected readonly confirmarVaciar = signal(false);

  protected readonly numero = numeroPokedex;

  /** Hábitats presentes en la colección (para el filtro). */
  protected readonly habitats = computed(() =>
    [...new Set(this.coleccion.capturas().map((c) => c.habitat))].map((clave) => ({
      clave,
      nombre: this.etiquetaHabitat(clave),
    })),
  );

  protected readonly visibles = computed(() => {
    const texto = normalizarBusqueda(this.filtroTexto());
    const habitat = this.filtroHabitat();
    const lista = this.coleccion.capturas().filter((c) => {
      const coincideTexto =
        !texto ||
        normalizarBusqueda(c.ficha.nombre).includes(texto) ||
        c.ficha.nombreApi.includes(texto) ||
        String(c.ficha.id) === texto;
      const coincideHabitat = habitat === 'todos' || c.habitat === habitat;
      return coincideTexto && coincideHabitat;
    });
    switch (this.orden()) {
      case 'numero':
        return [...lista].sort((a, b) => a.ficha.id - b.ficha.id);
      case 'nombre':
        return [...lista].sort((a, b) => a.ficha.nombre.localeCompare(b.ficha.nombre, 'es'));
      default:
        return lista; // ya están de la más reciente a la más antigua
    }
  });

  constructor() {
    this.safari.cargarBalls();
  }

  protected cambiarOrden(valor: string): void {
    if (valor === 'recientes' || valor === 'numero' || valor === 'nombre') {
      this.orden.set(valor);
    }
  }

  protected limpiarFiltros(): void {
    this.filtroTexto.set('');
    this.filtroHabitat.set('todos');
  }

  protected abrir(captura: Captura): void {
    this.confirmarLiberar.set(false);
    this.seleccionada.set(captura);
  }

  protected cerrar(): void {
    this.seleccionada.set(null);
    this.confirmarLiberar.set(false);
  }

  protected liberar(captura: Captura): void {
    if (!this.confirmarLiberar()) {
      this.confirmarLiberar.set(true);
      return;
    }
    this.coleccion.liberar(captura.uid);
    this.cerrar();
  }

  protected vaciar(): void {
    if (!this.confirmarVaciar()) {
      this.confirmarVaciar.set(true);
      return;
    }
    this.coleccion.vaciar();
    this.confirmarVaciar.set(false);
    this.limpiarFiltros();
  }

  protected etiquetaHabitat(clave: string): string {
    return HABITATS[clave]?.nombre ?? formatearNombre(clave);
  }

  protected ball(id: IdBall): { nombre: string; sprite: string } {
    const ball = this.safari.balls().find((b) => b.id === id);
    return { nombre: ball?.nombre ?? REGLAS_BALLS[id].respaldo, sprite: ball?.sprite ?? '' };
  }

  protected fecha(iso: string, conHora = false): string {
    return formatearFecha(iso, conHora);
  }
}
