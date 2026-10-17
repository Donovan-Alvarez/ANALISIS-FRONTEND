import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { filter, switchMap } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { StatusUsuario as StatusUsuarioModel } from '../../core/models/status-usuario.model';
import { NotificationService } from '../../core/services/notification.service';
import { StatusUsuarioService } from '../../core/services/status-usuario.service';
import { StatusUsuarioFormDialog } from './status-usuario-form-dialog/status-usuario-form-dialog';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { Paginacion } from '../../core/utils/paginacion';

@Component({
  selector: 'app-status-usuario',
  imports: [MatPaginatorModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './status-usuario.html',
  styleUrl: './status-usuario.scss',
})
export class StatusUsuario implements OnInit {
  private readonly statusUsuarioService = inject(StatusUsuarioService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmDialog = inject(ConfirmDialogService);
  protected readonly pag = new Paginacion(() => this.statusUsuarios());

  protected readonly statusUsuarios = signal<StatusUsuarioModel[]>([]);
  protected readonly columnas = ['nombre', 'acciones'];

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.statusUsuarioService.findAll().subscribe(statusUsuarios => this.statusUsuarios.set(statusUsuarios));
  }

  protected nuevoStatusUsuario(): void {
    const ref = this.dialog.open(StatusUsuarioFormDialog, { data: null });
    ref.afterClosed().subscribe((resultado?: StatusUsuarioModel) => {
      if (!resultado) return;
      this.statusUsuarioService.create(resultado).subscribe(() => {
        this.cargar();
        this.notificationService.success('Estatus de usuario creado');
      });
    });
  }

  protected editarStatusUsuario(statusUsuario: StatusUsuarioModel): void {
    const ref = this.dialog.open(StatusUsuarioFormDialog, { data: statusUsuario });
    ref.afterClosed().subscribe((resultado?: StatusUsuarioModel) => {
      if (!resultado || !statusUsuario.idStatusUsuario) return;
      this.statusUsuarioService.update(statusUsuario.idStatusUsuario, resultado).subscribe(() => {
        this.cargar();
        this.notificationService.success('Estatus de usuario actualizado');
      });
    });
  }

  protected eliminarStatusUsuario(statusUsuario: StatusUsuarioModel): void {
    const id = statusUsuario.idStatusUsuario;
    if (!id) return;
    this.confirmDialog
      .confirmar({
        titulo: '¿Eliminar estatus de usuario?',
        mensaje: `Se eliminará "${statusUsuario.nombre}". Esta acción no se puede deshacer.`,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.statusUsuarioService.delete(id)),
      )
      .subscribe(() => {
        this.cargar();
        this.notificationService.success('Estatus de usuario eliminado');
      });
  }
}
