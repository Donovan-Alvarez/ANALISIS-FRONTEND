// Espejo de UsuarioResponseDTO / UsuarioRequestDTO del backend.

/** Lo que devuelve GET /api/usuarios */
export interface UsuarioResponse {
  idUsuario: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string; // ISO yyyy-MM-dd
  idStatusUsuario: number;
  idGenero: number;
  idSucursal: number;
  idRole: number;
  correoElectronico: string;
  telefonoMovil: string;
  pregunta: string;
  respuesta: string;
  fotografiaBase64: string | null;
  requiereCambiarPassword: boolean;

  // Campos administrados por el sistema: la pantalla los muestra en solo
  // lectura, nunca los envia.
  ultimaFechaIngreso: string | null;
  intentosDeAcceso: number;
  sesionActual: string | null;
  ultimaFechaCambioPassword: string | null;
  fechaCreacion: string | null;
  usuarioCreacion: string | null;
  fechaModificacion: string | null;
  usuarioModificacion: string | null;
}

/** Lo que espera POST /api/usuarios y PUT /api/usuarios/{id} */
export interface UsuarioRequest {
  idUsuario: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  idStatusUsuario: number;
  password: string;
  idGenero: number;
  correoElectronico: string;
  requiereCambiarPassword: boolean;
  fotografiaBase64: string | null;
  telefonoMovil: string;
  idSucursal: number;
  pregunta: string;
  respuesta: string;
  idRole: number;
}

/** Una regla de la politica de contrasena y si la contrasena actual la cumple. */
export interface ReglaPassword {
  texto: string;
  cumple: boolean;
}
