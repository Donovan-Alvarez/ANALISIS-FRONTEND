import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Observable, finalize } from 'rxjs';
import { EmpleadoOpcion, Inasistencia, InasistenciaPayload } from '../../../core/models/inasistencia.model';
import { InasistenciaService } from '../../../core/services/inasistencia.service';

export interface InasistenciaFormData {
  titulo: string;
  /** null = alta. */
  inasistencia: Inasistencia | null;
  /**
   * Hace el POST/PUT. El diálogo se cierra solo si termina bien; ante un
   * 409/400 queda abierto con lo escrito. El toast de error lo pone el
   * errorInterceptor global.
   */
  guardar: (payload: InasistenciaPayload) => Observable<unknown>;
}

const MAX_MOTIVO = 300;

/** 'YYYY-MM-DD' ordena como texto: basta comparar strings. */
function fechasCoherentes(grupo: AbstractControl): ValidationErrors | null {
  const inicial = grupo.get('fechaInicial')?.value as string;
  const final = grupo.get('fechaFinal')?.value as string;
  return inicial && final && final < inicial ? { fechasInvertidas: true } : null;
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** La app es zoneless: todo lo que lee la plantilla vive en signals. */
@Component({
  selector: 'app-inasistencia-form-dialog',
  imports: [MatInputModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatDialogModule, MatIconModule],
  templateUrl: './inasistencia-form-dialog.html',
  styleUrl: './inasistencia-form-dialog.scss',
})
export class InasistenciaFormDialog implements OnInit {
  protected readonly data = inject<InasistenciaFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<InasistenciaFormDialog, boolean>);
  private readonly inasistenciaService = inject(InasistenciaService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly maxMotivo = MAX_MOTIVO;
  protected readonly guardando = signal(false);
  protected readonly cargandoEmpleados = signal(true);
  protected readonly empleados = signal<EmpleadoOpcion[]>([]);
  protected readonly busqueda = signal('');

  protected readonly idEmpleado = new FormControl<number | null>({ value: null, disabled: true }, Validators.required);
  protected readonly fechaInicial = new FormControl(this.data.inasistencia?.fechaInicial?.slice(0, 10) ?? '', {
    nonNullable: true,
    validators: Validators.required,
  });
  protected readonly fechaFinal = new FormControl(this.data.inasistencia?.fechaFinal?.slice(0, 10) ?? '', {
    nonNullable: true,
    validators: Validators.required,
  });
  protected readonly motivo = new FormControl(this.data.inasistencia?.motivoInasistencia ?? '', {
    nonNullable: true,
    validators: Validators.maxLength(MAX_MOTIVO),
  });

  private readonly form = new FormGroup(
    {
      idEmpleado: this.idEmpleado,
      fechaInicial: this.fechaInicial,
      fechaFinal: this.fechaFinal,
      motivo: this.motivo,
    },
    { validators: fechasCoherentes },
  );

  /** Espejo del formulario en signals. */
  private readonly valores = signal(this.form.getRawValue());
  protected readonly fechasInvertidas = signal(false);
  private readonly formularioValido = signal(false);
  protected readonly longitudMotivo = computed(() => this.valores().motivo.length);

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
    () => this.formularioValido() && this.valores().idEmpleado != null && !this.cargandoEmpleados() && !this.guardando(),
  );

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.sincronizar());
    this.cargarEmpleados();
  }

  private cargarEmpleados(): void {
    this.inasistenciaService
      .findEmpleados()
      .pipe(
        finalize(() => {
          this.cargandoEmpleados.set(false);
          this.idEmpleado.enable({ emitEvent: false });
          this.sincronizar();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (lista) => {
          this.empleados.set(lista);
          const inicial = this.data.inasistencia?.idEmpleado ?? null;
          // Solo se preselecciona si sigue en la lista (activo).
          if (inicial != null && lista.some((e) => e.idEmpleado === inicial)) {
            this.idEmpleado.setValue(inicial, { emitEvent: false });
          }
        },
        // Un error HTTP no cierra el diálogo: el toast lo pone el interceptor y el combo queda vacío.
        error: () => this.empleados.set([]),
      });
  }

  private sincronizar(): void {
    this.valores.set(this.form.getRawValue());
    this.fechasInvertidas.set(this.form.hasError('fechasInvertidas'));
    this.formularioValido.set(this.form.valid);
  }

  protected textoVacioEmpleado(): string {
    if (this.cargandoEmpleados()) return 'Cargando…';
    return this.empleados().length ? 'Selecciona…' : 'No hay empleados activos.';
  }

  protected cancelar(): void {
    this.dialogRef.close(false);
  }

  protected guardar(evento?: Event): void {
    evento?.preventDefault();
    if (!this.puedeGuardar()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: InasistenciaPayload = {
      idEmpleado: v.idEmpleado as number,
      fechaInicial: v.fechaInicial,
      fechaFinal: v.fechaFinal,
      motivoInasistencia: v.motivo.trim() || null,
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