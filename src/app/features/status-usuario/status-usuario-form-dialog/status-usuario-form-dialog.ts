import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StatusUsuario } from '../../../core/models/status-usuario.model';

@Component({
  selector: 'app-status-usuario-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './status-usuario-form-dialog.html',
})
export class StatusUsuarioFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<StatusUsuarioFormDialog>);
  protected readonly statusUsuarioExistente = inject<StatusUsuario | null>(MAT_DIALOG_DATA);

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.statusUsuarioExistente?.nombre ?? '', [Validators.required, Validators.maxLength(100)]],
  });

  protected cancelar(): void {
    this.dialogRef.close();
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const resultado: StatusUsuario = {
      ...this.form.getRawValue(),
      idStatusUsuario: this.statusUsuarioExistente?.idStatusUsuario,
    };
    this.dialogRef.close(resultado);
  }
}
