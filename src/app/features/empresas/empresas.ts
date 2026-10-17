import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Empresa } from '../../core/models/empresa.model';
import { EmpresaService } from '../../core/services/empresa.services';
import { NotificationService } from '../../core/services/notification.service';
import { filter, finalize, switchMap } from 'rxjs';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { Paginacion } from '../../core/utils/paginacion';

@Component({
  selector: 'app-empresas',
  imports: [MatPaginatorModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './empresas.html',
  styleUrl: './empresas.scss',
})
export class Empresas implements OnInit {
  private readonly empresaService = inject(EmpresaService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);
  protected readonly pag = new Paginacion(() => this.empresas());

  protected readonly empresas = signal<Empresa[]>([]);
  protected readonly cargando = signal(false);

  protected readonly modalAbierto = signal(false);
  protected readonly modoEdicion = signal(false);
  protected readonly empresaSeleccionada = signal<Empresa | null>(null);
  protected readonly guardando = signal(false);

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
    this.empresaService.findAll().subscribe({
      next: empresas => {
        this.empresas.set(empresas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
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

    const edicion = this.modoEdicion();
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.cargar();
        this.notificationService.success(edicion ? 'Empresa actualizada' : 'Empresa creada');
      },
      error: () => this.guardando.set(false),
    });
  }

  protected confirmarBaja(empresa: Empresa): void {
    const id = empresa.idEmpresa;
    if (!id) return;
    this.confirmDialog
      .confirmar({
        titulo: '¿Eliminar empresa?',
        mensaje: `Se eliminará "${empresa.nombre}". Esta acción no se puede deshacer.`,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.eliminando.set(true);
          return this.empresaService.delete(id).pipe(finalize(() => this.eliminando.set(false)));
        }),
      )
      .subscribe(() => {
        this.cargar();
        this.notificationService.success('Empresa eliminada');
      });
  }
}