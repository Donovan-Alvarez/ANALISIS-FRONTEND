import { Component, computed, effect, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { BoletasPagoService } from '../../core/services/boletas-pago.service';
import { BoletaPago, PeriodoPago, EmpleadoPago } from '../../core/models/boleta-pago.model';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { ExportacionService, ColumnaExport, textoCelda } from '../../core/services/exportacion.service';
import { etiquetaPeriodo } from '../../core/utils/fecha-hora';

/** Boleta de solo lectura: presenta lo que guardó Calcular Planilla, nunca recalcula el neto. */
@Component({
  selector: 'app-boletas-pago',
  imports: [MatFormFieldModule, MatSelectModule, MatIconModule, MatMenuModule, FormsModule],
  templateUrl: './boletas-pago.html',
  styleUrl: './boletas-pago.scss',
})
export class BoletasPago implements OnDestroy {
  private readonly api = inject(BoletasPagoService);
  private readonly exportacion = inject(ExportacionService);
  private readonly permisosService = inject(PermisosService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  readonly permisos = computed(() => this.permisosService.permisosDe('boletas-pago'));
  readonly menuCargado = this.menuService.cargado;
  readonly sinAcceso = computed(() => this.menuCargado() && !this.permisos().consultar);
  readonly periodos = signal<PeriodoPago[]>([]);
  readonly empleados = signal<EmpleadoPago[]>([]);
  readonly boleta = signal<BoletaPago | null>(null);
  readonly cargando = signal(false);
  readonly procesando = signal(false);
  periodo = '';
  empleado: number | null = null;
  private peticion?: Subscription;
  private inicial?: Subscription;

  readonly etiquetaPeriodo = etiquetaPeriodo;
  readonly moneda = (valor: number | null | undefined) => textoCelda(valor, 'moneda') || '—';
  readonly fecha = (valor: string | null | undefined) => textoCelda(valor, 'fecha');

  /** Subtotales de presentación: suma de las líneas guardadas. El neto es el almacenado. */
  readonly totalIngresos = computed(() => {
    const d = this.boleta()?.detalle;
    return d ? d.ingresoSueldoBase + d.ingresoBonificacionDecreto + d.ingresoOtrosIngresos : 0;
  });
  readonly totalDescuentos = computed(() => {
    const d = this.boleta()?.detalle;
    return d ? d.descuentoIgss + d.descuentoIsr + d.descuentoInasistencias : 0;
  });

  constructor() {
    effect(() => {
      this.inicial?.unsubscribe();
      if (this.permisos().consultar)
        this.inicial = this.api.periodos().subscribe((p) => this.periodos.set(p));
      else {
        this.peticion?.unsubscribe();
        this.boleta.set(null);
        this.periodos.set([]);
        this.empleados.set([]);
        this.cargando.set(false);
      }
    });
  }
  cambiarPeriodo() {
    this.peticion?.unsubscribe();
    this.boleta.set(null);
    this.empleados.set([]);
    this.empleado = null;
    this.cargando.set(false);
    if (!this.permisos().consultar || !this.periodo) return;
    const [a, m] = this.periodo.split('/').map(Number);
    this.cargando.set(true);
    this.peticion = this.api.empleados(a, m).subscribe({
      next: (e) => {
        this.empleados.set(e);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
  consultar() {
    this.peticion?.unsubscribe();
    this.boleta.set(null);
    this.cargando.set(false);
    if (!this.permisos().consultar || !this.periodo || !this.empleado) return;
    const [a, m] = this.periodo.split('/').map(Number);
    this.cargando.set(true);
    this.peticion = this.api.obtener(a, m, this.empleado).subscribe({
      next: (b) => {
        this.boleta.set(b);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
  readonly columnas: ColumnaExport[] = [
    { encabezado: 'Concepto', campo: 'concepto' },
    { encabezado: 'Dato', campo: 'dato' },
    { encabezado: 'Monto', campo: 'monto', formato: 'moneda' },
  ];
  filas() {
    const b = this.boleta();
    if (!b) return [];
    const d = b.detalle;
    return [
      { concepto: 'Empleado', dato: d.empleado },
      { concepto: 'Código empleado', dato: String(d.idEmpleado) },
      { concepto: 'Período', dato: `${d.anio}/${String(d.mes).padStart(2, '0')}` },
      { concepto: 'Puesto', dato: d.puesto },
      { concepto: 'Fecha de contratación', dato: d.fechaContratacion },
      ...b.cuentasActivas.map((c) => ({
        concepto: 'Cuenta activa',
        dato: `${c.banco}: ${c.numeroDeCuenta}`,
      })),
      ...(b.cuentasActivas.length
        ? []
        : [{ concepto: 'Cuenta activa', dato: 'Sin cuenta bancaria activa' }]),
      { concepto: 'Sueldo base', monto: d.ingresoSueldoBase },
      { concepto: 'Bonificación decreto', monto: d.ingresoBonificacionDecreto },
      { concepto: 'Otros ingresos', monto: d.ingresoOtrosIngresos },
      { concepto: 'Descuento IGSS', monto: d.descuentoIgss },
      { concepto: 'Descuento ISR', monto: d.descuentoIsr },
      { concepto: 'Descuento inasistencias', monto: d.descuentoInasistencias },
      { concepto: 'Salario neto', monto: d.salarioNeto },
    ];
  }
  async archivo(tipo: 'imprimir' | 'pdf' | 'excel') {
    if (
      !this.boleta() ||
      this.procesando() ||
      (tipo === 'imprimir' ? !this.permisos().imprimir : !this.permisos().exportar)
    )
      return;
    const d = this.boleta()!.detalle;
    const titulo = `Boleta ${d.anio}-${d.mes} empleado ${d.idEmpleado}`;
    this.procesando.set(true);
    try {
      if (tipo === 'imprimir') await this.exportacion.imprimir(titulo, this.columnas, this.filas());
      else if (tipo === 'pdf')
        await this.exportacion.exportarPdf(titulo, this.columnas, this.filas());
      else await this.exportacion.exportarExcel(titulo, this.columnas, this.filas());
    } catch (error) {
      console.error(error);
      this.notificationService.error('No se pudo generar el archivo', 'Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.procesando.set(false);
    }
  }
  ngOnDestroy() {
    this.peticion?.unsubscribe();
    this.inicial?.unsubscribe();
  }
}
