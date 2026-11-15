import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, finalize } from 'rxjs';

import {
  BallInfo,
  EntradaBitacora,
  Encuentro,
  EstadoAnimo,
  Estadisticas,
  Habitat,
  IdBall,
  Inventario,
} from '../models/safari.models';
import {
  esEspecial,
  probabilidadCaptura,
  probabilidadHuida,
  simularLanzamiento,
  turnosDeAnimo,
  velocidadDe,
} from '../utils/captura';
import { ORDEN_BALLS, PROBABILIDAD_SHINY, inventarioInicial } from '../utils/catalogos';
import { mensajeDeError } from '../utils/errores';
import { ballDeRespaldo } from '../utils/mapeadores';
import { formatearPorcentaje } from '../utils/texto';
import { ColeccionService } from './coleccion.service';
import { PokeApiService } from './poke-api.service';

/**
 * Estado y reglas de la expedición en la Zona Safari.
 * Es un servicio raíz, así que la expedición se conserva al cambiar de página.
 */
@Injectable({ providedIn: 'root' })
export class SafariService {
  private readonly api = inject(PokeApiService);
  private readonly coleccion = inject(ColeccionService);
  private busqueda: Subscription | null = null;
  private ballsSolicitadas = false;
  private contadorBitacora = 0;

  // ---- Balls (/item) y mochila ----
  readonly balls = signal<BallInfo[]>(ORDEN_BALLS.map(ballDeRespaldo));
  readonly cargandoBalls = signal(false);
  readonly errorBalls = signal<string | null>(null);
  readonly inventario = signal<Inventario>(inventarioInicial());
  readonly ballSeleccionada = signal<IdBall>('safari-ball');

  // ---- Exploración ----
  readonly habitatSeleccionado = signal<string | null>(null);
  readonly encuentro = signal<Encuentro | null>(null);
  readonly buscando = signal(false);
  readonly errorBusqueda = signal<string | null>(null);
  readonly animando = signal(false);
  readonly sacudidas = signal(0);
  readonly bitacora = signal<EntradaBitacora[]>([]);
  readonly estadisticas = signal<Estadisticas>(estadisticasIniciales());

  // ---- Valores derivados ----
  readonly totalBalls = computed(() =>
    Object.values(this.inventario()).reduce((suma, cantidad) => suma + cantidad, 0),
  );
  readonly sinBalls = computed(() => this.totalBalls() === 0);
  readonly ballActual = computed(
    () =>
      this.balls().find((b) => b.id === this.ballSeleccionada()) ??
      ballDeRespaldo(this.ballSeleccionada()),
  );
  readonly encuentroActivo = computed(() => this.encuentro()?.resultado === 'activo');
  readonly puedeActuar = computed(() => this.encuentroActivo() && !this.animando());
  readonly expedicionTerminada = computed(
    () => this.sinBalls() && !this.encuentroActivo() && !this.animando(),
  );
  readonly probabilidadCapturaActual = computed(() => {
    const encuentro = this.encuentro();
    return encuentro
      ? probabilidadCaptura(encuentro.ficha.tasaCaptura, this.ballActual().bono, encuentro.animo)
      : 0;
  });
  readonly probabilidadHuidaActual = computed(() => {
    const encuentro = this.encuentro();
    return encuentro
      ? probabilidadHuida(velocidadDe(encuentro.ficha), esEspecial(encuentro.ficha), encuentro.animo)
      : 0;
  });

  /** Carga nombre, imagen, descripción y precio de las balls desde /item (una sola vez). */
  cargarBalls(): void {
    if (this.ballsSolicitadas && !this.errorBalls()) {
      return;
    }
    this.ballsSolicitadas = true;
    this.cargandoBalls.set(true);
    this.errorBalls.set(null);
    this.api
      .listarBalls()
      .pipe(finalize(() => this.cargandoBalls.set(false)))
      .subscribe({
        next: (balls) => this.balls.set(balls),
        error: (error: unknown) => this.errorBalls.set(mensajeDeError(error)),
      });
  }

  seleccionarBall(id: IdBall): void {
    this.ballSeleccionada.set(id);
  }

  seleccionarHabitat(nombre: string): void {
    if (this.encuentroActivo() || this.animando() || this.buscando()) {
      return;
    }
    if (this.habitatSeleccionado() !== nombre) {
      this.habitatSeleccionado.set(nombre);
      this.encuentro.set(null);
      this.errorBusqueda.set(null);
    }
  }

  /** Elige una especie al azar del hábitat y consulta su ficha en PokéAPI. */
  explorar(habitat: Habitat): void {
    if (this.buscando() || this.animando() || this.encuentroActivo() || this.sinBalls()) {
      return;
    }
    const especie = habitat.especies[Math.floor(Math.random() * habitat.especies.length)];
    if (!especie) {
      this.errorBusqueda.set('Este hábitat no tiene Pokémon registrados.');
      return;
    }
    this.busqueda?.unsubscribe();
    this.encuentro.set(null);
    this.errorBusqueda.set(null);
    this.buscando.set(true);
    this.busqueda = this.api
      .obtenerFicha(especie.id)
      .pipe(finalize(() => this.buscando.set(false)))
      .subscribe({
        next: (ficha) => {
          const shiny = Math.random() < PROBABILIDAD_SHINY;
          this.encuentro.set({
            ficha,
            shiny,
            habitat: habitat.nombre,
            animo: 'tranquilo',
            turnosAnimo: 0,
            intentos: 0,
            resultado: 'activo',
          });
          this.estadisticas.update((e) => ({ ...e, encuentros: e.encuentros + 1 }));
          this.registrar(`¡Un ${ficha.nombre}${shiny ? ' shiny ✨' : ''} salvaje apareció!`, 'info');
        },
        error: (error: unknown) => this.errorBusqueda.set(mensajeDeError(error)),
      });
  }

  /** Lanza la ball seleccionada y anima las sacudidas antes de mostrar el resultado. */
  async lanzarBall(): Promise<void> {
    const encuentro = this.encuentro();
    const ball = this.ballActual();
    if (!encuentro || encuentro.resultado !== 'activo' || this.animando()) {
      return;
    }
    if (this.inventario()[ball.id] <= 0) {
      this.registrar(`No te quedan unidades de ${ball.nombre}.`, 'fallo');
      return;
    }

    const { tasaCaptura } = encuentro.ficha;
    const probabilidad = probabilidadCaptura(tasaCaptura, ball.bono, encuentro.animo);
    const resultado = simularLanzamiento(tasaCaptura, ball.bono, encuentro.animo);
    const intentos = encuentro.intentos + 1;

    this.inventario.update((inv) => ({ ...inv, [ball.id]: inv[ball.id] - 1 }));
    this.estadisticas.update((e) => ({ ...e, lanzamientos: e.lanzamientos + 1 }));
    this.encuentro.set({ ...encuentro, intentos });
    this.animando.set(true);
    this.sacudidas.set(0);
    this.registrar(`Lanzaste una ${ball.nombre} (${formatearPorcentaje(probabilidad)} de éxito).`, 'info');

    await esperar(550);
    for (let sacudida = 1; sacudida <= resultado.sacudidas; sacudida++) {
      this.sacudidas.set(sacudida);
      await esperar(700);
    }

    const actual = this.encuentro();
    if (actual && actual.resultado === 'activo') {
      if (resultado.capturado) {
        this.encuentro.set({ ...actual, resultado: 'capturado' });
        this.estadisticas.update((e) => ({ ...e, capturas: e.capturas + 1 }));
        this.coleccion.agregar({
          uid: crearUid(),
          ficha: actual.ficha,
          shiny: actual.shiny,
          habitat: actual.habitat,
          ball: ball.id,
          intentos,
          probabilidad,
          fecha: new Date().toISOString(),
        });
        this.registrar(`¡Atrapaste a ${actual.ficha.nombre}! Se guardó en tu colección.`, 'exito');
      } else {
        this.registrar(mensajeEscape(actual.ficha.nombre, resultado.sacudidas), 'fallo');
        this.terminarTurno();
      }
    }

    this.animando.set(false);
    this.sacudidas.set(0);
    this.asegurarBallDisponible();
  }

  /** Roca: tasa de captura ×2 pero huida ×2 durante 1–5 turnos. */
  lanzarRoca(): void {
    this.cambiarAnimo(
      'enojado',
      (nombre) => `Lanzaste una roca: ${nombre} se enojó. Será más fácil atraparlo, pero puede huir.`,
    );
  }

  /** Cebo: tasa de captura ×0,5 pero huida ×0,5 durante 1–5 turnos. */
  lanzarCebo(): void {
    this.cambiarAnimo(
      'comiendo',
      (nombre) => `Lanzaste un cebo: ${nombre} está comiendo. Huirá menos, pero costará más atraparlo.`,
    );
  }

  huir(): void {
    const encuentro = this.encuentro();
    if (!encuentro || encuentro.resultado !== 'activo' || this.animando()) {
      return;
    }
    this.encuentro.set({ ...encuentro, resultado: 'escapaste' });
    this.registrar(`Te alejaste de ${encuentro.ficha.nombre}.`, 'info');
  }

  /** Cierra el encuentro terminado para buscar otro Pokémon. */
  continuar(): void {
    if (this.encuentroActivo() || this.animando()) {
      return;
    }
    this.encuentro.set(null);
    this.errorBusqueda.set(null);
  }

  nuevaExpedicion(): void {
    if (this.animando()) {
      return;
    }
    this.busqueda?.unsubscribe();
    this.buscando.set(false);
    this.inventario.set(inventarioInicial());
    this.ballSeleccionada.set('safari-ball');
    this.estadisticas.set(estadisticasIniciales());
    this.encuentro.set(null);
    this.errorBusqueda.set(null);
    this.bitacora.set([]);
    this.registrar('Comenzó una nueva expedición: tu mochila está llena.', 'info');
  }

  private cambiarAnimo(animo: EstadoAnimo, mensaje: (nombre: string) => string): void {
    const encuentro = this.encuentro();
    if (!encuentro || encuentro.resultado !== 'activo' || this.animando()) {
      return;
    }
    this.encuentro.set({ ...encuentro, animo, turnosAnimo: turnosDeAnimo() });
    this.registrar(mensaje(encuentro.ficha.nombre), 'info');
    this.comprobarHuida();
  }

  /** Tras un lanzamiento fallido: el Pokémon puede huir y su ánimo se va calmando. */
  private terminarTurno(): void {
    if (this.comprobarHuida()) {
      return;
    }
    const encuentro = this.encuentro();
    if (!encuentro || encuentro.animo === 'tranquilo') {
      return;
    }
    const restantes = encuentro.turnosAnimo - 1;
    if (restantes <= 0) {
      this.encuentro.set({ ...encuentro, animo: 'tranquilo', turnosAnimo: 0 });
      this.registrar(`${encuentro.ficha.nombre} volvió a estar tranquilo.`, 'info');
    } else {
      this.encuentro.set({ ...encuentro, turnosAnimo: restantes });
    }
  }

  /** Devuelve true si el Pokémon huyó. */
  private comprobarHuida(): boolean {
    const encuentro = this.encuentro();
    if (!encuentro || encuentro.resultado !== 'activo') {
      return false;
    }
    const probabilidad = probabilidadHuida(
      velocidadDe(encuentro.ficha),
      esEspecial(encuentro.ficha),
      encuentro.animo,
    );
    if (Math.random() < probabilidad) {
      this.encuentro.set({ ...encuentro, resultado: 'huyo' });
      this.estadisticas.update((e) => ({ ...e, huidas: e.huidas + 1 }));
      this.registrar(`¡${encuentro.ficha.nombre} huyó!`, 'fallo');
      return true;
    }
    return false;
  }

  /** Si se acabó la ball elegida, selecciona automáticamente otra que tenga unidades. */
  private asegurarBallDisponible(): void {
    const inventario = this.inventario();
    if (inventario[this.ballSeleccionada()] > 0) {
      return;
    }
    const disponible = ORDEN_BALLS.find((id) => inventario[id] > 0);
    if (disponible) {
      this.ballSeleccionada.set(disponible);
    }
  }

  private registrar(texto: string, tipo: EntradaBitacora['tipo']): void {
    this.contadorBitacora++;
    const entrada: EntradaBitacora = { id: this.contadorBitacora, texto, tipo };
    this.bitacora.update((lista) => [entrada, ...lista].slice(0, 12));
  }
}

function estadisticasIniciales(): Estadisticas {
  return { encuentros: 0, capturas: 0, huidas: 0, lanzamientos: 0 };
}

function esperar(milisegundos: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, milisegundos));
}

function crearUid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function mensajeEscape(nombre: string, sacudidas: number): string {
  switch (sacudidas) {
    case 0:
      return `¡Oh, no! ${nombre} se liberó al instante.`;
    case 1:
      return `¡Vaya! ${nombre} escapó después de una sacudida.`;
    case 2:
      return `¡Casi! ${nombre} escapó tras dos sacudidas.`;
    default:
      return `¡Uf! ¡${nombre} estuvo a punto de quedarse!`;
  }
}
