import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Empresa,
  Genero,
  Modulo,
  Role,
  StatusUsuario,
  Sucursal,
} from '../models/catalogo.model';

/**
 * Catalogos que alimentan los ComboBox de los mantenimientos.
 *
 * Son tablas chicas y practicamente estaticas durante una sesion, asi que la
 * respuesta se cachea con shareReplay: abrir el modal de Usuarios varias veces
 * no vuelve a pedir empresas, generos, roles, etc.
 */
@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api`;

  private empresas$?: Observable<Empresa[]>;
  private sucursales$?: Observable<Sucursal[]>;
  private generos$?: Observable<Genero[]>;
  private estatus$?: Observable<StatusUsuario[]>;
  private roles$?: Observable<Role[]>;
  private modulos$?: Observable<Modulo[]>;

  empresas(): Observable<Empresa[]> {
    this.empresas$ ??= this.http
      .get<Empresa[]>(`${this.apiUrl}/empresas`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.empresas$;
  }

  sucursales(): Observable<Sucursal[]> {
    this.sucursales$ ??= this.http
      .get<Sucursal[]>(`${this.apiUrl}/sucursales`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.sucursales$;
  }

  generos(): Observable<Genero[]> {
    this.generos$ ??= this.http
      .get<Genero[]>(`${this.apiUrl}/generos`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.generos$;
  }

  statusUsuario(): Observable<StatusUsuario[]> {
    this.estatus$ ??= this.http
      .get<StatusUsuario[]>(`${this.apiUrl}/status-usuario`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.estatus$;
  }

  roles(): Observable<Role[]> {
    this.roles$ ??= this.http
      .get<Role[]>(`${this.apiUrl}/roles`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.roles$;
  }

  modulos(): Observable<Modulo[]> {
    this.modulos$ ??= this.http
      .get<Modulo[]>(`${this.apiUrl}/modulos`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.modulos$;
  }

  /** Limpia el cache; util despues de dar de alta una empresa o sucursal. */
  invalidar(): void {
    this.empresas$ = undefined;
    this.sucursales$ = undefined;
    this.generos$ = undefined;
    this.estatus$ = undefined;
    this.roles$ = undefined;
    this.modulos$ = undefined;
  }
}
