import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PeriodoReporte, ReportePlanillaResultado } from '../models/reporte-planilla.model';

/** Solo lectura: el reporte nunca recalcula, presenta lo que guardó Calcular Planilla. */
@Injectable({ providedIn: 'root' })
export class ReportePlanillaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/reporte-planilla`;

  periodos(): Observable<PeriodoReporte[]> {
    return this.http.get<PeriodoReporte[]>(`${this.apiUrl}/periodos`);
  }

  obtener(anio: number, mes: number): Observable<ReportePlanillaResultado> {
    return this.http.get<ReportePlanillaResultado>(`${this.apiUrl}/${anio}/${mes}`);
  }
}
