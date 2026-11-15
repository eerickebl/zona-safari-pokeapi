import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Habitat } from '../../../core/models/safari.models';
import { SafariService } from '../../../core/services/safari.service';
import { velocidadDe } from '../../../core/utils/captura';
import { numeroPokedex } from '../../../core/utils/texto';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { MensajeError } from '../../../shared/components/mensaje-error/mensaje-error';
import { TipoBadge } from '../../../shared/components/tipo-badge/tipo-badge';
import { PorcentajePipe } from '../../../shared/pipes/porcentaje.pipe';

@Component({
  selector: 'app-panel-encuentro',
  imports: [RouterLink, Cargando, MensajeError, TipoBadge, PorcentajePipe],
  templateUrl: './panel-encuentro.html',
  styleUrl: './panel-encuentro.css',
})
export class PanelEncuentro {
  habitat = input.required<Habitat>();

  safari = inject(SafariService);
  numero = numeroPokedex;

  // si el pokemon tiene gif animado se usa ese, si no el sprite normal
  imagen = computed(() => {
    const e = this.safari.encuentro();
    if (!e) {
      return '';
    }
    if (e.shiny) {
      return e.ficha.animadoShiny ?? e.ficha.spriteShiny;
    }
    return e.ficha.animado ?? e.ficha.sprite;
  });

  tieneAnimacion = computed(() => {
    const e = this.safari.encuentro();
    if (!e) {
      return false;
    }
    return e.shiny ? e.ficha.animadoShiny !== null : e.ficha.animado !== null;
  });

  velocidad = computed(() => {
    const e = this.safari.encuentro();
    return e ? velocidadDe(e.ficha) : 0;
  });

  textoAnimo = computed(() => {
    const e = this.safari.encuentro();
    if (!e || e.animo === 'tranquilo') {
      return 'Tranquilo';
    }
    const turnos = e.turnosAnimo === 1 ? '1 turno' : e.turnosAnimo + ' turnos';
    return (e.animo === 'enojado' ? 'Enojado' : 'Comiendo') + ' (' + turnos + ')';
  });

  textoResultado = computed(() => {
    const e = this.safari.encuentro();
    if (!e) {
      return '';
    }
    if (e.resultado === 'capturado') {
      return '¡Atrapaste a ' + e.ficha.nombre + '!';
    }
    if (e.resultado === 'huyo') {
      return e.ficha.nombre + ' huyó.';
    }
    return 'Te alejaste de ' + e.ficha.nombre + '.';
  });

  textoSacudidas = computed(() => {
    const n = this.safari.sacudidas();
    if (n === 0) {
      return 'Lanzando...';
    }
    return n === 1 ? 'Se movió 1 vez...' : 'Se movió ' + n + ' veces...';
  });

  buscar(): void {
    this.safari.explorar(this.habitat());
  }

  seguirBuscando(): void {
    this.safari.continuar();
    this.safari.explorar(this.habitat());
  }

  lanzar(): void {
    this.safari.lanzarBall();
  }

  escucharGrito(url: string): void {
    const audio = new Audio(url);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  }
}
