import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmpleadoLiquidable, Liquidacion, LiquidacionRequest } from '../models/liquidacion.model';

/**
 * /api/liquidacion — el slug va en singular porque asi lo sembro
 * 04_fase2_rbac.sql en OPCION.Pagina, y PermisoAccionInterceptor lo usa
 * para resolver los permisos.
 *
 * No hay update ni delete: una liquidacion emitida es historial permanente.
 */
@Injectable({ providedIn: 'root' })
export class LiquidacionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/liquidacion`;

  findAll(): Observable<Liquidacion[]> {
    return this.http.get<Liquidacion[]>(this.apiUrl);
  }

  findById(id: number): Observable<Liquidacion> {
    return this.http.get<Liquidacion>(`${this.apiUrl}/${id}`);
  }

  /** Empleados sin liquidacion: los unicos que el combo debe ofrecer. */
  empleadosLiquidables(): Observable<EmpleadoLiquidable[]> {
    return this.http.get<EmpleadoLiquidable[]>(`${this.apiUrl}/empleados-liquidables`);
  }

  /** El backend calcula los cuatro totales y devuelve la liquidacion creada. */
  calcular(peticion: LiquidacionRequest): Observable<Liquidacion> {
    return this.http.post<Liquidacion>(this.apiUrl, peticion);
  }
}
