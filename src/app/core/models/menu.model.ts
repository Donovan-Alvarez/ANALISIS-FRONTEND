export interface OpcionPermiso {
  idOpcion: number;
  nombre: string;
  ordenMenu: number;
  pagina: string;
  alta: boolean;
  baja: boolean;
  cambio: boolean;
  imprimir: boolean;
  exportar: boolean;
}

export interface MenuConOpciones {
  idMenu: number;
  nombre: string;
  ordenMenu: number;
  opciones: OpcionPermiso[];
}

export interface ModuloConMenus {
  idModulo: number;
  nombre: string;
  ordenMenu: number;
  menus: MenuConOpciones[];
}