import { Component, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { SelectBuscador, coincideBusqueda } from './select-buscador';

interface Persona {
  id: number;
  nombre: string;
}

@Component({
  imports: [MatSelectModule, ReactiveFormsModule, SelectBuscador],
  template: `
    <mat-select [formControl]="control" (openedChange)="buscador.alAbrir($event)">
      <app-select-buscador #buscador [(texto)]="busqueda" />
      @for (p of filtradas(); track p.id) {
        <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
      } @empty {
        <mat-option disabled>Sin resultados</mat-option>
      }
    </mat-select>
  `,
})
class Anfitrion {
  readonly control = new FormControl<number | null>(null);
  readonly busqueda = signal('');
  readonly personas = signal<Persona[]>([
    { id: 1, nombre: 'Ernesto Quesada' },
    { id: 2, nombre: 'Adriana Peña' },
    { id: 3, nombre: 'Andrés Ambrocio' },
  ]);
  readonly filtradas = computed(() => this.personas().filter((p) => coincideBusqueda(this.busqueda(), p.nombre)));
}

describe('SelectBuscador dentro de un mat-select', () => {
  let fixture: ComponentFixture<Anfitrion>;
  let select: MatSelect;

  const refrescar = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const campo = () => document.querySelector<HTMLInputElement>('.select-buscador__input')!;
  const textos = () => select.options.map((o) => o.viewValue);
  const escribir = async (valor: string) => {
    campo().value = valor;
    campo().dispatchEvent(new Event('input'));
    await refrescar();
    await new Promise((r) => setTimeout(r)); // activarPrimeraCoincidencia()
  };
  // Como un teclado real: Material (ListKeyManager) lee keyCode, no solo key.
  const CODIGOS: Record<string, number> = { a: 65, ' ': 32, ArrowDown: 40, Enter: 13 };
  const tecla = (key: string) => {
    const evento = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    Object.defineProperty(evento, 'keyCode', { get: () => CODIGOS[key] ?? 0 });
    campo().dispatchEvent(evento);
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(Anfitrion);
    await refrescar();
    select = fixture.debugElement.query(By.directive(MatSelect)).componentInstance;
    select.open();
    await refrescar();
  });

  afterEach(() => select.close());

  it('filtra las opciones mientras se escribe, sin acentos ni mayúsculas', async () => {
    await escribir('pena');
    expect(textos()).toEqual(['Adriana Peña']);

    await escribir('AND');
    expect(textos()).toEqual(['Andrés Ambrocio']);
  });

  it('muestra un aviso cuando nada coincide', async () => {
    await escribir('zzz');
    expect(textos()).toEqual(['Sin resultados']);
  });

  it('las letras y el espacio no seleccionan ni cierran el select', async () => {
    tecla('a');
    tecla(' ');
    await refrescar();
    expect(select.panelOpen).toBe(true);
    expect(fixture.componentInstance.control.value).toBeNull();
  });

  it('la flecha abajo sí llega al mat-select para recorrer las opciones', async () => {
    const antes = select._keyManager.activeItemIndex;
    tecla('ArrowDown');
    await refrescar();
    expect(select._keyManager.activeItemIndex).not.toBe(antes);
  });

  it('escribir y dar Enter elige la primera coincidencia', async () => {
    await escribir('andres');
    tecla('Enter');
    await refrescar();
    expect(fixture.componentInstance.control.value).toBe(3);
  });

  it('después de filtrar, flecha abajo + Enter elige la segunda coincidencia', async () => {
    await escribir('a'); // las tres contienen "a"
    tecla('ArrowDown');
    tecla('Enter');
    await refrescar();
    expect(fixture.componentInstance.control.value).toBe(2);
  });

  it('al cerrar limpia la búsqueda y vuelve a mostrar todas las opciones', async () => {
    await escribir('pena');
    select.close();
    await refrescar();
    expect(fixture.componentInstance.busqueda()).toBe('');
    select.open();
    await refrescar();
    expect(textos()).toHaveLength(3);
  });
});

describe('coincideBusqueda', () => {
  it('sin texto coincide con todo', () => {
    expect(coincideBusqueda('', 'Cualquiera')).toBe(true);
  });

  it('busca en todos los campos juntos e ignora acentos', () => {
    expect(coincideBusqueda('analista finan', 'Mario López', 'Analista Financiero')).toBe(true);
    expect(coincideBusqueda('lopez', 'Mario López', null)).toBe(true);
    expect(coincideBusqueda('gomez', 'Mario López')).toBe(false);
  });
});
