import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Persona, PersonaPayload } from '../models/persona.model';

/**
 * /api/personas. Sin caché: cada llamada pide datos nuevos.
 * findAll() también lo usa Empleados (Bryan) para el combo de Persona.
 */
@Injectable({ providedIn: 'root' })
export class PersonaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/personas`;

  findAll(): Observable<Persona[]> {
    return this.http.get<Persona[]>(this.apiUrl);
  }

  create(payload: PersonaPayload): Observable<Persona> {
    return this.http.post<Persona>(this.apiUrl, payload);
  }

  update(id: number, payload: PersonaPayload): Observable<Persona> {
    return this.http.put<Persona>(`${this.apiUrl}/${id}`, { idPersona: id, ...payload });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
