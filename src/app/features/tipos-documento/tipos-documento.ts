import { Component, inject } from '@angular/core';
import { CatalogoSimpleConfig } from '../../core/models/catalogo-simple.model';
import { TipoDocumentoService } from '../../core/services/tipo-documento.service';
import { CatalogoSimple } from '../../shared/catalogo-simple/catalogo-simple';

/** Ruta y OPCION.Pagina: 'tipos-documento' (contrato-rutas.md). */
@Component({
  selector: 'app-tipos-documento',
  imports: [CatalogoSimple],
  template: `<app-catalogo-simple [config]="config" />`,
})
export class TiposDocumento {
  protected readonly config: CatalogoSimpleConfig = {
    slug: 'tipos-documento',
    titulo: 'Tipos de documento',
    singular: 'tipo de documento',
    etiqueta: 'Nombre',
    longitudMaxima: 50,
    placeholder: 'Ej. Pasaporte',
    icono: 'description',
    api: inject(TipoDocumentoService),
  };
}
