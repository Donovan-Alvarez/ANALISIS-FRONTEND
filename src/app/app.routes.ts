import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'recuperar-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/recuperar-password/recuperar-password').then(m => m.RecuperarPassword)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/shell/shell').then(m => m.Shell),
    children: [
      {
        path: 'empresas',
        loadComponent: () =>
          import('./features/empresas/empresas').then(m => m.Empresas)
      },
      {
        path: 'sucursales',
        loadComponent: () =>
          import('./features/sucursales/sucursales').then(m => m.Sucursales)
      },
      {
        path: 'generos',
        loadComponent: () =>
          import('./features/generos/generos').then(m => m.Generos)
      },
      {
        path: 'status-usuario',
        loadComponent: () =>
          import('./features/status-usuario/status-usuario').then(m => m.StatusUsuario)
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/roles/roles').then(m => m.Roles)
      },
      {
        path: 'modulos',
        loadComponent: () =>
          import('./features/modulos/modulos').then(m => m.Modulos)
      },
      {
        path: 'menus',
        loadComponent: () =>
          import('./features/menus/menus').then(m => m.Menus)
      },
      {
        path: 'opciones',
        loadComponent: () =>
          import('./features/opciones/opciones').then(m => m.Opciones)
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/usuarios/usuarios').then(m => m.Usuarios)
      },
      {
        path: 'asignacion-permisos',
        loadComponent: () =>
          import('./features/asignacion-permisos/asignacion-permisos').then(m => m.AsignacionPermisos)
      },
      { path: '', redirectTo: 'empresas', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];