import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { Menu } from '../../core/models/menu.model';
import { Modulo } from '../../core/models/modulo.model';
import { MenuMantenimientoService } from '../../core/services/menu-mantenimiento.service';
import { ModuloService } from '../../core/services/modulo.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { colorParaTexto } from '../../shared/utils/color-chip.util';
import { MenuFormDialog } from './menu-form-dialog/menu-form-dialog';

interface MenuConModulo extends Menu {
  nombreModulo: string;
}

@Component({
  selector: 'app-menus',
  imports: [MatIconModule, MatDialogModule],
  templateUrl: './menus.html',
  styleUrl: './menus.scss',
})
export class Menus implements OnInit {
  private readonly menuService = inject(MenuMantenimientoService);
  private readonly moduloService = inject(ModuloService);
  private readonly permisosService = inject(PermisosService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  protected readonly menus = signal<MenuConModulo[]>([]);
  protected readonly modulos = signal<Modulo[]>([]);
  protected readonly colorDe = colorParaTexto;
  protected readonly permisos = computed(() => this.permisosService.permisosDe('menus'));

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    forkJoin({
      menus: this.menuService.findAll(),
      modulos: this.moduloService.findAll(),
    }).subscribe(({ menus, modulos }) => {
      this.modulos.set(modulos);
      const mapa = new Map(modulos.map(m => [m.idModulo, m.nombre]));
      this.menus.set(
        menus.map(m => ({ ...m, nombreModulo: mapa.get(m.idModulo) ?? '—' })),
      );
    });
  }

  protected nuevoMenu(): void {
    if (!this.permisos().alta) return;
    const ref = this.dialog.open(MenuFormDialog, {
      data: { menu: null, modulos: this.modulos() },
    });
    ref.afterClosed().subscribe((resultado?: Menu) => {
      if (!resultado) return;
      this.menuService.create(resultado).subscribe(() => {
        this.cargar();
        this.notificationService.success('Menú creado');
      });
    });
  }

  protected editarMenu(menu: Menu): void {
    if (!this.permisos().cambio) return;
    const ref = this.dialog.open(MenuFormDialog, {
      data: { menu, modulos: this.modulos() },
    });
    ref.afterClosed().subscribe((resultado?: Menu) => {
      if (!resultado || !menu.idMenu) return;
      this.menuService.update(menu.idMenu, resultado).subscribe(() => {
        this.cargar();
        this.notificationService.success('Menú actualizado');
      });
    });
  }

  protected eliminarMenu(menu: Menu): void {
    if (!this.permisos().baja) return;
    if (!menu.idMenu) return;
    if (!confirm(`¿Eliminar "${menu.nombre}"?`)) return;
    this.menuService.delete(menu.idMenu).subscribe(() => {
      this.cargar();
      this.notificationService.success('Menú eliminado');
    });
  }
}