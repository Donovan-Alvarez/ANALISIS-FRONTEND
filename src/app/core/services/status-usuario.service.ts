import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StatusUsuarioModel {
  idStatusUsuario?: number;
  nombre: string;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  fechaModificacion?: string;
  usuarioModificacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatusUsuarioService {
  private http = inject(HttpClient);
  private apiUrl = '/api/status-usuario';

  listar(): Observable<StatusUsuarioModel[]> {
    return this.http.get<StatusUsuarioModel[]>(this.apiUrl);
  }

  guardar(statusUsuario: StatusUsuarioModel): Observable<StatusUsuarioModel> {
    if (statusUsuario.idStatusUsuario) {
      return this.http.put<StatusUsuarioModel>(`${this.apiUrl}/${statusUsuario.idStatusUsuario}`, statusUsuario);
    }
    return this.http.post<StatusUsuarioModel>(this.apiUrl, statusUsuario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
