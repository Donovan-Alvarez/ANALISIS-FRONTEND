import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { Menu } from '../../core/models/menu.model';
import { Modulo } from '../../core/models/modulo.model';
import { ModuloService } from '../../core/services/modulo.service';
import { Opcion } from '../../core/models/opcion.model';
import { MenuMantenimientoService } from '../../core/services/menu-mantenimiento.service';
import { OpcionService } from '../../core/services/opcion.service';
import { PermisosService } from '../../core/services/permisos.service';
import { colorParaTexto } from '../../shared/utils/color-chip.util';
import { OpcionFormDialog } from './opcion-form-dialog/opcion-form-dialog';

interface OpcionConMenu extends Opcion {
  nombreMenu: string;
  nombreModulo: string;
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
  private readonly moduloService = inject(MenuMantenimientoService);
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
      modulos: this.moduloService.findAll(),
    }).subscribe(({ opciones, menus, modulos }) => {
      this.menus.set(menus);
      const mapaModulos = new Map(modulos.map(m => [m.idModulo, m.nombre]));
      const mapaMenus = new Map(menus.map(m => [m.idMenu, { nombre: m.nombre, idModulo: m.idModulo }]));
      this.opciones.set(
        opciones.map(o => {
          const menu = mapaMenus.get(o.idMenu);
          return {
            ...o,
            nombreMenu: menu?.nombre ?? '—',
            nombreModulo: menu ? mapaModulos.get(menu.idModulo) ?? '—' : '—',
          };
        }),
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