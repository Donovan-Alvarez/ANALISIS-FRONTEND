import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Genero } from '../../core/models/genero.model';
import { GeneroService } from '../../core/services/genero.service';
import { GeneroFormDialog } from './genero-form-dialog/genero-form-dialog';

@Component({
  selector: 'app-generos',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './generos.html',
  styleUrl: './generos.scss',
})
export class Generos implements OnInit {
  private readonly generoService = inject(GeneroService);
  private readonly dialog = inject(MatDialog);

  protected readonly generos = signal<Genero[]>([]);
  protected readonly columnas = ['nombre', 'acciones'];

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.generoService.findAll().subscribe(generos => this.generos.set(generos));
  }

  protected nuevoGenero(): void {
    const ref = this.dialog.open(GeneroFormDialog, { data: null });
    ref.afterClosed().subscribe((resultado?: Genero) => {
      if (!resultado) return;
      this.generoService.create(resultado).subscribe(() => this.cargar());
    });
  }

  protected editarGenero(genero: Genero): void {
    const ref = this.dialog.open(GeneroFormDialog, { data: genero });
    ref.afterClosed().subscribe((resultado?: Genero) => {
      if (!resultado || !genero.idGenero) return;
      this.generoService.update(genero.idGenero, resultado).subscribe(() => this.cargar());
    });
  }

  protected eliminarGenero(genero: Genero): void {
    if (!genero.idGenero) return;
    if (!confirm(`¿Eliminar "${genero.nombre}"?`)) return;
    this.generoService.delete(genero.idGenero).subscribe(() => this.cargar());
  }
}
