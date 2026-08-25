import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { StatusUsuarioService, StatusUsuarioModel } from '../../core/services/status-usuario.service';

@Component({
  selector: 'app-status-usuario',
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
  templateUrl: './status-usuario.html',
  styleUrl: './status-usuario.scss'
})
export class StatusUsuario implements OnInit {
  private fb = inject(FormBuilder);
  private statusService = inject(StatusUsuarioService);

  displayedColumns: string[] = ['id', 'nombre', 'usuarioCreacion', 'acciones'];
  dataSource = signal<StatusUsuarioModel[]>([]);

  // Controla si el formulario está visible
  mostrarFormulario = false;
  editandoId: number | null = null;

  form: FormGroup = this.fb.group({
    nombre: ['', Validators.required]
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.statusService.listar().subscribe({
      next: (data: StatusUsuarioModel[]) => this.dataSource.set(data),
      error: (err: unknown) => console.error('Error al cargar status', err)
    });
  }

  abrirNuevo(): void {
    this.editandoId = null;
    this.form.reset();
    this.mostrarFormulario = true;
  }

  iniciarEdicion(element: StatusUsuarioModel): void {
    this.editandoId = element.idStatusUsuario ?? null;
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

    const objetoGuardar: StatusUsuarioModel = {
      idStatusUsuario: this.editandoId ?? undefined,
      nombre: this.form.value.nombre
    };

    this.statusService.guardar(objetoGuardar).subscribe({
      next: () => {
        this.cargarDatos();
        this.cancelar();
      },
      error: (err: unknown) => console.error('Error al guardar', err)
    });
  }

  eliminar(id?: number): void {
    if (!id) return;
    if (confirm('¿Deseas eliminar este registro?')) {
      this.statusService.eliminar(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err: unknown) => console.error('Error al eliminar', err)
      });
    }
  }
}
