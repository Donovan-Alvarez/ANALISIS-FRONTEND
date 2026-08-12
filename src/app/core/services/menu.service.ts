import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ModuloConMenus } from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/menu`;

  private readonly _menu = signal<ModuloConMenus[]>([]);
  private readonly _cargado = signal(false);

  readonly menu = this._menu.asReadonly();
  readonly cargado = this._cargado.asReadonly();

  cargarMenu() {
    return this.http.get<ModuloConMenus[]>(`${this.apiUrl}/actual`).pipe(
      tap(menu => {
        this._menu.set(menu);
        this._cargado.set(true);
      }),
    );
  }

  limpiar(): void {
    this._menu.set([]);
    this._cargado.set(false);
  }
}