import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CatalogoSimpleConfig } from '../../core/models/catalogo-simple.model';
import { PermisosPantalla, SIN_PERMISOS } from '../../core/models/permiso.model';
import { CatalogoSimpleApi } from '../../core/services/catalogo-simple-api';
import { MenuService } from '../../core/services/menu.service';
import { PermisosService } from '../../core/services/permisos.service';
import { CatalogoSimple } from './catalogo-simple';

const TODOS: PermisosPantalla = { consultar: true, alta: true, baja: true, cambio: true, imprimir: true, exportar: true };
const SOLO_CONSULTA: PermisosPantalla = { ...SIN_PERMISOS, consultar: true };

describe('CatalogoSimple · permisos', () => {
  let fixture: ComponentFixture<CatalogoSimple>;
  let findAll: ReturnType<typeof vi.fn>;

  async function montar(permisos: PermisosPantalla): Promise<HTMLElement> {
    findAll = vi.fn(() => of([{ id: 1, nombre: 'Casado(a)' }]));
    const api = { findAll } as unknown as CatalogoSimpleApi;
    const config: CatalogoSimpleConfig = {
      slug: 'estados-civiles',
      titulo: 'Estados civiles',
      singular: 'estado civil',
      etiqueta: 'Nombre',
      longitudMaxima: 50,
      icono: 'family_restroom',
      api,
    };

    await TestBed.configureTestingModule({
      imports: [CatalogoSimple],
      providers: [
        { provide: PermisosService, useValue: { permisosDe: () => permisos } },
        { provide: MenuService, useValue: { cargado: signal(true), menu: signal([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogoSimple);
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

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(raiz.textContent).toContain('Casado(a)');
    for (const texto of ['Nuevo estado civil', 'Imprimir', 'Exportar', 'Editar', 'Eliminar']) {
      const b = boton(raiz, texto);
      expect(b, texto).toBeTruthy();
      expect(b.disabled, texto).toBe(true);
    }
  });

  it('con todos los permisos: los cinco botones quedan habilitados', async () => {
    const raiz = await montar(TODOS);

    for (const texto of ['Nuevo estado civil', 'Imprimir', 'Exportar', 'Editar', 'Eliminar']) {
      expect(boton(raiz, texto).disabled, texto).toBe(false);
    }
  });

  it('sin la opción en el menú del rol: no pide la lista y muestra "sin acceso"', async () => {
    const raiz = await montar(SIN_PERMISOS);

    expect(findAll).not.toHaveBeenCalled();
    expect(raiz.textContent).toContain('No tienes acceso a esta opción.');
  });
});
