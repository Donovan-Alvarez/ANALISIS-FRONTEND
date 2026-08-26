import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { StatusUsuario as StatusUsuarioModel } from '../../core/models/status-usuario.model';
import { StatusUsuarioService } from '../../core/services/status-usuario.service';
import { StatusUsuarioFormDialog } from './status-usuario-form-dialog/status-usuario-form-dialog';

@Component({
  selector: 'app-status-usuario',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './status-usuario.html',
  styleUrl: './status-usuario.scss',
})
export class StatusUsuario implements OnInit {
  private readonly statusUsuarioService = inject(StatusUsuarioService);
  private readonly dialog = inject(MatDialog);

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
      this.statusUsuarioService.create(resultado).subscribe(() => this.cargar());
    });
  }

  protected editarStatusUsuario(statusUsuario: StatusUsuarioModel): void {
    const ref = this.dialog.open(StatusUsuarioFormDialog, { data: statusUsuario });
    ref.afterClosed().subscribe((resultado?: StatusUsuarioModel) => {
      if (!resultado || !statusUsuario.idStatusUsuario) return;
      this.statusUsuarioService.update(statusUsuario.idStatusUsuario, resultado).subscribe(() => this.cargar());
    });
  }

  protected eliminarStatusUsuario(statusUsuario: StatusUsuarioModel): void {
    if (!statusUsuario.idStatusUsuario) return;
    if (!confirm(`¿Eliminar "${statusUsuario.nombre}"?`)) return;
    this.statusUsuarioService.delete(statusUsuario.idStatusUsuario).subscribe(() => this.cargar());
  }
}
