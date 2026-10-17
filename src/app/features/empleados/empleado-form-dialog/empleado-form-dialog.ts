import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { Empleado, PersonaCombo, StatusPermitido } from '../../../core/models/empleado.model';
import { OpcionCombo } from '../../../core/models/catalogo-jerarquico.model';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { EmpresaService } from '../../../core/services/empresa.services';
import { StatusEmpleadoService } from '../../../core/services/status-empleado.service';

export interface EmpleadoFormData {
  titulo: string;
  /** null en alta; el empleado a editar en cambio. */
  empleado: Empleado | null;
}

/**
 * Formulario de Empleados. Cuatro combos relacionados, mas dos que solo
 * filtran:
 *
 *   Empresa  -> Sucursal        (la empresa no se envia)
 *   Empresa  -> Departamento -> Puesto   (ninguno de los dos se envia)
 *   Persona  (independiente)
 *   Status   (en edicion, limitado a las transiciones validas)
 *
 * En edicion, el combo de Status se llena con
 * GET /api/empleados/{id}/status-permitidos: solo aparecen las transiciones
 * configuradas en FLUJO_STATUS_EMPLEADO mas el status actual. Asi el usuario
 * no puede ni intentar una transicion invalida; aun asi el backend la
 * rechaza por su cuenta (Service + procedimiento).
 */
@Component({
  selector: 'app-empleado-form-dialog',
  imports: [MatInputModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatDialogModule, MatIconModule, DecimalPipe],
  templateUrl: './empleado-form-dialog.html',
  styleUrl: './empleado-form-dialog.scss',
})
export class EmpleadoFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly empleadoService = inject(EmpleadoService);
  private readonly empresaService = inject(EmpresaService);
  private readonly statusEmpleadoService = inject(StatusEmpleadoService);
  private readonly dialogRef = inject(MatDialogRef<EmpleadoFormDialog, boolean>);
  protected readonly data = inject<EmpleadoFormData>(MAT_DIALOG_DATA);

  protected readonly esEdicion = this.data.empleado !== null;
  protected readonly guardando = signal(false);

  protected readonly empresas = signal<OpcionCombo[]>([]);
  protected readonly sucursales = signal<OpcionCombo[]>([]);
  protected readonly departamentos = signal<OpcionCombo[]>([]);
  protected readonly puestos = signal<OpcionCombo[]>([]);
  protected readonly personas = signal<PersonaCombo[]>([]);
  protected readonly statusDisponibles = signal<StatusPermitido[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    // Solo filtran: no se envian al backend.
    idEmpresa: [null as number | null, Validators.required],
    idDepartamento: [null as number | null, Validators.required],

    idPersona: [null as number | null, Validators.required],
    idSucursal: [null as number | null, Validators.required],
    idPuesto: [null as number | null, Validators.required],
    idStatusEmpleado: [null as number | null, Validators.required],
    fechaContratacion: ['', Validators.required],

    ingresoSueldoBase: [0, [Validators.required, Validators.min(0)]],
    ingresoBonificacionDecreto: [250, [Validators.required, Validators.min(0)]],
    ingresoOtrosIngresos: [0, [Validators.required, Validators.min(0)]],
    descuentoIgss: [0, [Validators.required, Validators.min(0)]],
    descuentoIsr: [0, [Validators.required, Validators.min(0)]],
    descuentoInasistencias: [0, [Validators.required, Validators.min(0)]],
  });

  /** Para que el usuario vea el neto mientras captura, igual que lo calculará el backend. */
  protected readonly totales = computed(() => {
    const v = this.valores();
    const ingresos = v.ingresoSueldoBase + v.ingresoBonificacionDecreto + v.ingresoOtrosIngresos;
    const descuentos = v.descuentoIgss + v.descuentoIsr + v.descuentoInasistencias;
    return { ingresos, descuentos, neto: ingresos - descuentos };
  });

  private readonly valores = signal({
    ingresoSueldoBase: 0,
    ingresoBonificacionDecreto: 250,
    ingresoOtrosIngresos: 0,
    descuentoIgss: 0,
    descuentoIsr: 0,
    descuentoInasistencias: 0,
  });

  /** Máximo para el input date: hoy. La fecha de contratación no puede ser futura. */
  protected readonly hoy = new Date().toISOString().slice(0, 10);

  constructor() {
    this.cargarCombosIniciales();
    this.escucharCambiosDeJerarquia();
    this.escucharMontos();

    if (this.data.empleado) {
      this.precargar(this.data.empleado);
    }
  }

  private cargarCombosIniciales(): void {
    this.empresaService
      .findAll()
      .pipe(takeUntilDestroyed())
      .subscribe((lista) =>
        this.empresas.set(lista.map((e) => ({ id: e.idEmpresa!, nombre: e.nombre }))),
      );

    this.empleadoService
      .personas()
      .pipe(takeUntilDestroyed())
      .subscribe((lista) => this.personas.set(lista));

    // En alta no hay transición que validar: se ofrecen todos los status.
    // En edición el combo lo llena precargar() con los permitidos.
    if (!this.esEdicion) {
      this.statusEmpleadoService
        .findAll()
        .pipe(takeUntilDestroyed())
        .subscribe((lista) =>
          this.statusDisponibles.set(
            lista.map((s) => ({
              idStatusEmpleado: s.id,
              nombre: s.nombre,
              nombreEvento: 'Sin cambio',
            })),
          ),
        );
    }
  }

  /**
   * Al cambiar empresa se recargan sucursales y departamentos, y se limpia
   * lo que colgaba de ellos: si no, podría quedar un puesto de otra empresa.
   */
  private escucharCambiosDeJerarquia(): void {
    this.form.controls.idEmpresa.valueChanges.pipe(takeUntilDestroyed()).subscribe((idEmpresa) => {
      this.sucursales.set([]);
      this.departamentos.set([]);
      this.puestos.set([]);
      this.form.controls.idSucursal.setValue(null, { emitEvent: false });
      this.form.controls.idDepartamento.setValue(null, { emitEvent: false });
      this.form.controls.idPuesto.setValue(null, { emitEvent: false });

      if (idEmpresa == null) return;

      this.empleadoService.sucursalesPorEmpresa(idEmpresa).subscribe((lista) => this.sucursales.set(lista));
      this.empleadoService.departamentosPorEmpresa(idEmpresa).subscribe((lista) => this.departamentos.set(lista));
    });

    this.form.controls.idDepartamento.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((idDepartamento) => {
        this.puestos.set([]);
        this.form.controls.idPuesto.setValue(null, { emitEvent: false });
        if (idDepartamento == null) return;

        this.empleadoService.puestosPorDepartamento(idDepartamento).subscribe((lista) => this.puestos.set(lista));
      });
  }

  private escucharMontos(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const v = this.form.getRawValue();
      this.valores.set({
        ingresoSueldoBase: Number(v.ingresoSueldoBase) || 0,
        ingresoBonificacionDecreto: Number(v.ingresoBonificacionDecreto) || 0,
        ingresoOtrosIngresos: Number(v.ingresoOtrosIngresos) || 0,
        descuentoIgss: Number(v.descuentoIgss) || 0,
        descuentoIsr: Number(v.descuentoIsr) || 0,
        descuentoInasistencias: Number(v.descuentoInasistencias) || 0,
      });
    });
  }

  /**
   * En edición hay que reconstruir la jerarquía hacia arriba: el empleado
   * guarda sucursal y puesto, pero los combos de empresa y departamento son
   * los que filtran, así que se deducen y se vuelven a poblar en cadena.
   */
  private precargar(empleado: Empleado): void {
    this.empleadoService.statusPermitidos(empleado.idEmpleado!).subscribe((lista) => {
      this.statusDisponibles.set(lista);
      this.form.controls.idStatusEmpleado.setValue(empleado.idStatusEmpleado, { emitEvent: false });
    });

    this.form.patchValue(
      {
        idPersona: empleado.idPersona,
        fechaContratacion: empleado.fechaContratacion ?? '',
        ingresoSueldoBase: empleado.ingresoSueldoBase ?? 0,
        ingresoBonificacionDecreto: empleado.ingresoBonificacionDecreto ?? 0,
        ingresoOtrosIngresos: empleado.ingresoOtrosIngresos ?? 0,
        descuentoIgss: empleado.descuentoIgss ?? 0,
        descuentoIsr: empleado.descuentoIsr ?? 0,
        descuentoInasistencias: empleado.descuentoInasistencias ?? 0,
      },
      { emitEvent: false },
    );

    // La empresa sale de la sucursal; el departamento viene en el DTO.
    this.empresaService.findAll().subscribe((empresas) => {
      this.empresas.set(empresas.map((e) => ({ id: e.idEmpresa!, nombre: e.nombre })));

      for (const empresa of empresas) {
        this.empleadoService.sucursalesPorEmpresa(empresa.idEmpresa!).subscribe((sucursales) => {
          if (!sucursales.some((s) => s.id === empleado.idSucursal)) return;

          this.form.controls.idEmpresa.setValue(empresa.idEmpresa!, { emitEvent: false });
          this.sucursales.set(sucursales);
          this.form.controls.idSucursal.setValue(empleado.idSucursal, { emitEvent: false });

          this.empleadoService.departamentosPorEmpresa(empresa.idEmpresa!).subscribe((deptos) => {
            this.departamentos.set(deptos);
            const idDepartamento = empleado.idDepartamento ?? null;
            this.form.controls.idDepartamento.setValue(idDepartamento, { emitEvent: false });

            if (idDepartamento == null) return;
            this.empleadoService.puestosPorDepartamento(idDepartamento).subscribe((puestos) => {
              this.puestos.set(puestos);
              this.form.controls.idPuesto.setValue(empleado.idPuesto, { emitEvent: false });
            });
          });
        });
      }
    });
  }

  protected guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    // idEmpresa e idDepartamento no se envían: solo filtran los combos. El
    // backend deriva la empresa de la sucursal y el departamento del puesto.
    const cuerpo: Empleado = {
      idPersona: Number(v.idPersona),
      idSucursal: Number(v.idSucursal),
      idPuesto: Number(v.idPuesto),
      idStatusEmpleado: Number(v.idStatusEmpleado),
      fechaContratacion: v.fechaContratacion,
      ingresoSueldoBase: Number(v.ingresoSueldoBase),
      ingresoBonificacionDecreto: Number(v.ingresoBonificacionDecreto),
      ingresoOtrosIngresos: Number(v.ingresoOtrosIngresos),
      descuentoIgss: Number(v.descuentoIgss),
      descuentoIsr: Number(v.descuentoIsr),
      descuentoInasistencias: Number(v.descuentoInasistencias),
    };

    this.guardando.set(true);
    const peticion = this.data.empleado
      ? this.empleadoService.update(this.data.empleado.idEmpleado!, cuerpo)
      : this.empleadoService.create(cuerpo);

    // El toast de error lo pone el errorInterceptor global; aquí solo se
    // cierra el diálogo cuando salió bien.
    peticion.pipe(finalize(() => this.guardando.set(false))).subscribe(() => this.dialogRef.close(true));
  }

  protected cancelar(): void {
    this.dialogRef.close(false);
  }
}
