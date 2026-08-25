import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Menu } from '../../../core/models/menu.model';
import { Modulo } from '../../../core/models/modulo.model';

export interface MenuDialogData {
  menu: Menu | null;
  modulos: Modulo[];
}

@Component({
  selector: 'app-menu-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule],
  templateUrl: './menu-form-dialog.html',
  styleUrl: './menu-form-dialog.scss',
})
export class MenuFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<MenuFormDialog>);
  protected readonly datos = inject<MenuDialogData>(MAT_DIALOG_DATA);

  protected readonly modulos = this.datos.modulos;

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.datos.menu?.nombre ?? '', Validators.required],
    ordenMenu: [this.datos.menu?.ordenMenu ?? 1, Validators.required],
    idModulo: [this.datos.menu?.idModulo ?? null, Validators.required],
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
    const resultado: Menu = {
      ...valores,
      idModulo: valores.idModulo as number,
      idMenu: this.datos.menu?.idMenu,
    };
    this.dialogRef.close(resultado);
  }
}