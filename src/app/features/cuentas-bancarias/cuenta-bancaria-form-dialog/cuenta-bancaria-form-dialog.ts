import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Observable, finalize, forkJoin } from 'rxjs';
import { ItemCatalogo } from '../../../core/models/catalogo-simple.model';
import {
  CuentaBancaria,
  CuentaBancariaPayload,
  LONGITUD_MAX_NUMERO_CUENTA,
  LONGITUD_MIN_NUMERO_CUENTA,
  PATRON_NUMERO_CUENTA,
} from '../../../core/models/cuenta-bancaria.model';
import { EmpleadoOpcion } from '../../../core/models/inasistencia.model';
import { BancoService } from '../../../core/services/banco.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';

export interface CuentaBancariaFormData {
  titulo: string;
  /** null = alta. */
  cuenta: CuentaBancaria | null;
  /**
   * Hace el POST/PUT. El diálogo se cierra solo si termina bien; ante un
   * 409/400 queda abierto con lo escrito. El toast de error lo pone el
   * errorInterceptor global.
   */
  guardar: (payload: CuentaBancariaPayload) => Observable<unknown>;
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** La app es zoneless: todo lo que lee la plantilla vive en signals. */
@Component({
  selector: 'app-cuenta-bancaria-form-dialog',
  imports: [MatInputModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatDialogModule, MatIconModule],
  templateUrl: './cuenta-bancaria-form-dialog.html',
  styleUrl: './cuenta-bancaria-form-dialog.scss',
})
export class CuentaBancariaFormDialog implements OnInit {
  protected readonly data = inject<CuentaBancariaFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CuentaBancariaFormDialog, boolean>);
  private readonly cuentaService = inject(CuentaBancariaService);
  private readonly bancoService = inject(BancoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly maxNumero = LONGITUD_MAX_NUMERO_CUENTA;
  protected readonly minNumero = LONGITUD_MIN_NUMERO_CUENTA;
  protected readonly guardando = signal(false);
  protected readonly cargandoOpciones = signal(true);
  protected readonly empleados = signal<EmpleadoOpcion[]>([]);
  protected readonly bancos = signal<ItemCatalogo[]>([]);
  protected readonly busqueda = signal('');

  protected readonly idEmpleado = new FormControl<number | null>({ value: null, disabled: true }, Validators.required);
  protected readonly idBanco = new FormControl<number | null>({ value: null, disabled: true }, Validators.required);
  protected readonly numeroDeCuenta = new FormControl(this.data.cuenta?.numeroDeCuenta ?? '', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(LONGITUD_MIN_NUMERO_CUENTA),
      Validators.maxLength(LONGITUD_MAX_NUMERO_CUENTA),
      Validators.pattern(PATRON_NUMERO_CUENTA),
    ],
  });
  protected readonly activa = new FormControl(this.data.cuenta?.activa ?? true, { nonNullable: true });

  private readonly form = new FormGroup({
    idEmpleado: this.idEmpleado,
    idBanco: this.idBanco,
    numeroDeCuenta: this.numeroDeCuenta,
    activa: this.activa,
  });

  /** Espejo del formulario en signals. */
  private readonly valores = signal(this.form.getRawValue());
  private readonly formularioValido = signal(false);
  protected readonly errorNumero = signal<string | null>(null);

  /** El empleado ya elegido siempre se queda en la lista, aunque no coincida con la búsqueda. */
  protected readonly empleadosFiltrados = computed(() => {
    const texto = normalizar(this.busqueda());
    const elegido = this.valores().idEmpleado;
    if (!texto) return this.empleados();
    return this.empleados().filter(
      (e) =>
        e.idEmpleado === elegido ||
        normalizar(`${e.nombreCompleto} ${e.nombrePuesto} ${e.nombreDepartamento}`).includes(texto),
    );
  });

  protected readonly puedeGuardar = computed(
    () =>
      this.formularioValido() &&
      this.valores().idEmpleado != null &&
      this.valores().idBanco != null &&
      !this.cargandoOpciones() &&
      !this.guardando(),
  );

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.sincronizar());
    this.cargarOpciones();
  }

  private cargarOpciones(): void {
    forkJoin({ empleados: this.cuentaService.findEmpleados(), bancos: this.bancoService.findAll() })
      .pipe(
        finalize(() => {
          this.cargandoOpciones.set(false);
          this.idEmpleado.enable({ emitEvent: false });
          this.idBanco.enable({ emitEvent: false });
          this.sincronizar();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ empleados, bancos }) => {
          this.empleados.set(empleados);
          this.bancos.set(bancos);
          const cuenta = this.data.cuenta;
          if (cuenta && empleados.some((e) => e.idEmpleado === cuenta.idEmpleado)) {
            this.idEmpleado.setValue(cuenta.idEmpleado, { emitEvent: false });
          }
          if (cuenta && bancos.some((b) => b.id === cuenta.idBanco)) {
            this.idBanco.setValue(cuenta.idBanco, { emitEvent: false });
          }
        },
        // Un error HTTP no cierra el diálogo: el toast lo pone el interceptor y los combos quedan vacíos.
        error: () => {
          this.empleados.set([]);
          this.bancos.set([]);
        },
      });
  }

  private sincronizar(): void {
    this.valores.set(this.form.getRawValue());
    this.formularioValido.set(this.form.valid);
    this.errorNumero.set(this.mensajeNumero());
  }

  private mensajeNumero(): string | null {
    const control = this.numeroDeCuenta;
    if (!control.dirty && !control.touched) return null;
    if (control.hasError('required')) return 'El número de cuenta es obligatorio.';
    if (control.hasError('pattern')) return 'Solo dígitos separados por guiones (ej. 001-438715).';
    if (control.hasError('minlength')) return `Mínimo ${LONGITUD_MIN_NUMERO_CUENTA} caracteres.`;
    if (control.hasError('maxlength')) return `Máximo ${LONGITUD_MAX_NUMERO_CUENTA} caracteres.`;
    return null;
  }

  protected tocarNumero(): void {
    this.numeroDeCuenta.markAsTouched();
    this.sincronizar();
  }

  protected textoVacioEmpleado(): string {
    if (this.cargandoOpciones()) return 'Cargando…';
    return this.empleados().length ? 'Selecciona…' : 'No hay empleados registrados.';
  }

  protected textoVacioBanco(): string {
    if (this.cargandoOpciones()) return 'Cargando…';
    return this.bancos().length ? 'Selecciona…' : 'No hay bancos registrados.';
  }

  protected cancelar(): void {
    this.dialogRef.close(false);
  }

  protected guardar(evento?: Event): void {
    evento?.preventDefault();
    if (!this.puedeGuardar()) {
      this.form.markAllAsTouched();
      this.sincronizar();
      return;
    }

    const v = this.form.getRawValue();
    const payload: CuentaBancariaPayload = {
      idEmpleado: v.idEmpleado as number,
      idBanco: v.idBanco as number,
      numeroDeCuenta: v.numeroDeCuenta.trim(),
      activa: v.activa,
    };

    this.guardando.set(true);
    this.dialogRef.disableClose = true;
    this.form.disable({ emitEvent: false });
    this.data.guardar(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.guardando.set(false);
        this.dialogRef.disableClose = false;
        this.form.enable({ emitEvent: false });
        this.sincronizar();
      },
    });
  }
}
