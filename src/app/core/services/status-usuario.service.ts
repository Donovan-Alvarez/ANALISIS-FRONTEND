import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatusUsuario } from '../models/status-usuario.model';

@Injectable({ providedIn: 'root' })
export class StatusUsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/status-usuario`;

  findAll(): Observable<StatusUsuario[]> {
    return this.http.get<StatusUsuario[]>(this.apiUrl);
  }

  create(statusUsuario: StatusUsuario): Observable<StatusUsuario> {
    return this.http.post<StatusUsuario>(this.apiUrl, statusUsuario);
  }

  update(id: number, statusUsuario: StatusUsuario): Observable<StatusUsuario> {
    return this.http.put<StatusUsuario>(`${this.apiUrl}/${id}`, statusUsuario);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
