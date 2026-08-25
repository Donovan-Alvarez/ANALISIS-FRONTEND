import { Injectable, inject } from '@angular/core';
import { PermisosPantalla, SIN_PERMISOS } from '../models/permiso.model';
import { MenuService } from './menu.service';

/**
 * Resuelve que puede hacer el rol autenticado sobre una pantalla.
 *
 * No hace peticiones propias: reutiliza el menu que MenuService ya cargo
 * desde GET /api/menu/actual, que viene de ROLE_OPCION y trae los flags
 * por opcion. Es decir, esto ya funciona con el backend actual.
 *
 * NOTA sobre "consultar": ROLE_OPCION no tiene columna Consultar; solo
 * Alta, Baja, Cambio, Imprimir y Exportar. Mientras no exista esa columna,
 * el permiso de consulta se infiere de la presencia de la opcion en el
 * menu del rol: si el backend no la devolvio, el rol no deberia ver la
 * pantalla en absoluto.
 */
@Injectable({ providedIn: 'root' })
export class PermisosService {
  private readonly menuService = inject(MenuService);

  /**
   * @param pagina valor de OPCION.Pagina, que coincide con la ruta de
   *               Angular (por ejemplo 'usuarios').
   */
  permisosDe(pagina: string): PermisosPantalla {
    for (const modulo of this.menuService.menu()) {
      for (const menu of modulo.menus) {
        const opcion = menu.opciones.find((o) => o.pagina === pagina);
        if (opcion) {
          return {
            consultar: true,
            alta: opcion.alta,
            baja: opcion.baja,
            cambio: opcion.cambio,
            imprimir: opcion.imprimir,
            exportar: opcion.exportar,
          };
        }
      }
    }
    return SIN_PERMISOS;
  }
}
