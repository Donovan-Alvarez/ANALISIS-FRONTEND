import { Injectable } from '@angular/core';
import { CatalogoSimpleApi } from './catalogo-simple-api';

/** GET/POST/PUT/DELETE /api/estados-civiles (EstadoCivilDTO: idEstadoCivil, nombre). */
@Injectable({ providedIn: 'root' })
export class EstadoCivilService extends CatalogoSimpleApi {
  protected readonly slug = 'estados-civiles';
  protected readonly campoId = 'idEstadoCivil';
}
