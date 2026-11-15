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

/** Escena del encuentro: aparición, lanzamientos con animación, resultado y bitácora. */
@Component({
  selector: 'app-panel-encuentro',
  imports: [RouterLink, Cargando, MensajeError, TipoBadge, PorcentajePipe],
  templateUrl: './panel-encuentro.html',
  styleUrl: './panel-encuentro.css',
})
export class PanelEncuentro {
  readonly habitat = input.required<Habitat>();

  protected readonly safari = inject(SafariService);
  protected readonly numero = numeroPokedex;

  /** Imagen animada (si existe) o sprite normal; versión shiny cuando corresponde. */
  protected readonly imagen = computed(() => {
    const encuentro = this.safari.encuentro();
    if (!encuentro) {
      return '';
    }
    const { ficha, shiny } = encuentro;
    return shiny ? (ficha.animadoShiny ?? ficha.spriteShiny) : (ficha.animado ?? ficha.sprite);
  });

  protected readonly esPixelArt = computed(() => {
    const encuentro = this.safari.encuentro();
    if (!encuentro) {
      return false;
    }
    return encuentro.shiny ? !encuentro.ficha.animadoShiny : !encuentro.ficha.animado;
  });

  protected readonly velocidad = computed(() => {
    const encuentro = this.safari.encuentro();
    return encuentro ? velocidadDe(encuentro.ficha) : 0;
  });

  protected readonly textoAnimo = computed(() => {
    const encuentro = this.safari.encuentro();
    if (!encuentro) {
      return '';
    }
    const turnos = `${encuentro.turnosAnimo} ${encuentro.turnosAnimo === 1 ? 'turno' : 'turnos'}`;
    switch (encuentro.animo) {
      case 'enojado':
        return `😠 Enojado · ${turnos}`;
      case 'comiendo':
        return `😋 Comiendo · ${turnos}`;
      default:
        return '😐 Tranquilo';
    }
  });

  protected readonly tituloResultado = computed(() => {
    const encuentro = this.safari.encuentro();
    if (!encuentro) {
      return '';
    }
    const nombre = encuentro.ficha.nombre;
    switch (encuentro.resultado) {
      case 'capturado':
        return `¡Atrapaste a ${nombre}! 🎉`;
      case 'huyo':
        return `${nombre} huyó…`;
      case 'escapaste':
        return `Te alejaste de ${nombre}.`;
      default:
        return '';
    }
  });

  protected explorar(): void {
    this.safari.explorar(this.habitat());
  }

  protected seguirExplorando(): void {
    this.safari.continuar();
    this.safari.explorar(this.habitat());
  }

  protected lanzar(): void {
    void this.safari.lanzarBall();
  }

  protected reproducirGrito(url: string | null): void {
    if (!url) {
      return;
    }
    const audio = new Audio(url);
    audio.volume = 0.35;
    audio.play().catch(() => undefined);
  }
}
