import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/roles`;

  findAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  create(role: Role): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role);
  }

  update(id: number, role: Role): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${id}`, role);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
