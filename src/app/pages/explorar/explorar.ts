import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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

@Component({
  selector: 'app-explorar',
  imports: [Cargando, MensajeError, SelectorHabitat, PanelEncuentro, Mochila],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css',
})
export class Explorar {
  private api = inject(PokeApiService);
  private ruta = inject(ActivatedRoute);
  safari = inject(SafariService);
  coleccion = inject(ColeccionService);

  habitats = signal<Habitat[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  habitatActual = computed(() => this.habitats().find((h) => h.nombre === this.safari.habitatSeleccionado()) ?? null);

  // cuando en la url viene un habitat que no existe, por ejemplo /explorar?habitat=playa
  habitatInexistente = computed(() => {
    const nombre = this.safari.habitatSeleccionado();
    if (!nombre || this.cargando() || this.error()) {
      return null;
    }
    return this.habitats().some((h) => h.nombre === nombre) ? null : nombre;
  });

  bloqueado = computed(() => this.safari.encuentroActivo() || this.safari.animando() || this.safari.buscando());

  constructor() {
    // desde la pokedex se puede llegar con ?habitat=forest
    const habitat = this.ruta.snapshot.queryParamMap.get('habitat');
    if (habitat) {
      this.safari.seleccionarHabitat(habitat);
    }
    this.cargarHabitats();
    this.safari.cargarBalls();
  }

  cargarHabitats(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api.listarHabitats().subscribe({
      next: (habitats) => {
        this.habitats.set(habitats);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  elegirHabitat(nombre: string): void {
    this.safari.seleccionarHabitat(nombre);
    // en el celular la lista es larga, entonces se baja hasta el panel
    if (window.innerWidth < 1000) {
      document.getElementById('panel')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
