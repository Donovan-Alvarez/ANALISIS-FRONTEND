import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DocumentoPersona } from '../../../core/models/documento-persona.model';
import { DocumentoPersonaFormData, DocumentoPersonaFormDialog } from './documento-persona-form-dialog';

const DPI = 'Documento Personal de Identificacion (DPI)';
const API = `${environment.apiUrl}/api`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Interno = any; // los miembros del componente son protected: las pruebas los leen igual.

async function crear(data: Partial<DocumentoPersonaFormData>) {
  const guardar = vi.fn(() => of({}));
  const close = vi.fn();
  TestBed.configureTestingModule({
    imports: [DocumentoPersonaFormDialog],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: MAT_DIALOG_DATA,
        useValue: { titulo: 'Nuevo documento', documento: null, existentes: [], guardar, ...data },
      },
      { provide: MatDialogRef, useValue: { close, disableClose: false } },
    ],
  });
  const fixture: ComponentFixture<DocumentoPersonaFormDialog> = TestBed.createComponent(DocumentoPersonaFormDialog);
  fixture.detectChanges();

  const http = TestBed.inject(HttpTestingController);
  http.expectOne(`${API}/personas`).flush([
    { idPersona: 1, nombre: 'Ana', apellido: 'López', nombreCompleto: 'Ana López' },
    { idPersona: 2, nombre: 'Luis', apellido: 'Pérez', nombreCompleto: 'Luis Pérez' },
  ]);
  http.expectOne(`${API}/tipos-documento`).flush([
    { idTipoDocumento: 1, nombre: DPI },
    { idTipoDocumento: 2, nombre: 'Pasaporte' },
  ]);
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, c: fixture.componentInstance as Interno, guardar, close };
}

describe('DocumentoPersonaFormDialog', () => {
  it('carga personas y tipos en los combos', async () => {
    const { c } = await crear({});
    expect(c.personas().map((p: { nombre: string }) => p.nombre)).toEqual(['Ana López', 'Luis Pérez']);
    expect(c.tipos().length).toBe(2);
    expect(c.cargandoOpciones()).toBe(false);
  });

  it('avisa y NO guarda si la persona ya tiene ese tipo de documento', async () => {
    const existentes: DocumentoPersona[] = [{ idPersona: 1, idTipoDocumento: 1, noDocumento: '9843 55061 4572' }];
    const { c, guardar } = await crear({ existentes });

    c.idPersona.setValue(1);
    c.idTipoDocumento.setValue(1);
    c.noDocumento.setValue('2345678901234');
    expect(c.duplicado()).toBe(true);

    c.guardar();
    expect(guardar).not.toHaveBeenCalled();

    // La misma persona con OTRO tipo, o el mismo tipo con OTRA persona, sí se permite.
    c.idTipoDocumento.setValue(2);
    expect(c.duplicado()).toBe(false);
    c.idTipoDocumento.setValue(1);
    c.idPersona.setValue(2);
    expect(c.duplicado()).toBe(false);
  });

  it('valida el número según el tipo elegido y revalida al cambiar de tipo', async () => {
    const { c } = await crear({});
    c.idPersona.setValue(1);
    c.idTipoDocumento.setValue(1); // DPI
    c.noDocumento.setValue('12345');
    c.noDocumento.markAsTouched();
    expect(c.errorNumero()).toContain('13 dígitos');

    c.noDocumento.setValue('2345 67890 1234');
    expect(c.errorNumero()).toBeNull();

    // El mismo texto deja de ser un DPI inválido si el tipo es Pasaporte; y uno corto sí falla.
    c.noDocumento.setValue('AB');
    c.idTipoDocumento.setValue(2);
    expect(c.errorNumero()).toContain('entre 4 y 50');
  });

  it('envía el payload con el número recortado cuando todo es válido', async () => {
    const { c, guardar, close } = await crear({});
    c.idPersona.setValue(2);
    c.idTipoDocumento.setValue(1);
    c.noDocumento.setValue('  2345678901234  ');

    c.guardar();
    expect(guardar).toHaveBeenCalledWith({ idPersona: 2, idTipoDocumento: 1, noDocumento: '2345678901234' });
    expect(close).toHaveBeenCalledWith(true);
  });

  it('al editar bloquea persona y tipo, y precarga el número', async () => {
    const documento: DocumentoPersona = { idPersona: 1, idTipoDocumento: 1, noDocumento: '9843 55061 4572' };
    const { c, guardar } = await crear({ titulo: 'Editar documento', documento, existentes: [documento] });

    expect(c.esEdicion).toBe(true);
    expect(c.idPersona.disabled).toBe(true);
    expect(c.idTipoDocumento.disabled).toBe(true);
    expect(c.noDocumento.value).toBe('9843 55061 4572');
    expect(c.duplicado()).toBe(false); // editar su propio documento no es un duplicado

    c.noDocumento.setValue('2345678901234');
    c.guardar();
    expect(guardar).toHaveBeenCalledWith({ idPersona: 1, idTipoDocumento: 1, noDocumento: '2345678901234' });
  });
});
