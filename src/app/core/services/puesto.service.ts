import { Injectable } from '@angular/core';
import { CatalogoJerarquicoApi } from './catalogo-jerarquico-api';

/**
 * GET/POST/PUT/DELETE /api/puestos (PuestoDTO: idPuesto, nombre,
 * idDepartamento, nombreDepartamento, idEmpresa, nombreEmpresa; la empresa
 * es solo de lectura: sale del departamento).
 */
@Injectable({ providedIn: 'root' })
export class PuestoService extends CatalogoJerarquicoApi {
  protected readonly slug = 'puestos';
  protected readonly campoId = 'idPuesto';
}
