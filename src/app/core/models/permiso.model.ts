// Permisos de un rol sobre una opcion del sistema (tabla ROLE_OPCION).

/** Las seis acciones que administra la pantalla de asignacion. */
export type AccionPermiso =
  | 'consultar'
  | 'alta'
  | 'baja'
  | 'cambio'
  | 'imprimir'
  | 'exportar';

export const ACCIONES_PERMISO: readonly { clave: AccionPermiso; etiqueta: string }[] = [
  { clave: 'consultar', etiqueta: 'Consultar' },
  { clave: 'alta', etiqueta: 'Alta' },
  { clave: 'baja', etiqueta: 'Baja' },
  { clave: 'cambio', etiqueta: 'Cambio' },
  { clave: 'imprimir', etiqueta: 'Imprimir' },
  { clave: 'exportar', etiqueta: 'Exportar' },
];

/**
 * Una opcion con sus seis casillas, tal como la devuelve el backend en
 * OpcionAsignacionDTO.
 *
 * OJO con "consultar": no es una columna de ROLE_OPCION. El backend lo deriva
 * de la existencia de la fila (IdRole + IdOpcion). Al guardar, si las seis
 * casillas van en false la fila se borra; si al menos una va en true, se
 * inserta. Por eso desmarcar todo equivale a quitarle la opcion al rol.
 */
export interface OpcionAsignacion {
  idOpcion: number;
  nombre: string;
  consultar: boolean;
  alta: boolean;
  baja: boolean;
  cambio: boolean;
  imprimir: boolean;
  exportar: boolean;
}

/** Agrupacion por menu que devuelve el backend (MenuAsignacionDTO). */
export interface MenuAsignacion {
  idMenu: number;
  nombre: string;
  opciones: OpcionAsignacion[];
}

/** Respuesta completa de GET /api/roles/{idRole}/opciones/por-modulo/{idModulo} */
export interface RoleOpcionesResponse {
  idRole: number;
  idModulo: number;
  menus: MenuAsignacion[];
}

/** Cuerpo de cada elemento del PUT del mismo endpoint. */
export interface OpcionPermisoRequest {
  idOpcion: number;
  consultar: boolean;
  alta: boolean;
  baja: boolean;
  cambio: boolean;
  imprimir: boolean;
  exportar: boolean;
}

/**
 * Permisos del rol autenticado sobre la pantalla que se esta viendo.
 * Se derivan del menu que devuelve GET /api/menu/actual.
 */
export interface PermisosPantalla {
  consultar: boolean;
  alta: boolean;
  baja: boolean;
  cambio: boolean;
  imprimir: boolean;
  exportar: boolean;
}

/** Sin permisos: es lo que se aplica si la pantalla no esta en el menu del rol. */
export const SIN_PERMISOS: PermisosPantalla = {
  consultar: false,
  alta: false,
  baja: false,
  cambio: false,
  imprimir: false,
  exportar: false,
};
