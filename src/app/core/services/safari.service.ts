import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

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

// Aqui esta toda la logica del juego. Como es un servicio, la partida no se pierde al cambiar de pagina.
@Injectable({ providedIn: 'root' })
export class SafariService {
  private api = inject(PokeApiService);
  private coleccion = inject(ColeccionService);
  private peticion: Subscription | null = null;
  private ballsCargadas = false;
  private contador = 0;

  balls = signal<BallInfo[]>(ORDEN_BALLS.map((id) => ballDeRespaldo(id)));
  errorBalls = signal<string | null>(null);
  inventario = signal<Inventario>(inventarioInicial());
  ballSeleccionada = signal<IdBall>('safari-ball');

  habitatSeleccionado = signal<string | null>(null);
  encuentro = signal<Encuentro | null>(null);
  buscando = signal(false);
  errorBusqueda = signal<string | null>(null);
  animando = signal(false);
  sacudidas = signal(0);
  bitacora = signal<EntradaBitacora[]>([]);
  estadisticas = signal<Estadisticas>(estadisticasIniciales());

  totalBalls = computed(() => Object.values(this.inventario()).reduce((suma, n) => suma + n, 0));
  sinBalls = computed(() => this.totalBalls() === 0);
  ballActual = computed(
    () => this.balls().find((b) => b.id === this.ballSeleccionada()) ?? ballDeRespaldo(this.ballSeleccionada()),
  );
  encuentroActivo = computed(() => this.encuentro()?.resultado === 'activo');
  puedeActuar = computed(() => this.encuentroActivo() && !this.animando());
  expedicionTerminada = computed(() => this.sinBalls() && !this.encuentroActivo() && !this.animando());

  probabilidadCapturaActual = computed(() => {
    const e = this.encuentro();
    if (!e) {
      return 0;
    }
    return probabilidadCaptura(e.ficha.tasaCaptura, this.ballActual().bono, e.animo);
  });

  probabilidadHuidaActual = computed(() => {
    const e = this.encuentro();
    if (!e) {
      return 0;
    }
    return probabilidadHuida(velocidadDe(e.ficha), esEspecial(e.ficha), e.animo);
  });

  cargarBalls(): void {
    if (this.ballsCargadas && !this.errorBalls()) {
      return;
    }
    this.ballsCargadas = true;
    this.errorBalls.set(null);
    this.api.listarBalls().subscribe({
      next: (balls) => this.balls.set(balls),
      error: (error) => this.errorBalls.set(mensajeDeError(error)),
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

  // elige un pokemon al azar del habitat y lo busca en la api
  explorar(habitat: Habitat): void {
    if (this.buscando() || this.animando() || this.encuentroActivo() || this.sinBalls()) {
      return;
    }
    const especie = habitat.especies[Math.floor(Math.random() * habitat.especies.length)];
    if (!especie) {
      this.errorBusqueda.set('Este hábitat no tiene Pokémon.');
      return;
    }
    this.peticion?.unsubscribe();
    this.encuentro.set(null);
    this.errorBusqueda.set(null);
    this.buscando.set(true);
    this.peticion = this.api.obtenerFicha(especie.id).subscribe({
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
        this.registrar(`Apareció un ${ficha.nombre}${shiny ? ' shiny' : ''}.`, 'info');
        this.buscando.set(false);
      },
      error: (error) => {
        this.errorBusqueda.set(mensajeDeError(error));
        this.buscando.set(false);
      },
    });
  }

  async lanzarBall(): Promise<void> {
    const encuentro = this.encuentro();
    const ball = this.ballActual();
    if (!encuentro || encuentro.resultado !== 'activo' || this.animando()) {
      return;
    }
    if (this.inventario()[ball.id] <= 0) {
      return;
    }

    const tasa = encuentro.ficha.tasaCaptura;
    const probabilidad = probabilidadCaptura(tasa, ball.bono, encuentro.animo);
    const resultado = simularLanzamiento(tasa, ball.bono, encuentro.animo);
    const intentos = encuentro.intentos + 1;

    this.inventario.update((inv) => ({ ...inv, [ball.id]: inv[ball.id] - 1 }));
    this.estadisticas.update((e) => ({ ...e, lanzamientos: e.lanzamientos + 1 }));
    this.encuentro.set({ ...encuentro, intentos });
    this.animando.set(true);
    this.sacudidas.set(0);
    this.registrar(`Lanzaste una ${ball.nombre} (${formatearPorcentaje(probabilidad)}).`, 'info');

    // animacion de la ball moviendose
    await esperar(550);
    for (let i = 1; i <= resultado.sacudidas; i++) {
      this.sacudidas.set(i);
      await esperar(700);
    }

    const actual = this.encuentro();
    if (actual && actual.resultado === 'activo') {
      if (resultado.capturado) {
        this.encuentro.set({ ...actual, resultado: 'capturado' });
        this.estadisticas.update((e) => ({ ...e, capturas: e.capturas + 1 }));
        this.coleccion.agregar({
          uid: Date.now().toString(),
          ficha: actual.ficha,
          shiny: actual.shiny,
          habitat: actual.habitat,
          ball: ball.id,
          intentos,
          probabilidad,
          fecha: new Date().toISOString(),
        });
        this.registrar(`¡Atrapaste a ${actual.ficha.nombre}!`, 'exito');
      } else {
        this.registrar(`${actual.ficha.nombre} se escapó de la ball.`, 'fallo');
        this.terminarTurno();
      }
    }

    this.animando.set(false);
    this.sacudidas.set(0);
    this.cambiarBallSiSeAcabo();
  }

  lanzarRoca(): void {
    this.cambiarAnimo('enojado', 'Lanzaste una roca y se enojó.');
  }

  lanzarCebo(): void {
    this.cambiarAnimo('comiendo', 'Lanzaste un cebo y se puso a comer.');
  }

  huir(): void {
    const encuentro = this.encuentro();
    if (!encuentro || encuentro.resultado !== 'activo' || this.animando()) {
      return;
    }
    this.encuentro.set({ ...encuentro, resultado: 'escapaste' });
    this.registrar(`Te alejaste de ${encuentro.ficha.nombre}.`, 'info');
  }

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
    this.peticion?.unsubscribe();
    this.buscando.set(false);
    this.inventario.set(inventarioInicial());
    this.ballSeleccionada.set('safari-ball');
    this.estadisticas.set(estadisticasIniciales());
    this.encuentro.set(null);
    this.errorBusqueda.set(null);
    this.bitacora.set([]);
  }

  private cambiarAnimo(animo: EstadoAnimo, mensaje: string): void {
    const encuentro = this.encuentro();
    if (!encuentro || encuentro.resultado !== 'activo' || this.animando()) {
      return;
    }
    this.encuentro.set({ ...encuentro, animo, turnosAnimo: turnosDeAnimo() });
    this.registrar(mensaje, 'info');
    this.comprobarHuida();
  }

  // despues de fallar el pokemon puede huir, y si estaba enojado o comiendo se le va pasando
  private terminarTurno(): void {
    if (this.comprobarHuida()) {
      return;
    }
    const encuentro = this.encuentro();
    if (!encuentro || encuentro.animo === 'tranquilo') {
      return;
    }
    const turnos = encuentro.turnosAnimo - 1;
    if (turnos <= 0) {
      this.encuentro.set({ ...encuentro, animo: 'tranquilo', turnosAnimo: 0 });
      this.registrar(`${encuentro.ficha.nombre} se calmó.`, 'info');
    } else {
      this.encuentro.set({ ...encuentro, turnosAnimo: turnos });
    }
  }

  private comprobarHuida(): boolean {
    const encuentro = this.encuentro();
    if (!encuentro || encuentro.resultado !== 'activo') {
      return false;
    }
    const probabilidad = probabilidadHuida(velocidadDe(encuentro.ficha), esEspecial(encuentro.ficha), encuentro.animo);
    if (Math.random() < probabilidad) {
      this.encuentro.set({ ...encuentro, resultado: 'huyo' });
      this.estadisticas.update((e) => ({ ...e, huidas: e.huidas + 1 }));
      this.registrar(`${encuentro.ficha.nombre} huyó.`, 'fallo');
      return true;
    }
    return false;
  }

  private cambiarBallSiSeAcabo(): void {
    const inventario = this.inventario();
    if (inventario[this.ballSeleccionada()] > 0) {
      return;
    }
    const otra = ORDEN_BALLS.find((id) => inventario[id] > 0);
    if (otra) {
      this.ballSeleccionada.set(otra);
    }
  }

  private registrar(texto: string, tipo: EntradaBitacora['tipo']): void {
    this.contador++;
    const entrada: EntradaBitacora = { id: this.contador, texto, tipo };
    this.bitacora.update((lista) => [entrada, ...lista].slice(0, 10));
  }
}

function estadisticasIniciales(): Estadisticas {
  return { encuentros: 0, capturas: 0, huidas: 0, lanzamientos: 0 };
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
