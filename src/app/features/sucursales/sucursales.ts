import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { filter, finalize, forkJoin, switchMap } from 'rxjs';
import { Empresa } from '../../core/models/empresa.model';
import { Sucursal } from '../../core/models/sucursal.model';
import { EmpresaService } from '../../core/services/empresa.services';
import { NotificationService } from '../../core/services/notification.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { Paginacion } from '../../core/utils/paginacion';

interface SucursalConEmpresa extends Sucursal {
  nombreEmpresa: string;
}

@Component({
  selector: 'app-sucursales',
  imports: [MatPaginatorModule, MatInputModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './sucursales.html',
  styleUrl: './sucursales.scss',
})
export class Sucursales implements OnInit {
  private readonly sucursalService = inject(SucursalService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly empresaService = inject(EmpresaService);
  private readonly fb = inject(FormBuilder);
  protected readonly pag = new Paginacion(() => this.sucursales());

  protected readonly sucursales = signal<SucursalConEmpresa[]>([]);
  protected readonly empresas = signal<Empresa[]>([]);
  protected readonly cargando = signal(false);

  protected readonly modalAbierto = signal(false);
  protected readonly modoEdicion = signal(false);
  protected readonly sucursalSeleccionada = signal<Sucursal | null>(null);
  protected readonly guardando = signal(false);

  protected readonly eliminando = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    direccion: ['', Validators.required],
    idEmpresa: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    forkJoin({
      sucursales: this.sucursalService.findAll(),
      empresas: this.empresaService.findAll(),
    }).subscribe({
      next: ({ sucursales, empresas }) => {
        this.empresas.set(empresas);
        const mapa = new Map(empresas.map(e => [e.idEmpresa, e.nombre]));
        this.sucursales.set(sucursales.map(s => ({ ...s, nombreEmpresa: mapa.get(s.idEmpresa) ?? '—' })));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected abrirAlta(): void {
    this.modoEdicion.set(false);
    this.sucursalSeleccionada.set(null);
    this.form.reset({ nombre: '', direccion: '', idEmpresa: null });
    this.modalAbierto.set(true);
  }

  protected abrirEdicion(sucursal: Sucursal): void {
    this.modoEdicion.set(true);
    this.sucursalSeleccionada.set(sucursal);
    this.form.reset({ nombre: sucursal.nombre, direccion: sucursal.direccion, idEmpresa: sucursal.idEmpresa });
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const valores = this.form.getRawValue();
    const resultado: Sucursal = {
      nombre: valores.nombre,
      direccion: valores.direccion,
      idEmpresa: valores.idEmpresa as number,
      idSucursal: this.sucursalSeleccionada()?.idSucursal,
    };

    const peticion = this.modoEdicion() && resultado.idSucursal
      ? this.sucursalService.update(resultado.idSucursal, resultado)
      : this.sucursalService.create(resultado);

    const edicion = this.modoEdicion();
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargar();
        this.notificationService.success(edicion ? 'Sucursal actualizada' : 'Sucursal creada');
      },
      error: () => this.guardando.set(false),
    });
  }

  protected confirmarBaja(sucursal: Sucursal): void {
    const id = sucursal.idSucursal;
    if (!id) return;
    this.confirmDialog
      .confirmar({
        titulo: '¿Eliminar sucursal?',
        mensaje: `Se eliminará "${sucursal.nombre}". Esta acción no se puede deshacer.`,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.eliminando.set(true);
          return this.sucursalService.delete(id).pipe(finalize(() => this.eliminando.set(false)));
        }),
      )
      .subscribe(() => {
        this.cargar();
        this.notificationService.success('Sucursal eliminada');
      });
  }
}