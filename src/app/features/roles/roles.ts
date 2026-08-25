import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { RolesService } from '../../core/services/roles.service';
import { RolesModel } from '../../core/models/roles.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.scss'
})
export class Roles implements OnInit {
  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);

  displayedColumns: string[] = ['id', 'nombre', 'usuarioCreacion', 'acciones'];
  dataSource = signal<RolesModel[]>([]);

  mostrarFormulario = false;
  editandoId: number | null = null;

  form: FormGroup = this.fb.group({
    nombre: ['', Validators.required]
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.rolesService.listar().subscribe({
      next: (data: RolesModel[]) => this.dataSource.set(data),
      error: (err: any) => console.error('Error al cargar roles', err)
    });
  }

  abrirNuevo(): void {
    this.editandoId = null;
    this.form.reset();
    this.mostrarFormulario = true;
  }

  iniciarEdicion(element: RolesModel): void {
    this.editandoId = element.idRole ?? null;
    this.form.patchValue({
      nombre: element.nombre
    });
    this.mostrarFormulario = true;
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.editandoId = null;
    this.form.reset();
  }

  guardar(): void {
    if (this.form.invalid) return;

    const objetoGuardar: RolesModel = {
      idRole: this.editandoId ?? undefined,
      nombre: this.form.value.nombre
    };

    this.rolesService.guardar(objetoGuardar).subscribe({
      next: () => {
        this.cargarDatos();
        this.cancelar();
      },
      error: (err: any) => console.error('Error al guardar rol', err)
    });
  }

  eliminar(id?: number): void {
    if (!id) return;
    if (confirm('¿Deseas eliminar este rol?')) {
      this.rolesService.eliminar(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err: any) => console.error('Error al eliminar', err)
      });
    }
  }
}
