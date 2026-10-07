import { Component, inject } from '@angular/core';
import { CatalogoSimpleConfig } from '../../core/models/catalogo-simple.model';
import { BancoService } from '../../core/services/banco.service';
import { CatalogoSimple } from '../../shared/catalogo-simple/catalogo-simple';

/** Ruta y OPCION.Pagina: 'bancos' (contrato-rutas.md). */
@Component({
  selector: 'app-bancos',
  imports: [CatalogoSimple],
  template: `<app-catalogo-simple [config]="config" />`,
})
export class Bancos {
  protected readonly config: CatalogoSimpleConfig = {
    slug: 'bancos',
    titulo: 'Bancos',
    singular: 'banco',
    etiqueta: 'Nombre',
    longitudMaxima: 50,
    placeholder: 'Ej. Banco Industrial',
    icono: 'account_balance',
    api: inject(BancoService),
  };
}
