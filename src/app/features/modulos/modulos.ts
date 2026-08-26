import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Modulo } from '../../core/models/modulo.model';
import { ModuloService } from '../../core/services/modulo.service';
import { PermisosService } from '../../core/services/permisos.service';
import { colorParaTexto } from '../../shared/utils/color-chip.util';
import { ModuloFormDialog } from './modulo-form-dialog/modulo-form-dialog';

@Component({
  selector: 'app-modulos',
  imports: [MatIconModule, MatDialogModule],
  templateUrl: './modulos.html',
  styleUrl: './modulos.scss',
})
export class Modulos implements OnInit {
  private readonly moduloService = inject(ModuloService);
  private readonly permisosService = inject(PermisosService);
  private readonly dialog = inject(MatDialog);

  protected readonly modulos = signal<Modulo[]>([]);
  protected readonly colorDe = colorParaTexto;
  protected readonly permisos = computed(() => this.permisosService.permisosDe('modulos'));

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.moduloService.findAll().subscribe(modulos => this.modulos.set(modulos));
  }

  protected nuevoModulo(): void {
    if (!this.permisos().alta) return;
    const ref = this.dialog.open(ModuloFormDialog, { data: null });
    ref.afterClosed().subscribe((resultado?: Modulo) => {
      if (!resultado) return;
      this.moduloService.create(resultado).subscribe({
        next: () => this.cargar(),
        error: err => alert(err?.error?.detail ?? 'No se pudo crear el módulo.'),
      });
    });
  }

  protected editarModulo(modulo: Modulo): void {
    if (!this.permisos().cambio) return;
    const ref = this.dialog.open(ModuloFormDialog, { data: modulo });
    ref.afterClosed().subscribe((resultado?: Modulo) => {
      if (!resultado || !modulo.idModulo) return;
      this.moduloService.update(modulo.idModulo, resultado).subscribe({
        next: () => this.cargar(),
        error: err => alert(err?.error?.detail ?? 'No se pudo actualizar el módulo.'),
      });
    });
  }

  protected eliminarModulo(modulo: Modulo): void {
    if (!this.permisos().baja) return;
    if (!modulo.idModulo) return;
    if (!confirm(`¿Eliminar "${modulo.nombre}"?`)) return;
    this.moduloService.delete(modulo.idModulo).subscribe({
      next: () => this.cargar(),
      error: err => alert(err?.error?.detail ?? 'No se pudo eliminar el módulo.'),
    });
  }
}