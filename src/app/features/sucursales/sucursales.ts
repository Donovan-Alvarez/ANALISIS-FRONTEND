import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { Empresa } from '../../core/models/empresa.model';
import { Sucursal } from '../../core/models/sucursal.model';
import { EmpresaService } from '../../core/services/empresa.services';
import { SucursalService } from '../../core/services/sucursal.service';

interface SucursalConEmpresa extends Sucursal {
  nombreEmpresa: string;
}

@Component({
  selector: 'app-sucursales',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './sucursales.html',
  styleUrl: './sucursales.scss',
})
export class Sucursales implements OnInit {
  private readonly sucursalService = inject(SucursalService);
  private readonly empresaService = inject(EmpresaService);
  private readonly fb = inject(FormBuilder);

  protected readonly sucursales = signal<SucursalConEmpresa[]>([]);
  protected readonly empresas = signal<Empresa[]>([]);
  protected readonly cargando = signal(false);

  protected readonly modalAbierto = signal(false);
  protected readonly modoEdicion = signal(false);
  protected readonly sucursalSeleccionada = signal<Sucursal | null>(null);
  protected readonly guardando = signal(false);

  protected readonly sucursalAEliminar = signal<Sucursal | null>(null);
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
    }).subscribe(({ sucursales, empresas }) => {
      this.empresas.set(empresas);
      const mapa = new Map(empresas.map(e => [e.idEmpresa, e.nombre]));
      this.sucursales.set(sucursales.map(s => ({ ...s, nombreEmpresa: mapa.get(s.idEmpresa) ?? '—' })));
      this.cargando.set(false);
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

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargar();
      },
      error: () => this.guardando.set(false),
    });
  }

  protected confirmarBaja(sucursal: Sucursal): void {
    this.sucursalAEliminar.set(sucursal);
  }

  protected cancelarBaja(): void {
    this.sucursalAEliminar.set(null);
  }

  protected eliminar(): void {
    const sucursal = this.sucursalAEliminar();
    if (!sucursal?.idSucursal) return;

    this.eliminando.set(true);
    this.sucursalService.delete(sucursal.idSucursal).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.sucursalAEliminar.set(null);
        this.cargar();
      },
      error: () => this.eliminando.set(false),
    });
  }
}