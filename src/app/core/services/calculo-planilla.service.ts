import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CalculoPlanillaPayload,
  PeriodoPlanilla,
  ResultadoCalculoPlanilla,
} from '../models/calculo-planilla.model';

@Injectable({ providedIn: 'root' })
export class CalculoPlanillaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/calculo-planilla`;

  findPeriodos(): Observable<PeriodoPlanilla[]> {
    return this.http.get<PeriodoPlanilla[]>(`${this.apiUrl}/periodos`);
  }

  calcular(payload: CalculoPlanillaPayload): Observable<ResultadoCalculoPlanilla> {
    return this.http.post<ResultadoCalculoPlanilla>(`${this.apiUrl}/calcular`, payload);
  }
}