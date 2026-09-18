import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { TokenService } from '../services/token.service';
import { mensajeDeError } from '../utils/api-error';

/**
 * Rutas cuyos componentes ya muestran su propia notificación contextual
 * (login, recuperar contraseña, usuarios, asignación de permisos) y por lo
 * tanto no necesitan la notificación automática de este interceptor;
 * mostrarla ahí duplicaría el aviso o pisaría un mensaje más específico
 * (p. ej. login distingue "credenciales inválidas" de "sesión expirada"
 * para el mismo 401).
 */
const RUTAS_CON_MANEJO_PROPIO = ['/auth/login', '/auth/recuperar-password', '/api/usuarios'];

function tieneManejoPropio(url: string): boolean {
  return RUTAS_CON_MANEJO_PROPIO.some(ruta => url.includes(ruta)) || url.includes('/opciones/por-modulo/');
}

/**
 * Interceptor global de errores HTTP: garantiza que toda petición fallida
 * que ningún componente maneje explícitamente igual le muestre al usuario
 * una notificación clara (vía NotificationService, con mensajeDeError que
 * nunca expone detalles internos del servidor). Además, ante un 401 en
 * medio de la sesión (token vencido o inválido), cierra la sesión local y
 * redirige a /login.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const tokenService = inject(TokenService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const esPeticionDeLogin = req.url.includes('/auth/login');

        if (error.status === 401 && !esPeticionDeLogin && tokenService.isLoggedIn()) {
          tokenService.clear();
          notificationService.warning('Sesión expirada', 'Vuelve a iniciar sesión para continuar.');
          router.navigateByUrl('/login');
        } else if (!tieneManejoPropio(req.url)) {
          notificationService.error('No se pudo completar la acción', mensajeDeError(error));
        }
      }
      return throwError(() => error);
    }),
  );
};
