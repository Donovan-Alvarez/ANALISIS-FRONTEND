import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Empresa } from '../../core/models/empresa.model';
import { EmpresaService } from '../../core/services/empresa.services';

@Component({
  selector: 'app-empresas',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './empresas.html',
  styleUrl: './empresas.scss',
})
export class Empresas implements OnInit {
  private readonly empresaService = inject(EmpresaService);
  private readonly fb = inject(FormBuilder);

  protected readonly empresas = signal<Empresa[]>([]);
  protected readonly cargando = signal(false);

  protected readonly modalAbierto = signal(false);
  protected readonly modoEdicion = signal(false);
  protected readonly empresaSeleccionada = signal<Empresa | null>(null);
  protected readonly guardando = signal(false);

  protected readonly empresaAEliminar = signal<Empresa | null>(null);
  protected readonly eliminando = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    direccion: ['', Validators.required],
    nit: ['', Validators.required],
    passwordCantidadMayusculas: [1, Validators.required],
    passwordCantidadMinusculas: [1, Validators.required],
    passwordCantidadNumeros: [1, Validators.required],
    passwordCantidadCaracteresEspeciales: [1, Validators.required],
    passwordLargo: [8, Validators.required],
    passwordIntentosAntesDeBloquear: [5, Validators.required],
    passwordCantidadCaducidadDias: [60, Validators.required],
    passwordCantidadPreguntasValidar: [1, Validators.required],
  });

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.empresaService.findAll().subscribe(empresas => {
      this.empresas.set(empresas);
      this.cargando.set(false);
    });
  }

  protected abrirAlta(): void {
    this.modoEdicion.set(false);
    this.empresaSeleccionada.set(null);
    this.form.reset({
      nombre: '', direccion: '', nit: '',
      passwordCantidadMayusculas: 1, passwordCantidadMinusculas: 1,
      passwordCantidadNumeros: 1, passwordCantidadCaracteresEspeciales: 1,
      passwordLargo: 8, passwordIntentosAntesDeBloquear: 5,
      passwordCantidadCaducidadDias: 60, passwordCantidadPreguntasValidar: 1,
    });
    this.modalAbierto.set(true);
  }

  protected abrirEdicion(empresa: Empresa): void {
    this.modoEdicion.set(true);
    this.empresaSeleccionada.set(empresa);
    this.form.reset({ ...empresa });
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
    const valores: Empresa = {
      ...this.form.getRawValue(),
      idEmpresa: this.empresaSeleccionada()?.idEmpresa,
    };

    const peticion = this.modoEdicion() && valores.idEmpresa
      ? this.empresaService.update(valores.idEmpresa, valores)
      : this.empresaService.create(valores);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargar();
      },
      error: () => this.guardando.set(false),
    });
  }

  protected confirmarBaja(empresa: Empresa): void {
    this.empresaAEliminar.set(empresa);
  }

  protected cancelarBaja(): void {
    this.empresaAEliminar.set(null);
  }

  protected eliminar(): void {
    const empresa = this.empresaAEliminar();
    if (!empresa?.idEmpresa) return;

    this.eliminando.set(true);
    this.empresaService.delete(empresa.idEmpresa).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.empresaAEliminar.set(null);
        this.cargar();
      },
      error: () => this.eliminando.set(false),
    });
  }
}