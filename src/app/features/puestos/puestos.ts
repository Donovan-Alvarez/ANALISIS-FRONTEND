import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { CatalogoJerarquicoConfig } from '../../core/models/catalogo-jerarquico.model';
import { DepartamentoService } from '../../core/services/departamento.service';
import { EmpresaService } from '../../core/services/empresa.services';
import { PuestoService } from '../../core/services/puesto.service';
import { CatalogoJerarquico } from '../../shared/catalogo-jerarquico/catalogo-jerarquico';

/**
 * Ruta y OPCION.Pagina: 'puestos' (contrato-rutas.md).
 * Jerarquía Empresa -> Departamento -> Puesto: la Empresa solo filtra el combo
 * de Departamento (no se envía; el backend la deriva del departamento).
 */
@Component({
  selector: 'app-puestos',
  imports: [CatalogoJerarquico],
  template: `<app-catalogo-jerarquico [config]="config" />`,
})
export class Puestos {
  private readonly empresaService = inject(EmpresaService);
  private readonly departamentoService = inject(DepartamentoService);

  protected readonly config: CatalogoJerarquicoConfig = {
    slug: 'puestos',
    titulo: 'Puestos',
    singular: 'puesto',
    etiqueta: 'Nombre',
    longitudMaxima: 50,
    placeholder: 'Ej. Analista de Sistemas',
    icono: 'work',
    combos: [
      {
        clave: 'idEmpresa',
        etiqueta: 'Empresa',
        seEnvia: false,
        opciones: () =>
          this.empresaService.findAll().pipe(map((empresas) => empresas.map((e) => ({ id: e.idEmpresa!, nombre: e.nombre })))),
        sinOpciones: 'No hay empresas registradas.',
      },
      {
        clave: 'idDepartamento',
        etiqueta: 'Departamento',
        seEnvia: true,
        dependeDe: 'idEmpresa',
        // GET /api/departamentos/por-empresa/{id}, sin caché: en cada cambio de empresa.
        opciones: (idEmpresa) => this.departamentoService.porEmpresa(idEmpresa!),
        sinOpciones: 'La empresa seleccionada no tiene departamentos.',
      },
    ],
    columnas: [
      { encabezado: 'Nombre', campo: 'nombre' },
      { encabezado: 'Departamento', campo: 'nombreDepartamento' },
      { encabezado: 'Empresa', campo: 'nombreEmpresa' },
    ],
    api: inject(PuestoService),
  };
}
