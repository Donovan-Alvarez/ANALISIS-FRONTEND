import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RolesModel } from '../models/roles.model';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private http = inject(HttpClient);
  private apiUrl = '/api/roles';

  listar(): Observable<RolesModel[]> {
    return this.http.get<RolesModel[]>(this.apiUrl);
  }

  guardar(rol: RolesModel): Observable<RolesModel> {
    if (rol.idRole) {
      return this.http.put<RolesModel>(`${this.apiUrl}/${rol.idRole}`, rol);
    }
    return this.http.post<RolesModel>(this.apiUrl, rol);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
