import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationType, Toast, ToastData } from '../../shared/toast/toast';

const DURACION_MS: Record<NotificationType, number> = {
  success: 3500,
  info: 4500,
  warning: 5500,
  error: 6500,
};

/**
 * Punto único para mostrar notificaciones al usuario. Reemplaza el uso
 * directo de MatSnackBar en toda la app: garantiza la misma estética
 * (icono + color según el tipo) y la misma posición (esquina superior
 * derecha) para success/error/warning/info en cualquier pantalla.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(title: string, message?: string): void {
    this.mostrar('success', title, message);
  }

  error(title: string, message?: string): void {
    this.mostrar('error', title, message);
  }

  warning(title: string, message?: string): void {
    this.mostrar('warning', title, message);
  }

  info(title: string, message?: string): void {
    this.mostrar('info', title, message);
  }

  private mostrar(type: NotificationType, title: string, message?: string): void {
    const data: ToastData = { type, title, message };

    this.snackBar.openFromComponent(Toast, {
      data,
      duration: DURACION_MS[type],
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['toast-panel'],
    });
  }
}
