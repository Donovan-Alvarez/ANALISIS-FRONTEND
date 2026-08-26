import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { Menu } from '../../core/models/menu.model';
import { Opcion } from '../../core/models/opcion.model';
import { MenuMantenimientoService } from '../../core/services/menu-mantenimiento.service';
import { OpcionService } from '../../core/services/opcion.service';
import { PermisosService } from '../../core/services/permisos.service';
import { colorParaTexto } from '../../shared/utils/color-chip.util';
import { OpcionFormDialog } from './opcion-form-dialog/opcion-form-dialog';

interface OpcionConMenu extends Opcion {
  nombreMenu: string;
}

@Component({
  selector: 'app-opciones',
  imports: [MatIconModule, MatDialogModule],
  templateUrl: './opciones.html',
  styleUrl: './opciones.scss',
})
export class Opciones implements OnInit {
  private readonly opcionService = inject(OpcionService);
  private readonly menuService = inject(MenuMantenimientoService);
  private readonly permisosService = inject(PermisosService);
  private readonly dialog = inject(MatDialog);

  protected readonly opciones = signal<OpcionConMenu[]>([]);
  protected readonly menus = signal<Menu[]>([]);
  protected readonly colorDe = colorParaTexto;
  protected readonly permisos = computed(() => this.permisosService.permisosDe('opciones'));

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    forkJoin({
      opciones: this.opcionService.findAll(),
      menus: this.menuService.findAll(),
    }).subscribe(({ opciones, menus }) => {
      this.menus.set(menus);
      const mapa = new Map(menus.map(m => [m.idMenu, m.nombre]));
      this.opciones.set(
        opciones.map(o => ({ ...o, nombreMenu: mapa.get(o.idMenu) ?? '—' })),
      );
    });
  }

  protected nuevaOpcion(): void {
    if (!this.permisos().alta) return;
    const ref = this.dialog.open(OpcionFormDialog, {
      data: { opcion: null, menus: this.menus() },
    });
    ref.afterClosed().subscribe((resultado?: Opcion) => {
      if (!resultado) return;
      this.opcionService.create(resultado).subscribe({
        next: () => this.cargar(),
        error: err => alert(err?.error?.detail ?? 'No se pudo crear la opción.'),
      });
    });
  }

  protected editarOpcion(opcion: Opcion): void {
    if (!this.permisos().cambio) return;
    const ref = this.dialog.open(OpcionFormDialog, {
      data: { opcion, menus: this.menus() },
    });
    ref.afterClosed().subscribe((resultado?: Opcion) => {
      if (!resultado || !opcion.idOpcion) return;
      this.opcionService.update(opcion.idOpcion, resultado).subscribe({
        next: () => this.cargar(),
        error: err => alert(err?.error?.detail ?? 'No se pudo actualizar la opción.'),
      });
    });
  }

  protected eliminarOpcion(opcion: Opcion): void {
    if (!this.permisos().baja) return;
    if (!opcion.idOpcion) return;
    if (!confirm(`¿Eliminar "${opcion.nombre}"?`)) return;
    this.opcionService.delete(opcion.idOpcion).subscribe({
      next: () => this.cargar(),
      error: err => alert(err?.error?.detail ?? 'No se pudo eliminar la opción.'),
    });
  }
}