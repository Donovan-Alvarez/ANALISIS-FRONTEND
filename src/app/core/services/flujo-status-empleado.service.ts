import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { CatalogoJerarquicoApi } from './catalogo-jerarquico-api';
import { ItemJerarquico, PayloadJerarquico } from '../models/catalogo-jerarquico.model';
@Injectable({ providedIn: 'root' })
export class FlujoStatusEmpleadoService extends CatalogoJerarquicoApi {
  protected readonly slug = 'flujo-status-empleado';
  protected readonly campoId = 'id';
  private readonly claves = new Map<number, string>();
  private secuencia = 0;
  protected override aItem(d: Record<string, unknown>): ItemJerarquico {
    const clave = `${d['idStatusActual']}/${d['idStatusNuevo']}`;
    let id = [...this.claves].find(([, v]) => v === clave)?.[0];
    if (id === undefined) {
      id = ++this.secuencia;
      this.claves.set(id, clave);
    }
    return { ...d, id, nombre: String(d['nombreEvento'] ?? '') };
  }
  private cuerpo(p: PayloadJerarquico) {
    return {
      idStatusActual: p['idStatusActual'],
      idStatusNuevo: p['idStatusNuevo'],
      nombreEvento: p.nombre,
    };
  }
  override create(p: PayloadJerarquico) {
    return this.http
      .post<Record<string, unknown>>(this.apiUrl, this.cuerpo(p))
      .pipe(map((d) => this.aItem(d)));
  }
  override update(id: number, p: PayloadJerarquico) {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${this.claves.get(id)!}`, this.cuerpo(p))
      .pipe(map((d) => this.aItem(d)));
  }
  override delete(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${this.claves.get(id)!}`);
  }
}
