import { Injectable, inject } from '@angular/core';
import { PermisosPantalla, SIN_PERMISOS } from '../models/permiso.model';
import { MenuService } from './menu.service';
import { TokenService } from './token.service';

/**
 * Resuelve que puede hacer el rol autenticado sobre una pantalla.
 *
 * No hace peticiones propias: reutiliza el menu que MenuService ya cargo
 * desde GET /api/menu/actual, que sale de ROLE_OPCION y trae los flags por
 * opcion.
 *
 * NOTA sobre "consultar": ROLE_OPCION no tiene columna Consultar; el backend
 * lo deriva de que exista la fila IdRole+IdOpcion. Aqui se aplica el mismo
 * criterio: si la opcion viene en el menu del rol, hay permiso de consulta.
 */
@Injectable({ providedIn: 'root' })
export class PermisosService {
  private readonly menuService = inject(MenuService);
  private readonly tokenService = inject(TokenService);

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

  /** Rol de la sesion actual, o null si no hay sesion guardada. */
  idRoleAutenticado(): number | null {
    return this.tokenService.getUsuario()?.idRole ?? null;
  }
}
