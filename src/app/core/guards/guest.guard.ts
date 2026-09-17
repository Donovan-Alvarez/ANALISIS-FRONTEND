import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.isLoggedIn()) {
    return true;
  }
  const rutaDestino = tokenService.getUsuario()?.requiereCambiarPassword
    ? '/cambiar-password-obligatorio'
    : '/empresas';
  router.navigate([rutaDestino]);
  return false;
};