import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { seleccionarTodo } from './seleccionar-al-enfocar.directive';

const FORMATO_FINAL = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** '1234567.5' -> '1,234,567.5' (separa miles, deja la parte decimal tal cual se escribió). */
export function conSeparadorMiles(texto: string): string {
  const [entero, decimal] = texto.split('.');
  const enteroLimpio = entero.replace(/^0+(?=\d)/, '');
  const conComas = enteroLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal === undefined ? conComas : `${conComas}.${decimal}`;
}

/** Deja solo dígitos y un punto, con máximo 2 decimales. Sin signo: los montos no son negativos. */
export function limpiarMonto(texto: string): string {
  const soloValidos = texto.replace(/[^\d.]/g, '');
  const punto = soloValidos.indexOf('.');
  if (punto < 0) return soloValidos;
  const entero = soloValidos.slice(0, punto) || '0';
  const decimal = soloValidos.slice(punto + 1).replace(/\./g, '').slice(0, 2);
  return `${entero}.${decimal}`;
}

/** '1,000,000.00' -> 1000000; vacío -> null. */
export function aNumero(texto: string): number | null {
  const limpio = texto.replace(/,/g, '');
  if (limpio === '' || limpio === '.') return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

/**
 * Máscara de moneda para inputs de formularios reactivos:
 *   <input matInput appMoneda formControlName="ingresoSueldoBase" />
 *
 * Muestra "1,000,000.00" pero el control recibe y entrega un number (o null si
 * está vacío), así que los validadores, totales y el backend no cambian.
 * Mientras se escribe separa miles; al salir del campo completa los centavos.
 */
@Directive({
  selector: 'input[appMoneda]',
  host: {
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    '(input)': 'alEscribir()',
    '(blur)': 'alSalir()',
    '(focus)': 'alEnfocar()',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MonedaInputDirective), multi: true }],
})
export class MonedaInputDirective implements ControlValueAccessor {
  private readonly elemento = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private alCambiar: (valor: number | null) => void = () => {};
  private alTocar: () => void = () => {};

  writeValue(valor: number | string | null): void {
    const n = valor === null || valor === '' ? null : Number(valor);
    this.elemento.value = n === null || !Number.isFinite(n) ? '' : FORMATO_FINAL.format(n);
  }

  registerOnChange(fn: (valor: number | null) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.elemento.disabled = deshabilitado;
  }

  protected alEscribir(): void {
    const el = this.elemento;
    const cursor = el.selectionStart ?? el.value.length;
    // Cuántos dígitos/punto hay antes del cursor, para dejarlo en el mismo lugar tras reformatear.
    const significativosAntes = el.value.slice(0, cursor).replace(/[^\d.]/g, '').length;

    const formateado = conSeparadorMiles(limpiarMonto(el.value));
    el.value = formateado;

    let posicion = 0;
    let vistos = 0;
    while (posicion < formateado.length && vistos < significativosAntes) {
      if (formateado[posicion] !== ',') vistos++;
      posicion++;
    }
    el.setSelectionRange(posicion, posicion);

    this.alCambiar(aNumero(formateado));
  }

  /** Selecciona todo el monto: lo que se escriba lo reemplaza. */
  protected alEnfocar(): void {
    seleccionarTodo(this.elemento);
  }

  protected alSalir(): void {
    const n = aNumero(this.elemento.value);
    this.elemento.value = n === null ? '' : FORMATO_FINAL.format(n);
    this.alTocar();
  }
}
