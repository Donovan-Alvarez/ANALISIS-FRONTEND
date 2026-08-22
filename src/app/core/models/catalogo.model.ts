// Catalogos que alimentan los ComboBox de los mantenimientos.
// Los nombres de campo replican los DTOs del backend para que al conectar
// los endpoints no haya que mapear nada.

/** GET /api/empresas */
export interface Empresa {
  idEmpresa: number;
  nombre: string;
  direccion: string;
  nit: string;
  // Politica de contrasena: la pantalla de Usuarios valida contra estos
  // valores segun la empresa de la sucursal seleccionada.
  passwordLargo: number;
  passwordCantidadMayusculas: number;
  passwordCantidadMinusculas: number;
  passwordCantidadNumeros: number;
  passwordCantidadCaracteresEspeciales: number;
  passwordCantidadCaducidadDias: number;
  passwordIntentosAntesDeBloquear: number;
  passwordCantidadPreguntasValidar: number;
}

/** GET /api/sucursales · GET /api/sucursales/por-empresa/{idEmpresa} */
export interface Sucursal {
  idSucursal: number;
  nombre: string;
  direccion: string;
  idEmpresa: number;
}

/** GET /api/generos */
export interface Genero {
  idGenero: number;
  nombre: string;
}

/** GET /api/status-usuario */
export interface StatusUsuario {
  idStatusUsuario: number;
  nombre: string;
}

/** GET /api/roles */
export interface Role {
  idRole: number;
  nombre: string;
}

/** GET /api/modulos */
export interface Modulo {
  idModulo: number;
  nombre: string;
  ordenMenu: number;
}

/** GET /api/opciones · GET /api/opciones/por-menu/{idMenu} */
export interface Opcion {
  idOpcion: number;
  idMenu: number;
  nombre: string;
  ordenMenu: number;
  pagina: string;
}
