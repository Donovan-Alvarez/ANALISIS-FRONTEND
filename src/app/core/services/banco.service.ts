import { Injectable } from '@angular/core';
import { CatalogoSimpleApi } from './catalogo-simple-api';

/** GET/POST/PUT/DELETE /api/bancos (BancoDTO: idBanco, nombre). */
@Injectable({ providedIn: 'root' })
export class BancoService extends CatalogoSimpleApi {
  protected readonly slug = 'bancos';
  protected readonly campoId = 'idBanco';
}
