import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OpcionCombo } from '../models/catalogo-jerarquico.model';
import { CatalogoJerarquicoApi } from './catalogo-jerarquico-api';

/**
 * GET/POST/PUT/DELETE /api/departamentos
 * (DepartamentoDTO: idDepartamento, nombre, idEmpresa, nombreEmpresa).
 */
@Injectable({ providedIn: 'root' })
export class DepartamentoService extends CatalogoJerarquicoApi {
  protected readonly slug = 'departamentos';
  protected readonly campoId = 'idDepartamento';

  /** GET /api/departamentos/por-empresa/{idEmpresa}: opciones del combo de Puestos. */
  porEmpresa(idEmpresa: number): Observable<OpcionCombo[]> {
    return this.http
      .get<{ idDepartamento: number; nombre: string }[]>(`${this.apiUrl}/por-empresa/${idEmpresa}`)
      .pipe(map((lista) => lista.map((d) => ({ id: d.idDepartamento, nombre: d.nombre }))));
  }
}
