import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

/**
 * Bloquea el resto de la app (Shell y sus hijos) mientras el usuario tenga
 * pendiente el cambio obligatorio de contraseña (RequiereCambiarPassword).
 * El backend también lo hace cumplir en /api/** (PermisoAccionInterceptor);
 * este guard es lo que evita que el usuario ni siquiera vea el menú.
 */
export const cambiarPasswordGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.getUsuario()?.requiereCambiarPassword) {
    return true;
  }
  router.navigate(['/cambiar-password-obligatorio']);
  return false;
};
