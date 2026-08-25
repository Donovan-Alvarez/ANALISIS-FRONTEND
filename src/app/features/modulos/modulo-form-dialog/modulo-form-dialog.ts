import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Modulo } from '../../../core/models/modulo.model';

@Component({
  selector: 'app-modulo-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule],
  templateUrl: './modulo-form-dialog.html',
  styleUrl: './modulo-form-dialog.scss',
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