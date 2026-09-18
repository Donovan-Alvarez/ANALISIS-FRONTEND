import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  type: NotificationType;
  title: string;
  message?: string;
}

const ICONO_POR_TIPO: Record<NotificationType, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

/**
 * Notificación visual (usada vía NotificationService, nunca directo).
 * Se abre con MatSnackBar.openFromComponent para tener control total del
 * contenido y poder darle color/ícono/título/descripción según el tipo,
 * manteniendo la estética del resto de la app.
 */
@Component({
  selector: 'app-toast',
  imports: [MatIconModule],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  protected readonly data = inject<ToastData>(MAT_SNACK_BAR_DATA);
  private readonly snackBarRef = inject(MatSnackBarRef<Toast>);

  protected readonly icono = ICONO_POR_TIPO[this.data.type];

  protected cerrar(): void {
    this.snackBarRef.dismiss();
  }
}
