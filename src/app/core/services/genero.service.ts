import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Genero } from '../models/genero.model';

@Injectable({ providedIn: 'root' })
export class GeneroService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/generos`;

  findAll(): Observable<Genero[]> {
    return this.http.get<Genero[]>(this.apiUrl);
  }

  create(genero: Genero): Observable<Genero> {
    return this.http.post<Genero>(this.apiUrl, genero);
  }

  update(id: number, genero: Genero): Observable<Genero> {
    return this.http.put<Genero>(`${this.apiUrl}/${id}`, genero);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
