import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OpcionPermisoRequest, RoleOpcionesResponse } from '../models/permiso.model';

/** Permisos de un rol sobre las opciones de un modulo (tabla ROLE_OPCION). */
@Injectable({ providedIn: 'root' })
export class RoleOpcionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/roles`;

  private ruta(idRole: number, idModulo: number): string {
    return `${this.apiUrl}/${idRole}/opciones/por-modulo/${idModulo}`;
  }

  obtenerPorModulo(idRole: number, idModulo: number): Observable<RoleOpcionesResponse> {
    return this.http.get<RoleOpcionesResponse>(this.ruta(idRole, idModulo));
  }

  /**
   * Reemplaza los permisos del rol para TODAS las opciones del modulo.
   * El backend borra las filas del modulo y reinserta solo las que traen
   * alguna casilla marcada, asi que hay que enviar la cuadricula completa,
   * incluidas las filas sin nada seleccionado.
   */
  guardarPorModulo(
    idRole: number,
    idModulo: number,
    permisos: OpcionPermisoRequest[],
  ): Observable<RoleOpcionesResponse> {
    return this.http.put<RoleOpcionesResponse>(this.ruta(idRole, idModulo), permisos);
  }
}
