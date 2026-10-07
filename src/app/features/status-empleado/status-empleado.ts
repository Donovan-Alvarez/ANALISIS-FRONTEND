import { Component, inject } from '@angular/core';
import { CatalogoSimpleConfig } from '../../core/models/catalogo-simple.model';
import { StatusEmpleadoService } from '../../core/services/status-empleado.service';
import { CatalogoSimple } from '../../shared/catalogo-simple/catalogo-simple';

/** Ruta y OPCION.Pagina: 'status-empleado' (contrato-rutas.md). */
@Component({
  selector: 'app-status-empleado',
  imports: [CatalogoSimple],
  template: `<app-catalogo-simple [config]="config" />`,
})
export class StatusEmpleado {
  protected readonly config: CatalogoSimpleConfig = {
    slug: 'status-empleado',
    titulo: 'Status de empleado',
    singular: 'status de empleado',
    etiqueta: 'Nombre',
    longitudMaxima: 50,
    placeholder: 'Ej. Activo',
    icono: 'how_to_reg',
    api: inject(StatusEmpleadoService),
  };
}
