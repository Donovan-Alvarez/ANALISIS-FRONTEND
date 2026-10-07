import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

/**
 * Punto único para pedir confirmación al usuario (D7).
 *
 *   this.confirm.confirmar({ titulo, mensaje })
 *     .pipe(filter(Boolean), switchMap(() => api.delete(id)))
 *     .subscribe(...)
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  /** Emite true si el usuario confirma; false si cancela, pulsa Esc o hace clic fuera. */
  confirmar(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data,
        role: 'alertdialog',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      })
      .afterClosed()
      .pipe(map((resultado) => resultado === true));
  }
}
