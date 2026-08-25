import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { Menu } from '../../core/models/menu.model';
import { Modulo } from '../../core/models/modulo.model';
import { MenuMantenimientoService } from '../../core/services/menu-mantenimiento.service';
import { ModuloService } from '../../core/services/modulo.service';
import { MenuFormDialog } from './menu-form-dialog/menu-form-dialog';

interface MenuConModulo extends Menu {
  nombreModulo: string;
}

@Component({
  selector: 'app-menus',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './menus.html',
  styleUrl: './menus.scss',
})
export class Menus implements OnInit {
  private readonly menuService = inject(MenuMantenimientoService);
  private readonly moduloService = inject(ModuloService);
  private readonly dialog = inject(MatDialog);

  protected readonly menus = signal<MenuConModulo[]>([]);
  protected readonly modulos = signal<Modulo[]>([]);
  protected readonly columnas = ['nombre', 'ordenMenu', 'nombreModulo', 'acciones'];

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
    const ref = this.dialog.open(MenuFormDialog, {
      data: { menu: null, modulos: this.modulos() },
    });
    ref.afterClosed().subscribe((resultado?: Menu) => {
      if (!resultado) return;
      this.menuService.create(resultado).subscribe({
        next: () => this.cargar(),
        error: err => alert(err?.error?.detail ?? 'No se pudo crear el menú.'),
      });
    });
  }

  protected editarMenu(menu: Menu): void {
    const ref = this.dialog.open(MenuFormDialog, {
      data: { menu, modulos: this.modulos() },
    });
    ref.afterClosed().subscribe((resultado?: Menu) => {
      if (!resultado || !menu.idMenu) return;
      this.menuService.update(menu.idMenu, resultado).subscribe({
        next: () => this.cargar(),
        error: err => alert(err?.error?.detail ?? 'No se pudo actualizar el menú.'),
      });
    });
  }

  protected eliminarMenu(menu: Menu): void {
    if (!menu.idMenu) return;
    if (!confirm(`¿Eliminar "${menu.nombre}"?`)) return;
    this.menuService.delete(menu.idMenu).subscribe({
      next: () => this.cargar(),
      error: err => alert(err?.error?.detail ?? 'No se pudo eliminar el menú.'),
    });
  }
}