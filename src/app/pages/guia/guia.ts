import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { FichaPokemon } from '../../core/models/safari.models';
import { PokeApiService } from '../../core/services/poke-api.service';
import { SafariService } from '../../core/services/safari.service';
import { esEspecial, probabilidadCaptura, probabilidadHuida, velocidadDe } from '../../core/utils/captura';
import { HABITATS } from '../../core/utils/catalogos';
import { mensajeDeError } from '../../core/utils/errores';
import { formatearNombre, normalizarBusqueda } from '../../core/utils/texto';
import { Cargando } from '../../shared/components/cargando/cargando';
import { FichaDetalle } from '../../shared/components/ficha-detalle/ficha-detalle';
import { MensajeError } from '../../shared/components/mensaje-error/mensaje-error';
import { PorcentajePipe } from '../../shared/pipes/porcentaje.pipe';

@Component({
  selector: 'app-guia',
  imports: [ReactiveFormsModule, RouterLink, Cargando, MensajeError, FichaDetalle, PorcentajePipe],
  templateUrl: './guia.html',
  styleUrl: './guia.css',
})
export class Guia {
  private api = inject(PokeApiService);
  private peticion: Subscription | null = null;
  safari = inject(SafariService);

  formulario = new FormGroup({
    termino: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ .':♀♂-]+$/),
      ],
    }),
  });

  cargando = signal(false);
  ficha = signal<FichaPokemon | null>(null);
  error = signal('');
  noEncontrado = signal(false);
  ultimaBusqueda = signal('');

  // probabilidad con cada ball: normal, con roca y con cebo
  filas = computed(() => {
    const ficha = this.ficha();
    if (!ficha) {
      return [];
    }
    return this.safari.balls().map((ball) => ({
      ball,
      normal: probabilidadCaptura(ficha.tasaCaptura, ball.bono, 'tranquilo'),
      roca: probabilidadCaptura(ficha.tasaCaptura, ball.bono, 'enojado'),
      cebo: probabilidadCaptura(ficha.tasaCaptura, ball.bono, 'comiendo'),
    }));
  });

  huida = computed(() => {
    const ficha = this.ficha();
    return ficha ? probabilidadHuida(velocidadDe(ficha), esEspecial(ficha), 'tranquilo') : 0;
  });

  constructor() {
    this.safari.cargarBalls();
  }

  buscar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return;
    }
    const termino = normalizarBusqueda(this.formulario.controls.termino.value);
    if (termino) {
      this.consultar(termino);
    }
  }

  aleatorio(): void {
    // hasta el 386 porque solo esos tienen habitat en la api
    const id = String(Math.floor(Math.random() * 386) + 1);
    this.formulario.setValue({ termino: id });
    this.consultar(id);
  }

  reintentar(): void {
    this.consultar(this.ultimaBusqueda());
  }

  nombreHabitat(nombre: string): string {
    return HABITATS[nombre]?.nombre ?? formatearNombre(nombre);
  }

  private consultar(termino: string): void {
    this.peticion?.unsubscribe();
    this.ultimaBusqueda.set(termino);
    this.cargando.set(true);
    this.ficha.set(null);
    this.error.set('');
    this.noEncontrado.set(false);

    this.peticion = this.api.obtenerFicha(termino).subscribe({
      next: (ficha) => {
        this.ficha.set(ficha);
        this.cargando.set(false);
      },
      error: (error) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.noEncontrado.set(true);
        } else {
          this.error.set(mensajeDeError(error));
        }
        this.cargando.set(false);
      },
    });
  }
}
