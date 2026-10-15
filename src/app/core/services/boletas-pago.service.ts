import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BoletaPago, PeriodoPago, EmpleadoPago } from '../models/boleta-pago.model';
@Injectable({ providedIn: 'root' })
export class BoletasPagoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/api/boletas-pago`;
  periodos() {
    return this.http.get<PeriodoPago[]>(`${this.url}/periodos`);
  }
  empleados(a: number, m: number) {
    return this.http.get<EmpleadoPago[]>(`${this.url}/${a}/${m}/empleados`);
  }
  obtener(a: number, m: number, id: number) {
    return this.http.get<BoletaPago>(`${this.url}/${a}/${m}/${id}`);
  }
}
