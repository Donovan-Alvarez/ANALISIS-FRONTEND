import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { filter, switchMap } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { Role } from '../../core/models/role.model';
import { NotificationService } from '../../core/services/notification.service';
import { RoleService } from '../../core/services/role.service';
import { RoleFormDialog } from './role-form-dialog/role-form-dialog';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-roles',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
})
export class Roles implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected readonly roles = signal<Role[]>([]);
  protected readonly columnas = ['nombre', 'acciones'];

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.roleService.findAll().subscribe(roles => this.roles.set(roles));
  }

  protected nuevoRole(): void {
    const ref = this.dialog.open(RoleFormDialog, { data: null });
    ref.afterClosed().subscribe((resultado?: Role) => {
      if (!resultado) return;
      this.roleService.create(resultado).subscribe(() => {
        this.cargar();
        this.notificationService.success('Rol creado');
      });
    });
  }

  protected editarRole(role: Role): void {
    const ref = this.dialog.open(RoleFormDialog, { data: role });
    ref.afterClosed().subscribe((resultado?: Role) => {
      if (!resultado || !role.idRole) return;
      this.roleService.update(role.idRole, resultado).subscribe(() => {
        this.cargar();
        this.notificationService.success('Rol actualizado');
      });
    });
  }

  protected eliminarRole(role: Role): void {
    const id = role.idRole;
    if (!id) return;
    this.confirmDialog
      .confirmar({
        titulo: '¿Eliminar rol?',
        mensaje: `Se eliminará "${role.nombre}". Esta acción no se puede deshacer.`,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.roleService.delete(id)),
      )
      .subscribe(() => {
        this.cargar();
        this.notificationService.success('Rol eliminado');
      });
  }
}
