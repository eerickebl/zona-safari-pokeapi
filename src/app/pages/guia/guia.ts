import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, catchError, map, of, switchMap } from 'rxjs';

import { FichaPokemon } from '../../core/models/safari.models';
import { PokeApiService } from '../../core/services/poke-api.service';
import { SafariService } from '../../core/services/safari.service';
import { esEspecial, probabilidadCaptura, probabilidadHuida, velocidadDe } from '../../core/utils/captura';
import { HABITATS } from '../../core/utils/catalogos';
import { clasificarError, mensajeDeError } from '../../core/utils/errores';
import { formatearNombre, normalizarBusqueda } from '../../core/utils/texto';
import { Cargando } from '../../shared/components/cargando/cargando';
import { FichaDetalle } from '../../shared/components/ficha-detalle/ficha-detalle';
import { MensajeError } from '../../shared/components/mensaje-error/mensaje-error';
import { PorcentajePipe } from '../../shared/pipes/porcentaje.pipe';

interface ErrorBusqueda {
  titulo: string;
  mensaje: string;
  /** true cuando PokéAPI respondió 404 (no tiene sentido reintentar). */
  noEncontrado: boolean;
}

interface ResultadoBusqueda {
  termino: string;
  ficha: FichaPokemon | null;
  error: unknown;
}

/** Letras (con tildes), números, espacios, guiones, puntos, apóstrofos y ♀/♂. */
const PATRON_BUSQUEDA = /^[\p{L}\p{N}\s.'’:♀♂-]+$/u;

/** Guía de campo: buscador de Pokémon con su ficha y la probabilidad de captura con cada ball. */
@Component({
  selector: 'app-guia',
  imports: [ReactiveFormsModule, RouterLink, Cargando, MensajeError, FichaDetalle, PorcentajePipe],
  templateUrl: './guia.html',
  styleUrl: './guia.css',
})
export class Guia {
  private readonly api = inject(PokeApiService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  protected readonly safari = inject(SafariService);

  /** Query param ?q= con el último término buscado (permite compartir la búsqueda). */
  readonly q = input<string>();

  protected readonly formulario = new FormGroup({
    termino: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(30), Validators.pattern(PATRON_BUSQUEDA)],
    }),
  });

  protected readonly cargando = signal(false);
  protected readonly ficha = signal<FichaPokemon | null>(null);
  protected readonly error = signal<ErrorBusqueda | null>(null);
  protected readonly terminoActual = signal('');

  protected readonly sugerencias = ['pikachu', 'snorlax', 'dratini', 'eevee', 'mewtwo', '143'];

  /** Nombres de todas las especies para el autocompletado (datalist). */
  protected readonly especies = toSignal(
    this.api.listarEspecies().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  /** Probabilidad de captura con cada ball en los tres estados de ánimo. */
  protected readonly filas = computed(() => {
    const ficha = this.ficha();
    if (!ficha) {
      return [];
    }
    return this.safari.balls().map((ball) => ({
      ball,
      tranquilo: probabilidadCaptura(ficha.tasaCaptura, ball.bono, 'tranquilo'),
      enojado: probabilidadCaptura(ficha.tasaCaptura, ball.bono, 'enojado'),
      comiendo: probabilidadCaptura(ficha.tasaCaptura, ball.bono, 'comiendo'),
    }));
  });

  protected readonly mejorBall = computed(() => {
    const filas = this.filas();
    return filas.length ? filas.reduce((mejor, fila) => (fila.tranquilo > mejor.tranquilo ? fila : mejor)).ball.id : null;
  });

  protected readonly huida = computed(() => {
    const ficha = this.ficha();
    if (!ficha) {
      return null;
    }
    const velocidad = velocidadDe(ficha);
    const especial = esEspecial(ficha);
    return {
      tranquilo: probabilidadHuida(velocidad, especial, 'tranquilo'),
      enojado: probabilidadHuida(velocidad, especial, 'enojado'),
      comiendo: probabilidadHuida(velocidad, especial, 'comiendo'),
    };
  });

  private readonly busquedas = new Subject<string>();

  constructor() {
    this.safari.cargarBalls();

    // switchMap cancela la búsqueda anterior si el usuario busca otra cosa antes de recibir respuesta.
    this.busquedas
      .pipe(
        switchMap((termino) => {
          this.cargando.set(true);
          this.error.set(null);
          this.ficha.set(null);
          this.terminoActual.set(termino);
          return this.api.obtenerFicha(termino).pipe(
            map((ficha): ResultadoBusqueda => ({ termino, ficha, error: null })),
            catchError((error: unknown) => of<ResultadoBusqueda>({ termino, ficha: null, error })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ termino, ficha, error }) => {
        this.cargando.set(false);
        if (ficha) {
          this.ficha.set(ficha);
        } else {
          this.error.set(describirError(error, termino));
        }
      });

    // Cada vez que cambia ?q= en la URL se realiza la búsqueda.
    effect(() => {
      const termino = normalizarBusqueda(this.q() ?? '');
      untracked(() => {
        if (termino) {
          this.formulario.setValue({ termino });
          this.busquedas.next(termino);
        } else {
          this.ficha.set(null);
          this.error.set(null);
        }
      });
    });
  }

  protected buscar(): void {
    const control = this.formulario.controls.termino;
    control.markAsTouched();
    const termino = normalizarBusqueda(control.value);
    if (this.formulario.invalid || !termino) {
      return;
    }
    if (termino === this.terminoActual() && termino === normalizarBusqueda(this.q() ?? '')) {
      this.busquedas.next(termino); // misma búsqueda: se vuelve a consultar
      return;
    }
    this.irA(termino);
  }

  protected irA(termino: string): void {
    this.router.navigate([], { relativeTo: this.ruta, queryParams: { q: termino } });
  }

  protected aleatorio(): void {
    // Solo especies de Kanto, Johto y Hoenn (#1–#386), que son las que tienen hábitat.
    this.irA(String(1 + Math.floor(Math.random() * 386)));
  }

  protected reintentar(): void {
    const termino = this.terminoActual();
    if (termino) {
      this.busquedas.next(termino);
    }
  }

  protected terminoInvalido(): boolean {
    const control = this.formulario.controls.termino;
    return control.invalid && (control.touched || control.dirty);
  }

  protected mensajeValidacion(): string {
    const control = this.formulario.controls.termino;
    if (!this.terminoInvalido()) {
      return 'Escribe el nombre en inglés o español (son iguales para la mayoría) o el número de la Pokédex.';
    }
    if (control.hasError('required')) {
      return 'Escribe un nombre o un número para buscar.';
    }
    if (control.hasError('maxlength')) {
      return 'El texto es demasiado largo (máximo 30 caracteres).';
    }
    return 'Usa solo letras, números, espacios o guiones.';
  }

  protected etiquetaHabitat(nombre: string): string {
    return HABITATS[nombre]?.nombre ?? formatearNombre(nombre);
  }
}

function describirError(error: unknown, termino: string): ErrorBusqueda {
  if (clasificarError(error) === 'no-encontrado') {
    return {
      titulo: 'Pokémon no encontrado',
      mensaje: `PokéAPI no tiene ningún Pokémon llamado «${termino}». Revisa la ortografía o usa su número (por ejemplo, 25).`,
      noEncontrado: true,
    };
  }
  return { titulo: 'No se pudo completar la búsqueda', mensaje: mensajeDeError(error), noEncontrado: false };
}
