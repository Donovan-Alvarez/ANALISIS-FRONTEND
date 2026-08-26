import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Genero } from '../../../core/models/genero.model';

@Component({
  selector: 'app-genero-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './genero-form-dialog.html',
})
export class GeneroFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<GeneroFormDialog>);
  protected readonly generoExistente = inject<Genero | null>(MAT_DIALOG_DATA);

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.generoExistente?.nombre ?? '', [Validators.required, Validators.maxLength(100)]],
  });

  protected cancelar(): void {
    this.dialogRef.close();
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const resultado: Genero = { ...this.form.getRawValue(), idGenero: this.generoExistente?.idGenero };
    this.dialogRef.close(resultado);
  }
}
