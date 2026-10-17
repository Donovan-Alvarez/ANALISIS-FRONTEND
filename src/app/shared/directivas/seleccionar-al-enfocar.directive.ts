import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Selecciona todo el contenido del input al enfocarlo. Se difiere un instante
 * porque al enfocar con clic el navegador coloca el cursor en el mouseup y
 * deshace una selección hecha en el mismo evento focus.
 */
export function seleccionarTodo(input: HTMLInputElement): void {
  setTimeout(() => {
    if (document.activeElement === input) input.select();
  });
}

/**
 * Para campos numéricos: al entrar al campo el valor queda seleccionado y lo
 * que se escriba lo reemplaza (no hay que borrar el 0 o el valor anterior).
 *   <input matInput type="number" appSeleccionarAlEnfocar ... />
 * Los campos de dinero (appMoneda) ya lo hacen por su cuenta.
 */
@Directive({
  selector: 'input[appSeleccionarAlEnfocar]',
  host: { '(focus)': 'alEnfocar()' },
})
export class SeleccionarAlEnfocarDirective {
  private readonly elemento = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  protected alEnfocar(): void {
    seleccionarTodo(this.elemento);
  }
}
