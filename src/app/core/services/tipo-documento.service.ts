import { Injectable } from '@angular/core';
import { CatalogoSimpleApi } from './catalogo-simple-api';

/** GET/POST/PUT/DELETE /api/tipos-documento (TipoDocumentoDTO: idTipoDocumento, nombre). */
@Injectable({ providedIn: 'root' })
export class TipoDocumentoService extends CatalogoSimpleApi {
  protected readonly slug = 'tipos-documento';
  protected readonly campoId = 'idTipoDocumento';
}
