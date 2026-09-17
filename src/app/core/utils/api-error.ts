import { HttpErrorResponse } from '@angular/common/http';

/**
 * Saca un mensaje legible del error que devuelve Spring Boot.
 *
 * El cuerpo de error trae { timestamp, status, error, message, path } y,
 * gracias al GlobalExceptionHandler del backend, "message" siempre trae un
 * texto claro y seguro para mostrar tal cual (nunca detalles internos).
 * Los errores de Bean Validation llegan en "errors".
 *
 * Por eso el mensaje del cuerpo tiene prioridad sobre cualquier texto fijo
 * por status: un 401 puede significar "sesión expirada", pero también
 * "usuario o contraseña incorrectos", "cuenta bloqueada" o "cuenta
 * inactiva" (login) — hay que respetar lo que dice el backend en vez de
 * asumir siempre lo mismo. Los textos fijos por status solo se usan como
 * último recurso, cuando no hay cuerpo (p. ej. la respuesta no llegó a
 * tener JSON).
 */
export function mensajeDeError(error: unknown, respaldo = 'Ocurrió un error inesperado'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return respaldo;
  }

  // El backend está caído o el proxy no responde: no hay cuerpo que leer.
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor.';
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

  if (error.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }

  if (error.status === 403) {
    return 'No tienes permiso para realizar esta acción.';
  }

  return respaldo;
}
