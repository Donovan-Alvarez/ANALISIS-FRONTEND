import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Opcion } from '../models/opcion.model';

@Injectable({ providedIn: 'root' })
export class OpcionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/opciones`;

  findAll(): Observable<Opcion[]> {
    return this.http.get<Opcion[]>(this.apiUrl);
  }

  create(opcion: Opcion): Observable<Opcion> {
    return this.http.post<Opcion>(this.apiUrl, opcion);
  }

  update(id: number, opcion: Opcion): Observable<Opcion> {
    return this.http.put<Opcion>(`${this.apiUrl}/${id}`, opcion);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}