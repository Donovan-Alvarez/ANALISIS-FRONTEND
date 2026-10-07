import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  titulo: string;
  mensaje: string;
  /** Por defecto 'Eliminar'. */
  textoConfirmar?: string;
  /** Por defecto 'Cancelar'. */
  textoCancelar?: string;
  /** 'peligro' (por defecto) pinta el botón de confirmar en rojo. */
  tono?: 'peligro' | 'normal';
}

/**
 * Confirmación compartida que reemplaza window.confirm() (D7).
 * Se abre siempre con ConfirmDialogService.confirmar(), nunca directo.
 * Cierra con true (confirmar) o false/undefined (cancelar, Esc, clic fuera).
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatIconModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  protected readonly peligro = (this.data.tono ?? 'peligro') === 'peligro';
}
