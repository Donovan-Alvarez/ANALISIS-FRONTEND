import { Component, ElementRef, inject, input, model, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelect } from '@angular/material/select';

/** Quita acentos y mayúsculas para comparar texto escrito contra nombres. */
export function normalizarBusqueda(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** true si el texto buscado aparece en alguno de los campos (sin acentos ni mayúsculas). */
export function coincideBusqueda(busqueda: string, ...campos: (string | null | undefined)[]): boolean {
  const texto = normalizarBusqueda(busqueda);
  return !texto || normalizarBusqueda(campos.filter(Boolean).join(' ')).includes(texto);
}

/**
 * Teclas que se reenvían al mat-select: navegar y elegir opciones, cerrar y
 * salir. Todo lo demás (letras, espacio, Inicio/Fin) es para escribir y no
 * debe activar la búsqueda por letra ni la selección del mat-select.
 */
const TECLAS_DEL_SELECT = new Set(['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab', 'PageDown', 'PageUp']);

/**
 * Buscador integrado en el panel de un mat-select, fijo arriba de las opciones.
 * El filtrado lo hace el componente que lo usa (con coincideBusqueda), porque
 * es dueño de la lista de opciones:
 *
 *   <mat-select (openedChange)="buscador.alAbrir($event)">
 *     <app-select-buscador #buscador [(texto)]="busqueda" placeholder="Buscar empleado…" />
 *     @for (e of filtrados(); ...) { <mat-option ...> }
 *     @if (!filtrados().length) { <mat-option disabled>Sin resultados</mat-option> }
 *   </mat-select>
 */
@Component({
  selector: 'app-select-buscador',
  imports: [MatIconModule],
  templateUrl: './select-buscador.html',
  styleUrl: './select-buscador.scss',
})
export class SelectBuscador {
  readonly texto = model('');
  readonly placeholder = input('Buscar…');

  private readonly campo = viewChild.required<ElementRef<HTMLInputElement>>('campo');
  /** El mat-select que contiene a este buscador (el panel no recibe el teclado; el select sí). */
  private readonly select = inject(MatSelect, { optional: true });

  /** Conectar a (openedChange) del mat-select: enfoca al abrir y limpia al cerrar. */
  alAbrir(abierto: boolean): void {
    if (abierto) {
      // El panel termina de montarse después del evento.
      setTimeout(() => this.campo().nativeElement.focus());
    } else {
      this.texto.set('');
    }
  }

  protected escribir(valor: string): void {
    this.texto.set(valor);
    this.activarPrimeraCoincidencia();
  }

  /**
   * Al filtrar cambian las opciones y el mat-select se quedaría apuntando a una
   * que ya no existe: se activa la primera coincidencia, así Enter la elige y
   * las flechas recorren desde ahí. Espera a que la lista se vuelva a pintar.
   */
  private activarPrimeraCoincidencia(): void {
    setTimeout(() => this.select?._keyManager?.setFirstItemActive());
  }

  protected limpiar(): void {
    this.texto.set('');
    this.activarPrimeraCoincidencia();
    this.campo().nativeElement.focus();
  }

  protected alPresionar(evento: KeyboardEvent): void {
    evento.stopPropagation();
    // mat-select escucha el teclado en su propio elemento, no en el panel donde
    // está este buscador: las teclas de navegación se le pasan directamente.
    if (TECLAS_DEL_SELECT.has(evento.key)) {
      this.select?._handleKeydown(evento);
    }
  }
}
