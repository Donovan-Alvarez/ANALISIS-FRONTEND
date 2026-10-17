import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SeleccionarAlEnfocarDirective } from './seleccionar-al-enfocar.directive';

@Component({
  imports: [SeleccionarAlEnfocarDirective],
  template: `<input type="text" value="12" appSeleccionarAlEnfocar />`,
})
class Anfitrion {}

describe('SeleccionarAlEnfocarDirective', () => {
  it('al enfocar deja todo el valor seleccionado', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    input.focus();
    await new Promise((r) => setTimeout(r));

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(2);
    fixture.nativeElement.remove();
  });
});
