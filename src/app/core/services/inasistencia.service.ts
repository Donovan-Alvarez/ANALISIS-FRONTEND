import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmpleadoOpcion, Inasistencia, InasistenciaPayload } from '../models/inasistencia.model';

@Injectable({ providedIn: 'root' })
export class InasistenciaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/inasistencias`;

  findAll(): Observable<Inasistencia[]> {
    return this.http.get<Inasistencia[]>(this.apiUrl);
  }

  
  findEmpleados(): Observable<EmpleadoOpcion[]> {
    return this.http.get<EmpleadoOpcion[]>(`${this.apiUrl}/empleados`);
  }

  create(payload: InasistenciaPayload): Observable<Inasistencia> {
    return this.http.post<Inasistencia>(this.apiUrl, payload);
  }

  update(id: number, payload: InasistenciaPayload): Observable<Inasistencia> {
    return this.http.put<Inasistencia>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}