import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemJerarquico, PayloadJerarquico } from '../models/catalogo-jerarquico.model';

/**
 * CRUD de un catálogo con padre (nombre + FK) contra /api/<slug>.
 *
 * Igual que CatalogoSimpleApi, pero el item conserva todos los campos del
 * DTO (idEmpresa, nombreEmpresa...) para las columnas y para preseleccionar
 * los combos al editar. Sin caché: cada llamada pide datos nuevos.
 */
export abstract class CatalogoJerarquicoApi {
  /** Igual a OPCION.Pagina y al @RequestMapping del controller. */
  protected abstract readonly slug: string;
  /** Nombre del id en el DTO del backend. */
  protected abstract readonly campoId: string;

  protected readonly http = inject(HttpClient);

  protected get apiUrl(): string {
    return `${environment.apiUrl}/api/${this.slug}`;
  }

  findAll(): Observable<ItemJerarquico[]> {
    return this.http
      .get<Record<string, unknown>[]>(this.apiUrl)
      .pipe(map((lista) => lista.map((dto) => this.aItem(dto))));
  }

  create(payload: PayloadJerarquico): Observable<ItemJerarquico> {
    return this.http.post<Record<string, unknown>>(this.apiUrl, payload).pipe(map((dto) => this.aItem(dto)));
  }

  update(id: number, payload: PayloadJerarquico): Observable<ItemJerarquico> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}`, { [this.campoId]: id, ...payload })
      .pipe(map((dto) => this.aItem(dto)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  protected aItem(dto: Record<string, unknown>): ItemJerarquico {
    return { ...dto, id: Number(dto[this.campoId]), nombre: String(dto['nombre'] ?? '') };
  }
}
