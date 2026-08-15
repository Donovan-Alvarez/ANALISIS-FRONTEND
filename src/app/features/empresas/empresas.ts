import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Empresa } from '../../core/models/empresa.model';
import { EmpresaService } from '../../core/services/empresa.services';
import { EmpresaFormDialog } from './empresa-form-dialog/empresa-form-dialog';

@Component({
  selector: 'app-empresas',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './empresas.html',
  styleUrl: './empresas.scss',
})
export class Empresas implements OnInit {
  private readonly empresaService = inject(EmpresaService);
  private readonly dialog = inject(MatDialog);

  protected readonly empresas = signal<Empresa[]>([]);
  protected readonly columnas = ['nombre', 'direccion', 'nit', 'acciones'];

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.empresaService.findAll().subscribe(empresas => this.empresas.set(empresas));
  }

  protected nuevaEmpresa(): void {
    const ref = this.dialog.open(EmpresaFormDialog, { data: null });
    ref.afterClosed().subscribe((resultado?: Empresa) => {
      if (!resultado) return;
      this.empresaService.create(resultado).subscribe(() => this.cargar());
    });
  }

  protected editarEmpresa(empresa: Empresa): void {
    const ref = this.dialog.open(EmpresaFormDialog, { data: empresa });
    ref.afterClosed().subscribe((resultado?: Empresa) => {
      if (!resultado || !empresa.idEmpresa) return;
      this.empresaService.update(empresa.idEmpresa, resultado).subscribe(() => this.cargar());
    });
  }

  protected eliminarEmpresa(empresa: Empresa): void {
    if (!empresa.idEmpresa) return;
    if (!confirm(`¿Eliminar "${empresa.nombre}"?`)) return;
    this.empresaService.delete(empresa.idEmpresa).subscribe(() => this.cargar());
  }
}