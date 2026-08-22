/* =====================================================================
   DATOS DE DEMOSTRACION — ELIMINAR AL CONECTAR EL BACKEND
   =====================================================================
   Cuando existan los endpoints, se borra este archivo completo:

     MOCK_ROLES    -> GET /api/roles
     MOCK_MODULOS  -> GET /api/modulos
     permisosDe()  -> GET /api/roles/{idRole}/opciones?idModulo={idModulo}

   Ese ultimo endpoint TODAVIA NO EXISTE en el backend: no hay
   RoleOpcionRepository ni controlador que lea o escriba ROLE_OPCION.
   Hay que crearlo junto con el PUT que guarda la cuadricula.
   ===================================================================== */

import { Modulo, Role } from '../../core/models/catalogo.model';
import { PermisoOpcion } from '../../core/models/permiso.model';

export const MOCK_ROLES: Role[] = [
  { idRole: 1, nombre: 'Administrador' },
  { idRole: 2, nombre: 'Sin Opciones' },
  { idRole: 3, nombre: 'Consulta' },
];

export const MOCK_MODULOS: Modulo[] = [{ idModulo: 1, nombre: 'Seguridad', ordenMenu: 1 }];

/** Opciones del modulo, en el mismo orden que las devuelve el menu. */
const OPCIONES_SEGURIDAD: Omit<
  PermisoOpcion,
  'consultar' | 'alta' | 'baja' | 'cambio' | 'imprimir' | 'exportar'
>[] = [
  { idOpcion: 1, nombre: 'Empresas', pagina: 'empresas', menuNombre: 'Parametros Generales' },
  { idOpcion: 2, nombre: 'Sucursales', pagina: 'sucursales', menuNombre: 'Parametros Generales' },
  { idOpcion: 3, nombre: 'Géneros', pagina: 'generos', menuNombre: 'Parametros Generales' },
  {
    idOpcion: 4,
    nombre: 'Estatus Usuario',
    pagina: 'status-usuario',
    menuNombre: 'Parametros Generales',
  },
  { idOpcion: 5, nombre: 'Roles', pagina: 'roles', menuNombre: 'Parametros Generales' },
  { idOpcion: 6, nombre: 'Módulos', pagina: 'modulos', menuNombre: 'Parametros Generales' },
  { idOpcion: 7, nombre: 'Menús', pagina: 'menus', menuNombre: 'Parametros Generales' },
  { idOpcion: 8, nombre: 'Opciones', pagina: 'opciones', menuNombre: 'Parametros Generales' },
  { idOpcion: 9, nombre: 'Usuarios', pagina: 'usuarios', menuNombre: 'Acciones' },
  {
    idOpcion: 10,
    nombre: 'Asignar Opciones a un Role',
    pagina: 'asignacion-permisos',
    menuNombre: 'Acciones',
  },
];

/**
 * Devuelve la cuadricula de permisos de un rol sobre un modulo.
 * Simula lo que respondera el backend.
 */
export function permisosDe(idRole: number, idModulo: number): PermisoOpcion[] {
  if (idModulo !== 1) return [];

  return OPCIONES_SEGURIDAD.map((opcion) => {
    // Administrador: todo activo (igual que los INSERT semilla de ROLE_OPCION).
    if (idRole === 1) {
      return {
        ...opcion,
        consultar: true,
        alta: true,
        baja: true,
        cambio: true,
        imprimir: true,
        exportar: true,
      };
    }
    // Consulta: solo lectura, con impresion y exportacion.
    if (idRole === 3) {
      return {
        ...opcion,
        consultar: true,
        alta: false,
        baja: false,
        cambio: false,
        imprimir: true,
        exportar: true,
      };
    }
    // Sin Opciones: nada marcado.
    return {
      ...opcion,
      consultar: false,
      alta: false,
      baja: false,
      cambio: false,
      imprimir: false,
      exportar: false,
    };
  });
}
