import { HttpErrorResponse } from '@angular/common/http';

/**
 * Saca un mensaje legible del error que devuelve Spring Boot.
 *
 * El cuerpo de error trae { timestamp, status, error, message, path } y, para
 * los ResponseStatusException del backend, el motivo real viene en "message"
 * (requiere server.error.include-message=always en application.yaml).
 * Los errores de Bean Validation llegan en "errors".
 */
export function mensajeDeError(error: unknown, respaldo = 'Ocurrió un error inesperado'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return respaldo;
  }

  // El backend está caído o el proxy no responde.
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor.';
  }

  if (error.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }

  if (error.status === 403) {
    return 'No tienes permiso para realizar esta acción.';
  }

  const cuerpo = error.error as
    | { message?: string; error?: string; errors?: { defaultMessage?: string }[] }
    | string
    | null;

  if (typeof cuerpo === 'string' && cuerpo.trim()) {
    return cuerpo;
  }

  if (cuerpo && typeof cuerpo === 'object') {
    const primerError = cuerpo.errors?.[0]?.defaultMessage;
    if (primerError) return primerError;
    if (cuerpo.message && cuerpo.message !== 'No message available') return cuerpo.message;
    if (cuerpo.error) return cuerpo.error;
  }

  return respaldo;
}
