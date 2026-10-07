import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemCatalogo } from '../models/catalogo-simple.model';

/**
 * CRUD de un catálogo de un solo campo "Nombre" contra /api/<slug>.
 *
 * Cada catálogo solo declara su slug y cómo se llama su id en el DTO
 * (idEstadoCivil, idBanco...); esta base convierte de/hacia { id, nombre }
 * para que el componente compartido CatalogoSimple no conozca esos nombres.
 */
export abstract class CatalogoSimpleApi {
  /** Igual a OPCION.Pagina y al @RequestMapping del controller. */
  protected abstract readonly slug: string;
  /** Nombre del id en el DTO del backend. */
  protected abstract readonly campoId: string;

  private readonly http = inject(HttpClient);

  private get apiUrl(): string {
    return `${environment.apiUrl}/api/${this.slug}`;
  }

  findAll(): Observable<ItemCatalogo[]> {
    return this.http
      .get<Record<string, unknown>[]>(this.apiUrl)
      .pipe(map((lista) => lista.map((dto) => this.aItem(dto))));
  }

  create(nombre: string): Observable<ItemCatalogo> {
    return this.http.post<Record<string, unknown>>(this.apiUrl, { nombre }).pipe(map((dto) => this.aItem(dto)));
  }

  update(id: number, nombre: string): Observable<ItemCatalogo> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}`, { [this.campoId]: id, nombre })
      .pipe(map((dto) => this.aItem(dto)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private aItem(dto: Record<string, unknown>): ItemCatalogo {
    return { id: Number(dto[this.campoId]), nombre: String(dto['nombre'] ?? '') };
  }
}
