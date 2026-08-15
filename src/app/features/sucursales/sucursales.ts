import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { Empresa } from '../../core/models/empresa.model';
import { Sucursal } from '../../core/models/sucursal.model';
import { EmpresaService } from '../../core/services/empresa.services';
import { SucursalService } from '../../core/services/sucursal.service';
import { SucursalFormDialog } from './sucursal-form-dialog/sucursal-form-dialog';

interface SucursalConEmpresa extends Sucursal {
  nombreEmpresa: string;
}

@Component({
  selector: 'app-sucursales',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './sucursales.html',
  styleUrl: './sucursales.scss',
})
export class Sucursales implements OnInit {
  private readonly sucursalService = inject(SucursalService);
  private readonly empresaService = inject(EmpresaService);
  private readonly dialog = inject(MatDialog);

  protected readonly sucursales = signal<SucursalConEmpresa[]>([]);
  protected readonly empresas = signal<Empresa[]>([]);
  protected readonly columnas = ['nombre', 'direccion', 'nombreEmpresa', 'acciones'];

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    forkJoin({
      sucursales: this.sucursalService.findAll(),
      empresas: this.empresaService.findAll(),
    }).subscribe(({ sucursales, empresas }) => {
      this.empresas.set(empresas);
      const mapa = new Map(empresas.map(e => [e.idEmpresa, e.nombre]));
      this.sucursales.set(
        sucursales.map(s => ({ ...s, nombreEmpresa: mapa.get(s.idEmpresa) ?? '—' })),
      );
    });
  }

  protected nuevaSucursal(): void {
    const ref = this.dialog.open(SucursalFormDialog, {
      data: { sucursal: null, empresas: this.empresas() },
    });
    ref.afterClosed().subscribe((resultado?: Sucursal) => {
      if (!resultado) return;
      this.sucursalService.create(resultado).subscribe(() => this.cargar());
    });
  }

  protected editarSucursal(sucursal: Sucursal): void {
    const ref = this.dialog.open(SucursalFormDialog, {
      data: { sucursal, empresas: this.empresas() },
    });
    ref.afterClosed().subscribe((resultado?: Sucursal) => {
      if (!resultado || !sucursal.idSucursal) return;
      this.sucursalService.update(sucursal.idSucursal, resultado).subscribe(() => this.cargar());
    });
  }

  protected eliminarSucursal(sucursal: Sucursal): void {
    if (!sucursal.idSucursal) return;
    if (!confirm(`¿Eliminar "${sucursal.nombre}"?`)) return;
    this.sucursalService.delete(sucursal.idSucursal).subscribe(() => this.cargar());
  }
}