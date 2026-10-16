import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CuentaBancaria, CuentaBancariaPayload } from '../models/cuenta-bancaria.model';
import { EmpleadoOpcion } from '../models/inasistencia.model';

@Injectable({ providedIn: 'root' })
export class CuentaBancariaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/cuentas-bancarias`;

  /** Con soloActivas y/o idEmpleado filtra en el backend (contrato que usa Boletas de Pago). */
  findAll(filtro: { soloActivas?: boolean; idEmpleado?: number } = {}): Observable<CuentaBancaria[]> {
    let params = new HttpParams();
    if (filtro.soloActivas) params = params.set('soloActivas', 'true');
    if (filtro.idEmpleado != null) params = params.set('idEmpleado', filtro.idEmpleado);
    return this.http.get<CuentaBancaria[]>(this.apiUrl, { params });
  }

  /** Opciones del combo de Empleado (todos los empleados). */
  findEmpleados(): Observable<EmpleadoOpcion[]> {
    return this.http.get<EmpleadoOpcion[]>(`${this.apiUrl}/empleados`);
  }

  create(payload: CuentaBancariaPayload): Observable<CuentaBancaria> {
    return this.http.post<CuentaBancaria>(this.apiUrl, payload);
  }

  update(id: number, payload: CuentaBancariaPayload): Observable<CuentaBancaria> {
    return this.http.put<CuentaBancaria>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
