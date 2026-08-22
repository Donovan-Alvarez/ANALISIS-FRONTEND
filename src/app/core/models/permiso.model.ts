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

/** Una fila de la cuadricula: la opcion y sus seis casillas. */
export interface PermisoOpcion {
  idOpcion: number;
  nombre: string;
  pagina: string;
  menuNombre: string;
  consultar: boolean;
  alta: boolean;
  baja: boolean;
  cambio: boolean;
  imprimir: boolean;
  exportar: boolean;
}

/**
 * Permisos del rol autenticado sobre la pantalla que se esta viendo.
 * Se derivan del menu que ya devuelve GET /api/menu/actual.
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
