import { computed, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

/** A partir de cuántos registros se muestra el paginador. */
export const REGISTROS_POR_PAGINA = 10;

/**
 * Paginación en el cliente sobre una lista ya filtrada.
 *
 * Recibe una función (no la señal) para poder declararse en cualquier orden
 * entre los campos del componente. Solo recorta lo que se ve en la tabla:
 * Imprimir/Exportar siguen usando la lista completa.
 *
 *   protected readonly pag = new Paginacion(() => this.filtrados());
 *   @for (item of pag.pagina(); ...)
 *   @if (pag.visible()) { <mat-paginator ... (page)="pag.cambiar($event)" /> }
 */
export class Paginacion<T> {
  readonly opciones = [REGISTROS_POR_PAGINA, 25, 50];
  readonly tamano = signal(REGISTROS_POR_PAGINA);
  private readonly indiceSolicitado = signal(0);

  constructor(private readonly fuente: () => readonly T[]) {}

  readonly total = computed(() => this.fuente().length);

  /** Si un filtro deja menos páginas, se queda en la última que existe. */
  readonly indice = computed(() => {
    const ultima = Math.max(0, Math.ceil(this.total() / this.tamano()) - 1);
    return Math.min(this.indiceSolicitado(), ultima);
  });

  readonly pagina = computed(() => {
    const inicio = this.indice() * this.tamano();
    return this.fuente().slice(inicio, inicio + this.tamano());
  });

  /** El paginador solo aparece cuando hay más de 10 registros. */
  readonly visible = computed(() => this.total() > REGISTROS_POR_PAGINA);

  cambiar(evento: PageEvent): void {
    this.tamano.set(evento.pageSize);
    this.indiceSolicitado.set(evento.pageIndex);
  }
}
