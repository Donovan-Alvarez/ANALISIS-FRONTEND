import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { CatalogoJerarquico } from '../../shared/catalogo-jerarquico/catalogo-jerarquico';
import { CatalogoJerarquicoConfig } from '../../core/models/catalogo-jerarquico.model';
import { FlujoStatusEmpleadoService } from '../../core/services/flujo-status-empleado.service';
import { StatusEmpleadoService } from '../../core/services/status-empleado.service';
@Component({
  selector: 'app-flujo-status-empleado',
  imports: [CatalogoJerarquico],
  template: `<app-catalogo-jerarquico [config]="config" />`,
})
export class FlujoStatusEmpleado {
  private readonly status = inject(StatusEmpleadoService);
  protected readonly config: CatalogoJerarquicoConfig = {
    slug: 'flujo-status-empleado',
    titulo: 'Flujos Status Empleado',
    singular: 'flujo',
    etiqueta: 'Nombre del evento',
    longitudMaxima: 50,
    icono: 'swap_horiz',
    combos: [
      {
        clave: 'idStatusActual',
        etiqueta: 'Status actual',
        seEnvia: true,
        opciones: () => this.opciones(),
        sinOpciones: 'No hay status registrados.',
      },
      {
        clave: 'idStatusNuevo',
        etiqueta: 'Status nuevo',
        seEnvia: true,
        opciones: () => this.opciones(),
        sinOpciones: 'No hay status registrados.',
      },
    ],
    columnas: [
      { encabezado: 'Evento', campo: 'nombre' },
      { encabezado: 'Status actual', campo: 'statusActual' },
      { encabezado: 'Status nuevo', campo: 'statusNuevo' },
    ],
    api: inject(FlujoStatusEmpleadoService),
  };
  private opciones() {
    return this.status
      .findAll()
      .pipe(map((items) => items.map((i) => ({ id: i.id, nombre: i.nombre }))));
  }
}
