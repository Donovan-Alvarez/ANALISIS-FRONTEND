import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { EmpleadoLiquidable } from '../../../core/models/liquidacion.model';
import { LiquidacionService } from '../../../core/services/liquidacion.service';

/**
 * Formulario de liquidación. Solo cuatro campos capturables: empleado,
 * fecha de egreso, fecha de liquidación y motivo.
 *
 * El puesto y los montos NO se editan: se muestran en solo lectura tomados
 * del empleado seleccionado, y el backend los vuelve a leer de la base al
 * calcular. Así lo que se ve aquí es informativo y nadie puede alterar los
 * importes de una liquidación desde el navegador.
 *
 * Los totales de abajo son una vista previa con las mismas fórmulas que
 * aplica PR_LIQUIDACION_CALCULAR; los definitivos son los que devuelve el
 * backend.
 */
@Component({
  selector: 'app-liquidacion-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatIconModule, DecimalPipe],
  templateUrl: './liquidacion-form-dialog.html',
  styleUrl: './liquidacion-form-dialog.scss',
})
export class LiquidacionFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly liquidacionService = inject(LiquidacionService);
  private readonly dialogRef = inject(MatDialogRef<LiquidacionFormDialog, boolean>);

  protected readonly empleados = signal<EmpleadoLiquidable[]>([]);
  protected readonly guardando = signal(false);
  protected readonly hoy = new Date().toISOString().slice(0, 10);

  private readonly idEmpleadoSeleccionado = signal<number | null>(null);

  /** El empleado elegido, para mostrar puesto y montos en solo lectura. */
  protected readonly seleccionado = computed(() =>
    this.empleados().find((e) => e.idEmpleado === this.idEmpleadoSeleccionado()) ?? null,
  );

  /** Vista previa con las mismas fórmulas del procedimiento. */
  protected readonly totales = computed(() => {
    const e = this.seleccionado();
    if (!e) return null;
    const ingresos = e.ingresoSueldoBase + e.ingresoBonificacionDecreto + e.ingresoOtrosIngresos;
    const descuentos = e.descuentoIgss + e.descuentoIsr + e.descuentoInasistencias;
    return {
      ingresos,
      descuentos,
      salarioNeto: e.ingresoSueldoBase - descuentos,
      totalNeto: ingresos - descuentos,
    };
  });

  protected readonly form = this.fb.nonNullable.group({
    idEmpleado: [null as number | null, Validators.required],
    fechaEgreso: ['', Validators.required],
    fechaLiquidacion: ['', Validators.required],
    motivoEgreso: ['', [Validators.required, Validators.maxLength(50)]],
  });

  constructor() {
    this.liquidacionService
      .empleadosLiquidables()
      .pipe(takeUntilDestroyed())
      .subscribe((lista) => this.empleados.set(lista));

    this.form.controls.idEmpleado.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.idEmpleadoSeleccionado.set(id));
  }

  /** La fecha de egreso no puede ser anterior a la contratación del empleado. */
  protected readonly minimoEgreso = computed(() => this.seleccionado()?.fechaContratacion ?? null);

  protected guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.guardando.set(true);

    // El toast de error lo pone el errorInterceptor global.
    this.liquidacionService
      .calcular({
        idEmpleado: Number(v.idEmpleado),
        fechaEgreso: v.fechaEgreso,
        fechaLiquidacion: v.fechaLiquidacion,
        motivoEgreso: v.motivoEgreso.trim(),
      })
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe(() => this.dialogRef.close(true));
  }

  protected cancelar(): void {
    this.dialogRef.close(false);
  }
}
