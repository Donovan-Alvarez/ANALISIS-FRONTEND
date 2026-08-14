import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { GeneroService } from '../../core/services/genero.service';
import { Genero } from '../../core/models/genero.model';

@Component({
  selector: 'app-generos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule
  ],
  templateUrl: './generos.html',
  styleUrl: './generos.scss',
})
export class Generos implements OnInit {
  private fb = inject(FormBuilder);
  private generoService = inject(GeneroService);

  displayedColumns: string[] = ['idGenero', 'nombre', 'acciones'];
  dataSource = signal<Genero[]>([]);

  editandoId = signal<number | null>(null);
  guardando = signal(false);

  form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]]
  });

  ngOnInit(): void {
    this.cargarGeneros();
  }

  cargarGeneros(): void {
    this.generoService.listar().subscribe({
      next: (data) => this.dataSource.set(data),
      error: (err) => console.error('Error al cargar géneros', err)
    });
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) return;

    this.guardando.set(true);

    const generoData: Genero = {
      idGenero: this.editandoId() ?? undefined,
      nombre: this.form.value.nombre
    };

    this.generoService.guardar(generoData).subscribe({
      next: () => {
        this.cargarGeneros();
        this.cancelarEdicion();
        this.guardando.set(false);
      },
      error: (err) => {
        console.error('Error al guardar género', err);
        this.guardando.set(false);
      }
    });
  }

  editar(genero: Genero): void {
    this.editandoId.set(genero.idGenero ?? null);
    this.form.patchValue({ nombre: genero.nombre });
  }

  eliminar(id: number): void {
    if (confirm('¿Está seguro de eliminar este género?')) {
      this.generoService.eliminar(id).subscribe({
        next: () => this.cargarGeneros(),
        error: (err) => console.error('Error al eliminar género', err)
      });
    }
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.reset();
  }
}
