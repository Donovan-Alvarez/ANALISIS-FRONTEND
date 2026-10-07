import { Component, inject } from '@angular/core';
import { CatalogoSimpleConfig } from '../../core/models/catalogo-simple.model';
import { EstadoCivilService } from '../../core/services/estado-civil.service';
import { CatalogoSimple } from '../../shared/catalogo-simple/catalogo-simple';

/** Ruta y OPCION.Pagina: 'estados-civiles' (contrato-rutas.md). */
@Component({
  selector: 'app-estados-civiles',
  imports: [CatalogoSimple],
  template: `<app-catalogo-simple [config]="config" />`,
})
export class EstadosCiviles {
  protected readonly config: CatalogoSimpleConfig = {
    slug: 'estados-civiles',
    titulo: 'Estados civiles',
    singular: 'estado civil',
    etiqueta: 'Nombre',
    longitudMaxima: 50,
    placeholder: 'Ej. Soltero(a)',
    icono: 'family_restroom',
    api: inject(EstadoCivilService),
  };
}
