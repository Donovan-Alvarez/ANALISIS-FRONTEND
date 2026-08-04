import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'empresas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/empresas/empresas').then(m => m.Empresas)
  },
  {
    path: 'sucursales',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/sucursales/sucursales').then(m => m.Sucursales)
  },
  {
    path: 'generos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/generos/generos').then(m => m.Generos)
  },
  {
    path: 'status-usuario',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/status-usuario/status-usuario').then(m => m.StatusUsuario)
  },
  {
    path: 'roles',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/roles/roles').then(m => m.Roles)
  },
  {
    path: 'modulos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/modulos/modulos').then(m => m.Modulos)
  },
  {
    path: 'menus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/menus/menus').then(m => m.Menus)
  },
  {
    path: 'opciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/opciones/opciones').then(m => m.Opciones)
  },
  {
    path: 'usuarios',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/usuarios/usuarios').then(m => m.Usuarios)
  },
  {
    path: 'asignacion-permisos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/asignacion-permisos/asignacion-permisos').then(m => m.AsignacionPermisos)
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];