import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Persona } from '../../../core/models/persona.model';
import { PersonaFormData, PersonaFormDialog } from './persona-form-dialog';

const API = `${environment.apiUrl}/api`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Interno = any; // los miembros del componente son protected: las pruebas los leen igual.

async function crear(persona: Persona | null = null) {
  const guardar = vi.fn(() => of({}));
  const close = vi.fn();
  TestBed.configureTestingModule({
    imports: [PersonaFormDialog],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MAT_DIALOG_DATA, useValue: { titulo: 'Nueva persona', persona, guardar } satisfies PersonaFormData },
      { provide: MatDialogRef, useValue: { close, disableClose: false } },
    ],
  });
  const fixture = TestBed.createComponent(PersonaFormDialog);
  fixture.detectChanges();

  const http = TestBed.inject(HttpTestingController);
  http.expectOne(`${API}/generos`).flush([
    { idGenero: 1, nombre: 'Masculino' },
    { idGenero: 2, nombre: 'Femenino' },
  ]);
  http.expectOne(`${API}/estados-civiles`).flush([
    { idEstadoCivil: 1, nombre: 'Soltero(a)' },
    { idEstadoCivil: 2, nombre: 'Casado(a)' },
  ]);
  await fixture.whenStable();
  fixture.detectChanges();
  return { c: fixture.componentInstance as Interno, guardar, close };
}

const VALIDOS = {
  nombre: '  Ana María ',
  apellido: 'López Pérez',
  fechaNacimiento: '1995-03-10',
  idGenero: 2,
  idEstadoCivil: 1,
  telefono: ' 502-53180319 ',
  correoElectronico: '',
  direccion: ' Zona 1, Guatemala ',
};

describe('PersonaFormDialog', () => {
  it('carga géneros y estados civiles y habilita los combos', async () => {
    const { c } = await crear();
    expect(c.generos().length).toBe(2);
    expect(c.estadosCiviles().length).toBe(2);
    expect(c.form.controls.idGenero.enabled).toBe(true);
    expect(c.form.controls.idEstadoCivil.enabled).toBe(true);
  });

  it('envía el payload limpio: textos recortados y correo vacío como null', async () => {
    const { c, guardar, close } = await crear();
    c.form.patchValue(VALIDOS);
    expect(c.form.valid).toBe(true);

    c.guardar();
    expect(guardar).toHaveBeenCalledWith({
      nombre: 'Ana María',
      apellido: 'López Pérez',
      fechaNacimiento: '1995-03-10',
      idGenero: 2,
      direccion: 'Zona 1, Guatemala',
      telefono: '502-53180319',
      correoElectronico: null,
      idEstadoCivil: 1,
    });
    expect(close).toHaveBeenCalledWith(true);
  });

  it('no envía y marca los campos si el formulario es inválido', async () => {
    const { c, guardar } = await crear();
    c.guardar();
    expect(guardar).not.toHaveBeenCalled();
    expect(c.form.controls.nombre.touched).toBe(true);
    expect(c.error(c.form.controls.nombre, 'El nombre')).toBe('El nombre es obligatorio.');
  });

  it('rechaza correo mal formado, fecha futura, menor de edad y teléfono corto', async () => {
    const { c, guardar } = await crear();
    c.form.patchValue({ ...VALIDOS, correoElectronico: 'sin-arroba.com' });
    expect(c.form.controls.correoElectronico.errors?.['pattern']).toBeTruthy();

    c.form.patchValue({ ...VALIDOS, fechaNacimiento: '2999-01-01' });
    expect(c.form.controls.fechaNacimiento.errors?.['fechaNacimiento']).toContain('futura');

    c.form.patchValue({ ...VALIDOS, fechaNacimiento: '2020-01-01' });
    expect(c.form.controls.fechaNacimiento.errors?.['fechaNacimiento']).toContain('al menos 18');

    c.form.patchValue({ ...VALIDOS, telefono: '123' });
    expect(c.form.controls.telefono.errors?.['telefono']).toBeTruthy();

    c.guardar();
    expect(guardar).not.toHaveBeenCalled();
  });

  it('al editar precarga todos los campos, incluidos los combos', async () => {
    const persona: Persona = {
      idPersona: 7,
      nombre: 'Marco Miguel',
      apellido: 'Aguilar Ríos',
      fechaNacimiento: '1972-09-20',
      idGenero: 1,
      direccion: 'Zona 1, Chinautla',
      telefono: '502-11480761',
      correoElectronico: 'maguilar@itcompany.com',
      idEstadoCivil: 2,
    };
    const { c } = await crear(persona);
    expect(c.form.getRawValue()).toEqual({
      nombre: 'Marco Miguel',
      apellido: 'Aguilar Ríos',
      fechaNacimiento: '1972-09-20',
      idGenero: 1,
      idEstadoCivil: 2,
      telefono: '502-11480761',
      correoElectronico: 'maguilar@itcompany.com',
      direccion: 'Zona 1, Chinautla',
    });
    expect(c.form.valid).toBe(true);
  });
});
