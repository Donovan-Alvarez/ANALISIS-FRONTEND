import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MonedaInputDirective, conSeparadorMiles, limpiarMonto } from './moneda-input.directive';

@Component({
  imports: [ReactiveFormsModule, MonedaInputDirective],
  template: `<input appMoneda [formControl]="control" />`,
})
class Anfitrion {
  readonly control = new FormControl<number | null>(1000000);
}

describe('MonedaInputDirective', () => {
  let fixture: ComponentFixture<Anfitrion>;
  let input: HTMLInputElement;

  const escribir = (texto: string) => {
    input.value = texto;
    input.setSelectionRange(texto.length, texto.length);
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  it('muestra el valor del formulario con separador de miles y centavos', () => {
    expect(input.value).toBe('1,000,000.00');
    expect(input.type).toBe('text');
  });

  it('formatea mientras se escribe y entrega un número al formulario', () => {
    escribir('1234567.891');
    expect(input.value).toBe('1,234,567.89');
    expect(fixture.componentInstance.control.value).toBe(1234567.89);
  });

  it('al salir del campo completa los centavos', () => {
    escribir('2500.5');
    input.dispatchEvent(new Event('blur'));
    expect(input.value).toBe('2,500.50');
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('ignora letras y signo negativo', () => {
    escribir('-12a3b4');
    expect(input.value).toBe('1,234');
    expect(fixture.componentInstance.control.value).toBe(1234);
  });

  it('vacío deja el control en null (lo atrapa Validators.required)', () => {
    escribir('');
    expect(fixture.componentInstance.control.value).toBeNull();
  });

  it('al enfocar selecciona todo el monto para reemplazarlo al escribir', async () => {
    document.body.appendChild(fixture.nativeElement);
    input.focus();
    await new Promise((r) => setTimeout(r));
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('1,000,000.00'.length);
    fixture.nativeElement.remove();
  });

  it('un cambio desde el código (p. ej. IGSS calculado) también se ve formateado', () => {
    fixture.componentInstance.control.setValue(531.3);
    expect(input.value).toBe('531.30');
  });
});

describe('utilidades de la máscara', () => {
  it('conSeparadorMiles deja la parte decimal como se escribió', () => {
    expect(conSeparadorMiles('1234567.5')).toBe('1,234,567.5');
    expect(conSeparadorMiles('0005')).toBe('5');
    expect(conSeparadorMiles('999')).toBe('999');
  });

  it('limpiarMonto deja un solo punto y máximo 2 decimales', () => {
    expect(limpiarMonto('1.2.3.4')).toBe('1.23');
    expect(limpiarMonto('.5')).toBe('0.5');
  });
});
