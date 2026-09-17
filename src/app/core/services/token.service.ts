import { Injectable } from '@angular/core';
import { LoginResponse } from '../models/login-response.model';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface UsuarioSesion {
  idUsuario: string;
  nombre: string;
  idRole: number;
  nombreRole: string;
  requiereCambiarPassword: boolean;
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  saveSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    const usuario: UsuarioSesion = {
      idUsuario: response.idUsuario,
      nombre: response.nombre,
      idRole: response.idRole,
      nombreRole: response.nombreRole,
      requiereCambiarPassword: response.requiereCambiarPassword,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUsuario(): UsuarioSesion | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UsuarioSesion) : null;
  }

  /** Se llama al terminar el cambio de password obligatorio, para desbloquear la navegación sin pedir volver a loguearse. */
  marcarPasswordActualizado(): void {
    const usuario = this.getUsuario();
    if (!usuario) return;
    usuario.requiereCambiarPassword = false;
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
