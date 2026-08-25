import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Menu } from '../../../core/models/menu.model';
import { Opcion } from '../../../core/models/opcion.model';

export interface OpcionDialogData {
  opcion: Opcion | null;
  menus: Menu[];
}

// Debe coincidir exactamente con las rutas hijas registradas en
// app.routes.ts y con las claves de ICONOS_POR_PAGINA en sidebar.ts.
const PAGINAS_DISPONIBLES = [
  'empresas',
  'sucursales',
  'generos',
  'status-usuario',
  'roles',
  'modulos',
  'menus',
  'opciones',
  'usuarios',
  'asignacion-permisos',
];

@Component({
  selector: 'app-opcion-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule],
  templateUrl: './opcion-form-dialog.html',
  styleUrl: './opcion-form-dialog.scss',
})
export class OpcionFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<OpcionFormDialog>);
  protected readonly datos = inject<OpcionDialogData>(MAT_DIALOG_DATA);

  protected readonly menus = this.datos.menus;
  protected readonly paginas = PAGINAS_DISPONIBLES;

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.datos.opcion?.nombre ?? '', Validators.required],
    ordenMenu: [this.datos.opcion?.ordenMenu ?? 1, Validators.required],
    pagina: [this.datos.opcion?.pagina ?? '', Validators.required],
    idMenu: [this.datos.opcion?.idMenu ?? null, Validators.required],
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
    const resultado: Opcion = {
      ...valores,
      idMenu: valores.idMenu as number,
      idOpcion: this.datos.opcion?.idOpcion,
    };
    this.dialogRef.close(resultado);
  }
}