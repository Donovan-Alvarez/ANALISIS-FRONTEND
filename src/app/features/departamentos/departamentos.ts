import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { CatalogoJerarquicoConfig } from '../../core/models/catalogo-jerarquico.model';
import { DepartamentoService } from '../../core/services/departamento.service';
import { EmpresaService } from '../../core/services/empresa.services';
import { CatalogoJerarquico } from '../../shared/catalogo-jerarquico/catalogo-jerarquico';

/** Ruta y OPCION.Pagina: 'departamentos' (contrato-rutas.md). */
@Component({
  selector: 'app-departamentos',
  imports: [CatalogoJerarquico],
  template: `<app-catalogo-jerarquico [config]="config" />`,
})
export class Departamentos {
  private readonly empresaService = inject(EmpresaService);

  protected readonly config: CatalogoJerarquicoConfig = {
    slug: 'departamentos',
    titulo: 'Departamentos',
    singular: 'departamento',
    etiqueta: 'Nombre',
    longitudMaxima: 50,
    placeholder: 'Ej. Recursos Humanos',
    icono: 'apartment',
    combos: [
      {
        clave: 'idEmpresa',
        etiqueta: 'Empresa',
        seEnvia: true,
        // GET /api/empresas de Seguridad, sin caché: lista nueva en cada apertura.
        opciones: () =>
          this.empresaService.findAll().pipe(map((empresas) => empresas.map((e) => ({ id: e.idEmpresa!, nombre: e.nombre })))),
        sinOpciones: 'No hay empresas registradas.',
      },
    ],
    columnas: [
      { encabezado: 'Nombre', campo: 'nombre' },
      { encabezado: 'Empresa', campo: 'nombreEmpresa' },
    ],
    api: inject(DepartamentoService),
  };
}
