import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Modulo } from '../../../core/models/modulo.model';

@Component({
  selector: 'app-modulo-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './modulo-form-dialog.html',
})
export class ModuloFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ModuloFormDialog>);
  protected readonly moduloExistente = inject<Modulo | null>(MAT_DIALOG_DATA);

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.moduloExistente?.nombre ?? '', Validators.required],
    ordenMenu: [this.moduloExistente?.ordenMenu ?? 1, Validators.required],
  });

  protected cancelar(): void {
    this.dialogRef.close();
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const resultado: Modulo = { ...this.form.getRawValue(), idModulo: this.moduloExistente?.idModulo };
    this.dialogRef.close(resultado);
  }
}