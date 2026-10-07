import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';

export interface CatalogoSimpleFormData {
  titulo: string;
  etiqueta: string;
  longitudMaxima: number;
  placeholder?: string;
  /** Nombre actual al editar; vacío al crear. */
  valorInicial: string;
  /**
   * Hace el POST/PUT. El diálogo se cierra solo si termina bien: ante un 409
   * (duplicado) queda abierto con lo que escribió el usuario. El toast de
   * error lo pone el errorInterceptor global.
   */
  guardar: (nombre: string) => Observable<unknown>;
}

function noSoloEspacios(control: AbstractControl<string>): ValidationErrors | null {
  const valor = control.value ?? '';
  return valor.length > 0 && valor.trim().length === 0 ? { soloEspacios: true } : null;
}

@Component({
  selector: 'app-catalogo-simple-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule],
  templateUrl: './catalogo-simple-form-dialog.html',
  styleUrl: './catalogo-simple-form-dialog.scss',
})
export class CatalogoSimpleFormDialog {
  protected readonly data = inject<CatalogoSimpleFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CatalogoSimpleFormDialog, boolean>);

  protected readonly guardando = signal(false);

  protected readonly nombre = new FormControl(this.data.valorInicial, {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(this.data.longitudMaxima), noSoloEspacios],
  });

  protected cancelar(): void {
    this.dialogRef.close(false);
  }

  protected guardar(evento?: Event): void {
    evento?.preventDefault();
    if (this.guardando()) return;
    if (this.nombre.invalid) {
      this.nombre.markAsTouched();
      return;
    }

    this.guardando.set(true);
    this.dialogRef.disableClose = true;
    this.data.guardar(this.nombre.value.trim()).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.guardando.set(false);
        this.dialogRef.disableClose = false;
      },
    });
  }
}
