import { Injectable } from '@angular/core';
import { CatalogoSimpleApi } from './catalogo-simple-api';

/** GET/POST/PUT/DELETE /api/status-empleado (StatusEmpleadoDTO: idStatusEmpleado, nombre). */
@Injectable({ providedIn: 'root' })
export class StatusEmpleadoService extends CatalogoSimpleApi {
  protected readonly slug = 'status-empleado';
  protected readonly campoId = 'idStatusEmpleado';
}
