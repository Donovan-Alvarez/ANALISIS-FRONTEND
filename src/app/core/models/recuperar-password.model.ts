// Espejo del contrato de POST /auth/recuperar-password/*.

/** Body de POST /auth/recuperar-password/pregunta */
export interface PreguntaRequest {
  idUsuario: string;
}

/** Respuesta de POST /auth/recuperar-password/pregunta */
export interface PreguntaResponse {
  pregunta: string;
}

/** Body de POST /auth/recuperar-password/validar-respuesta */
export interface ValidarRespuestaRequest {
  idUsuario: string;
  respuesta: string;
}

/**
 * Respuesta de POST /auth/recuperar-password/validar-respuesta.
 * idToken solo vive en memoria (signal) mientras dura el wizard; nunca se
 * guarda en localStorage ni pasa por TokenService.
 */
export interface ValidarRespuestaResponse {
  idToken: string;
}

/** Body de POST /auth/recuperar-password/cambiar */
export interface CambiarPasswordRequest {
  idToken: string;
  passwordNuevo: string;
}
