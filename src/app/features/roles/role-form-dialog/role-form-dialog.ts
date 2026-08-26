import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-role-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './role-form-dialog.html',
})
export class RoleFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RoleFormDialog>);
  protected readonly roleExistente = inject<Role | null>(MAT_DIALOG_DATA);

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.roleExistente?.nombre ?? '', [Validators.required, Validators.maxLength(50)]],
  });

  protected cancelar(): void {
    this.dialogRef.close();
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const resultado: Role = { ...this.form.getRawValue(), idRole: this.roleExistente?.idRole };
    this.dialogRef.close(resultado);
  }
}
