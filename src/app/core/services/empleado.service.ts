import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Empleado, PersonaCombo, StatusPermitido } from '../models/empleado.model';
import { Sucursal } from '../models/sucursal.model';
import { OpcionCombo } from '../models/catalogo-jerarquico.model';

/**
 * CRUD de /api/empleados y los combos que necesita la pantalla.
 *
 * El slug 'empleados' tiene que coincidir con OPCION.Pagina y con el
 * @RequestMapping del controller: PermisoAccionInterceptor lo usa para
 * resolver los permisos de alta/baja/cambio.
 */
@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/empleados`;

  findAll(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.apiUrl);
  }

  findById(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.apiUrl}/${id}`);
  }

  create(empleado: Empleado): Observable<Empleado> {
    return this.http.post<Empleado>(this.apiUrl, empleado);
  }

  update(id: number, empleado: Empleado): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.apiUrl}/${id}`, empleado);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Status a los que ESTE empleado puede moverse. Se pide al abrir el
   * formulario de edicion: asi el combo ofrece solo lo valido en vez de
   * dejar elegir y rechazar despues.
   */
  statusPermitidos(idEmpleado: number): Observable<StatusPermitido[]> {
    return this.http.get<StatusPermitido[]>(`${this.apiUrl}/${idEmpleado}/status-permitidos`);
  }

  /**
   * PROVISIONAL: el combo de Persona sale de aqui porque la pantalla de
   * Personas todavia no expone /api/personas. Cuando exista, cambiar esta
   * linea por su endpoint.
   */
  personas(): Observable<PersonaCombo[]> {
    return this.http.get<PersonaCombo[]>(`${this.apiUrl}/personas`);
  }

  // ── Combos jerarquicos ────────────────────────────────────────────
  // Se piden aqui y no a los servicios de cada companero para no tocar sus
  // archivos antes de la integracion final; los endpoints ya existen.
  //
  // Los DTO del backend traen su id propio (idDepartamento, idPuesto), no un
  // campo "id": el mapeo a { id, nombre } lo hace CatalogoJerarquicoApi, que
  // aqui no se usa. Por eso se normaliza a OpcionCombo en cada llamada.

  /** Sucursales de una empresa: GET /api/sucursales/por-empresa/{id} */
  sucursalesPorEmpresa(idEmpresa: number): Observable<OpcionCombo[]> {
    return this.http
      .get<Sucursal[]>(`${environment.apiUrl}/api/sucursales/por-empresa/${idEmpresa}`)
      .pipe(map((lista) => lista.map((s) => ({ id: s.idSucursal!, nombre: s.nombre }))));
  }

  /** Puestos de un departamento: GET /api/puestos/por-departamento/{id} */
  puestosPorDepartamento(idDepartamento: number): Observable<OpcionCombo[]> {
    return this.http
      .get<{ idPuesto: number; nombre: string }[]>(
        `${environment.apiUrl}/api/puestos/por-departamento/${idDepartamento}`,
      )
      .pipe(map((lista) => lista.map((p) => ({ id: p.idPuesto, nombre: p.nombre }))));
  }

  /** Departamentos de una empresa: GET /api/departamentos/por-empresa/{id} */
  departamentosPorEmpresa(idEmpresa: number): Observable<OpcionCombo[]> {
    return this.http
      .get<{ idDepartamento: number; nombre: string }[]>(
        `${environment.apiUrl}/api/departamentos/por-empresa/${idEmpresa}`,
      )
      .pipe(map((lista) => lista.map((d) => ({ id: d.idDepartamento, nombre: d.nombre }))));
  }
}
