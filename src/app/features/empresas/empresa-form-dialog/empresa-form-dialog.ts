import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Empresa } from '../../../core/models/empresa.model';

@Component({
  selector: 'app-empresa-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './empresa-form-dialog.html',
})
export class EmpresaFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EmpresaFormDialog>);
  protected readonly empresaExistente = inject<Empresa | null>(MAT_DIALOG_DATA);

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.empresaExistente?.nombre ?? '', Validators.required],
    direccion: [this.empresaExistente?.direccion ?? '', Validators.required],
    nit: [this.empresaExistente?.nit ?? '', Validators.required],
    passwordCantidadMayusculas: [this.empresaExistente?.passwordCantidadMayusculas ?? 1, Validators.required],
    passwordCantidadMinusculas: [this.empresaExistente?.passwordCantidadMinusculas ?? 1, Validators.required],
    passwordCantidadNumeros: [this.empresaExistente?.passwordCantidadNumeros ?? 1, Validators.required],
    passwordCantidadCaracteresEspeciales: [this.empresaExistente?.passwordCantidadCaracteresEspeciales ?? 1, Validators.required],
    passwordLargo: [this.empresaExistente?.passwordLargo ?? 8, Validators.required],
    passwordIntentosAntesDeBloquear: [this.empresaExistente?.passwordIntentosAntesDeBloquear ?? 5, Validators.required],
    passwordCantidadCaducidadDias: [this.empresaExistente?.passwordCantidadCaducidadDias ?? 60, Validators.required],
    passwordCantidadPreguntasValidar: [this.empresaExistente?.passwordCantidadPreguntasValidar ?? 1, Validators.required],
  });

  protected cancelar(): void {
    this.dialogRef.close();
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const resultado: Empresa = { ...this.form.getRawValue(), idEmpresa: this.empresaExistente?.idEmpresa };
    this.dialogRef.close(resultado);
  }
}