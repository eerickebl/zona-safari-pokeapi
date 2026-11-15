import { Location } from '@angular/common';
import { Component, DestroyRef, ElementRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { Habitat } from '../../core/models/safari.models';
import { ColeccionService } from '../../core/services/coleccion.service';
import { PokeApiService } from '../../core/services/poke-api.service';
import { SafariService } from '../../core/services/safari.service';
import { mensajeDeError } from '../../core/utils/errores';
import { Cargando } from '../../shared/components/cargando/cargando';
import { MensajeError } from '../../shared/components/mensaje-error/mensaje-error';
import { Mochila } from './mochila/mochila';
import { PanelEncuentro } from './panel-encuentro/panel-encuentro';
import { SelectorHabitat } from './selector-habitat/selector-habitat';

/** Página principal del juego: hábitats (izquierda), encuentro y mochila. */
@Component({
  selector: 'app-explorar',
  imports: [Cargando, MensajeError, SelectorHabitat, PanelEncuentro, Mochila],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css',
})
export class Explorar {
  private readonly api = inject(PokeApiService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly safari = inject(SafariService);
  protected readonly coleccion = inject(ColeccionService);

  /** Query param opcional: /explorar?habitat=forest */
  readonly habitat = input<string>();

  protected readonly habitats = signal<Habitat[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly habitatActual = computed(
    () => this.habitats().find((h) => h.nombre === this.safari.habitatSeleccionado()) ?? null,
  );

  /** Nombre del hábitat pedido en la URL que no existe en PokéAPI (resultado inexistente). */
  protected readonly habitatInexistente = computed(() => {
    const seleccionado = this.safari.habitatSeleccionado();
    if (!seleccionado || this.cargando() || this.error()) {
      return null;
    }
    return this.habitats().some((h) => h.nombre === seleccionado) ? null : seleccionado;
  });

  protected readonly bloqueado = computed(
    () => this.safari.encuentroActivo() || this.safari.animando() || this.safari.buscando(),
  );

  constructor() {
    this.cargarHabitats();
    this.safari.cargarBalls();

    // Si la URL trae ?habitat=..., se selecciona ese hábitat.
    effect(() => {
      const desdeUrl = this.habitat();
      if (desdeUrl) {
        untracked(() => this.safari.seleccionarHabitat(desdeUrl));
      }
    });
  }

  protected cargarHabitats(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api
      .listarHabitats()
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (habitats) => this.habitats.set(habitats),
        error: (error: unknown) => this.error.set(mensajeDeError(error)),
      });
  }

  protected elegirHabitat(nombre: string): void {
    this.safari.seleccionarHabitat(nombre);
    // Se actualiza la URL (?habitat=...) sin volver a navegar, para no perder la posición del scroll.
    const url = this.router.createUrlTree([], { relativeTo: this.ruta, queryParams: { habitat: nombre } });
    this.location.replaceState(this.router.serializeUrl(url));
    // En pantallas pequeñas se baja hasta el panel del encuentro.
    if (window.matchMedia('(max-width: 999px)').matches) {
      this.panel()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
