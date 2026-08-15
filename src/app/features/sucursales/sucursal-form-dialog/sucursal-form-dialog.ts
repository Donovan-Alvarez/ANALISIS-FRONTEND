import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Empresa } from '../../../core/models/empresa.model';
import { Sucursal } from '../../../core/models/sucursal.model';

export interface SucursalDialogData {
  sucursal: Sucursal | null;
  empresas: Empresa[];
}

@Component({
  selector: 'app-sucursal-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './sucursal-form-dialog.html',
})
export class SucursalFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SucursalFormDialog>);
  protected readonly datos = inject<SucursalDialogData>(MAT_DIALOG_DATA);

  protected readonly empresas = this.datos.empresas;

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.datos.sucursal?.nombre ?? '', Validators.required],
    direccion: [this.datos.sucursal?.direccion ?? '', Validators.required],
    idEmpresa: [this.datos.sucursal?.idEmpresa ?? null, Validators.required],
  });

  protected cancelar(): void {
    this.dialogRef.close();
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const resultado: Sucursal = {
      ...valores,
      idEmpresa: valores.idEmpresa as number,
      idSucursal: this.datos.sucursal?.idSucursal,
    };
    this.dialogRef.close(resultado);
  }
}