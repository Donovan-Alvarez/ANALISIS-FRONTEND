import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject, of } from 'rxjs';
import {
  CatalogoJerarquicoConfig,
  ComboConfig,
  ItemJerarquico,
  OpcionCombo,
} from '../../core/models/catalogo-jerarquico.model';
import { PermisosPantalla, SIN_PERMISOS } from '../../core/models/permiso.model';
import { CatalogoJerarquicoApi } from '../../core/services/catalogo-jerarquico-api';
import { MenuService } from '../../core/services/menu.service';
import { PermisosService } from '../../core/services/permisos.service';
import { CatalogoJerarquico } from './catalogo-jerarquico';
import {
  CatalogoJerarquicoFormData,
  CatalogoJerarquicoFormDialog,
} from './catalogo-jerarquico-form-dialog/catalogo-jerarquico-form-dialog';

const TODOS: PermisosPantalla = { consultar: true, alta: true, baja: true, cambio: true, imprimir: true, exportar: true };
const SOLO_CONSULTA: PermisosPantalla = { ...SIN_PERMISOS, consultar: true };

const EMPRESAS: OpcionCombo[] = [
  { id: 1, nombre: 'Software Inc.' },
  { id: 42, nombre: 'Security' },
];
const DEPTOS_SOFTWARE: OpcionCombo[] = [
  { id: 1, nombre: 'Administración' },
  { id: 5, nombre: 'Finanzas' },
];

const CONTADOR: ItemJerarquico = {
  id: 11,
  nombre: 'Contador',
  idDepartamento: 5,
  nombreDepartamento: 'Finanzas',
  idEmpresa: 1,
  nombreEmpresa: 'Software Inc.',
};

/** Combos de Puestos con opciones simuladas; departamentos(id) decide qué devuelve cada empresa. */
function combosPuestos(departamentos: (idEmpresa: number) => Observable<OpcionCombo[]>): ComboConfig[] {
  return [
    {
      clave: 'idEmpresa',
      etiqueta: 'Empresa',
      seEnvia: false,
      opciones: vi.fn(() => of(EMPRESAS)),
      sinOpciones: 'No hay empresas registradas.',
    },
    {
      clave: 'idDepartamento',
      etiqueta: 'Departamento',
      seEnvia: true,
      dependeDe: 'idEmpresa',
      opciones: vi.fn((idEmpresa: number | null) => departamentos(idEmpresa!)),
      sinOpciones: 'La empresa seleccionada no tiene departamentos.',
    },
  ];
}

describe('CatalogoJerarquico · pantalla', () => {
  async function montar(permisos: PermisosPantalla): Promise<HTMLElement> {
    const api = { findAll: vi.fn(() => of([CONTADOR])) } as unknown as CatalogoJerarquicoApi;
    const config: CatalogoJerarquicoConfig = {
      slug: 'puestos',
      titulo: 'Puestos',
      singular: 'puesto',
      etiqueta: 'Nombre',
      longitudMaxima: 50,
      icono: 'work',
      combos: combosPuestos(() => of(DEPTOS_SOFTWARE)),
      columnas: [
        { encabezado: 'Nombre', campo: 'nombre' },
        { encabezado: 'Departamento', campo: 'nombreDepartamento' },
        { encabezado: 'Empresa', campo: 'nombreEmpresa' },
      ],
      api,
    };

    await TestBed.configureTestingModule({
      imports: [CatalogoJerarquico],
      providers: [
        { provide: PermisosService, useValue: { permisosDe: () => permisos } },
        { provide: MenuService, useValue: { cargado: signal(true), menu: signal([]) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CatalogoJerarquico);
    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function boton(raiz: HTMLElement, texto: string): HTMLButtonElement {
    const encontrado = Array.from(raiz.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.includes(texto) || b.getAttribute('title') === texto,
    );
    if (!encontrado) throw new Error(`No se encontró el botón "${texto}"`);
    return encontrado;
  }

  it('rol limitado (solo consulta): los cinco botones se muestran deshabilitados', async () => {
    const raiz = await montar(SOLO_CONSULTA);

    for (const texto of ['Nuevo puesto', 'Imprimir', 'Exportar', 'Editar', 'Eliminar']) {
      expect(boton(raiz, texto).disabled, texto).toBe(true);
    }
  });

  it('las columnas salen de la configuración (Nombre · Departamento · Empresa)', async () => {
    const raiz = await montar(TODOS);

    const encabezados = Array.from(raiz.querySelectorAll('thead th')).map((th) => th.textContent?.trim());
    expect(encabezados).toEqual(['Nombre', 'Departamento', 'Empresa', '']);
    const celdas = Array.from(raiz.querySelectorAll('tbody tr:first-child td')).map((td) => td.textContent?.trim());
    expect(celdas.slice(0, 3)).toEqual(['Contador', 'Finanzas', 'Software Inc.']);
    expect(boton(raiz, 'Nuevo puesto').disabled).toBe(false);
  });
});

describe('CatalogoJerarquicoFormDialog · combo dependiente Empresa -> Departamento', () => {
  let fixture: ComponentFixture<CatalogoJerarquicoFormDialog>;
  let guardar: ReturnType<typeof vi.fn>;
  let cerrar: ReturnType<typeof vi.fn>;

  async function abrir(combos: ComboConfig[], valoresIniciales: CatalogoJerarquicoFormData['valoresIniciales']) {
    guardar = vi.fn(() => of({}));
    cerrar = vi.fn();
    const data: CatalogoJerarquicoFormData = {
      titulo: 'Puesto',
      etiqueta: 'Nombre',
      longitudMaxima: 50,
      combos,
      valoresIniciales,
      guardar: guardar as unknown as CatalogoJerarquicoFormData['guardar'],
    };

    await TestBed.configureTestingModule({
      imports: [CatalogoJerarquicoFormDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: cerrar, disableClose: false } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogoJerarquicoFormDialog);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  // Acceso a miembros protegidos solo para la prueba.
  const control = (clave: string): FormControl<number | null> =>
    (fixture.componentInstance as unknown as { combos: Record<string, FormControl<number | null>> }).combos[clave];
  const nombre = (): FormControl<string> =>
    (fixture.componentInstance as unknown as { nombre: FormControl<string> }).nombre;
  const botonGuardar = (): HTMLButtonElement =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Guardar'),
    )!;

  async function refrescar(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('alta: carga las empresas y deja el departamento deshabilitado hasta elegir una', async () => {
    const combos = combosPuestos(() => of(DEPTOS_SOFTWARE));
    await abrir(combos, { nombre: '', idEmpresa: null, idDepartamento: null });

    expect(combos[0].opciones).toHaveBeenCalledTimes(1);
    expect(combos[1].opciones).not.toHaveBeenCalled();
    expect(control('idEmpresa').enabled).toBe(true);
    expect(control('idDepartamento').disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Primero selecciona una empresa');
    expect(botonGuardar().disabled).toBe(true);
  });

  it('edición: la Empresa aparece seleccionada y el Departamento se fija después de cargar sus opciones, sin reset', async () => {
    const combos = combosPuestos(() => of(DEPTOS_SOFTWARE));
    await abrir(combos, { nombre: 'Contador', idEmpresa: 1, idDepartamento: 5 });

    expect(control('idEmpresa').value).toBe(1);
    expect(control('idDepartamento').value).toBe(5);
    expect(combos[1].opciones).toHaveBeenCalledTimes(1);
    expect(combos[1].opciones).toHaveBeenCalledWith(1);
    expect(control('idDepartamento').enabled).toBe(true);
    expect(botonGuardar().disabled).toBe(false);
  });

  it('al cambiar la Empresa, el Departamento se resetea y Guardar se deshabilita; sin departamentos, el combo queda deshabilitado con su texto', async () => {
    const combos = combosPuestos((idEmpresa) => of(idEmpresa === 42 ? [] : DEPTOS_SOFTWARE));
    await abrir(combos, { nombre: 'Contador', idEmpresa: 1, idDepartamento: 5 });

    control('idEmpresa').setValue(42);
    await refrescar();

    expect(control('idDepartamento').value).toBeNull();
    expect(combos[1].opciones).toHaveBeenLastCalledWith(42);
    expect(control('idDepartamento').disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('La empresa seleccionada no tiene departamentos.');
    expect(botonGuardar().disabled).toBe(true);
  });

  it('switchMap descarta la respuesta de una empresa anterior', async () => {
    const respuestas = new Map<number, Subject<OpcionCombo[]>>([
      [1, new Subject<OpcionCombo[]>()],
      [42, new Subject<OpcionCombo[]>()],
    ]);
    const combos = combosPuestos((idEmpresa) => respuestas.get(idEmpresa)!);
    await abrir(combos, { nombre: '', idEmpresa: null, idDepartamento: null });

    control('idEmpresa').setValue(1);
    control('idEmpresa').setValue(42);
    respuestas.get(42)!.next([{ id: 30, nombre: 'Departamento de prueba' }]);
    respuestas.get(1)!.next(DEPTOS_SOFTWARE); // llega tarde: debe ignorarse
    await refrescar();

    const opciones = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('#combo-idDepartamento option')).map(
      (o) => o.textContent?.trim(),
    );
    expect(opciones).toContain('Departamento de prueba');
    expect(opciones).not.toContain('Finanzas');
  });

  it('Puestos envía { nombre, idDepartamento } sin idEmpresa', async () => {
    const combos = combosPuestos(() => of(DEPTOS_SOFTWARE));
    await abrir(combos, { nombre: 'Contador', idEmpresa: 1, idDepartamento: 5 });

    nombre().setValue('  Tesorero  ');
    botonGuardar().click();
    await refrescar();

    expect(guardar).toHaveBeenCalledWith({ nombre: 'Tesorero', idDepartamento: 5 });
    expect(cerrar).toHaveBeenCalledWith(true);
  });

  it('Departamentos envía { nombre, idEmpresa }', async () => {
    const combos: ComboConfig[] = [
      {
        clave: 'idEmpresa',
        etiqueta: 'Empresa',
        seEnvia: true,
        opciones: () => of(EMPRESAS),
        sinOpciones: 'No hay empresas registradas.',
      },
    ];
    await abrir(combos, { nombre: '', idEmpresa: null });

    nombre().setValue('Departamento de prueba');
    control('idEmpresa').setValue(42);
    await refrescar();
    botonGuardar().click();
    await refrescar();

    expect(guardar).toHaveBeenCalledWith({ nombre: 'Departamento de prueba', idEmpresa: 42 });
  });
});
