import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Genero } from '../models/genero.model';

@Injectable({
  providedIn: 'root'
})
export class GeneroService {
  private http = inject(HttpClient);
  private apiUrl = '/api/generos';

  listar(): Observable<Genero[]> {
    return this.http.get<Genero[]>(this.apiUrl);
  }

  guardar(genero: Genero): Observable<Genero> {
    if (genero.idGenero) {
      return this.http.put<Genero>(`${this.apiUrl}/${genero.idGenero}`, genero);
    }
    return this.http.post<Genero>(this.apiUrl, genero);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
