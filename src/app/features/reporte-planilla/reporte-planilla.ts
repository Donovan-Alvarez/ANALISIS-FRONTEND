import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Subscription, finalize } from 'rxjs';
import { PeriodoReporte, ReportePlanillaResultado } from '../../core/models/reporte-planilla.model';
import { ColumnaExport, ExportacionService, textoCelda } from '../../core/services/exportacion.service';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { ReportePlanillaService } from '../../core/services/reporte-planilla.service';
import { etiquetaPeriodo, fechaHoraTexto } from '../../core/utils/fecha-hora';
import { Paginacion } from '../../core/utils/paginacion';

const SLUG = 'reporte-planilla';

interface PeriodoFila extends PeriodoReporte {
  clave: string;
  etiqueta: string;
}

const COLUMNAS_EXPORT: ColumnaExport[] = [
  { encabezado: 'Empleado', campo: 'nombreEmpleado' },
  { encabezado: 'Puesto', campo: 'nombrePuesto' },
  { encabezado: 'Sueldo base', campo: 'ingresoSueldoBase', formato: 'moneda' },
  { encabezado: 'Bonificación', campo: 'ingresoBonificacionDecreto', formato: 'moneda' },
  { encabezado: 'Otros ingresos', campo: 'ingresoOtrosIngresos', formato: 'moneda' },
  { encabezado: 'Total ingresos', campo: 'totalIngresos', formato: 'moneda' },
  { encabezado: 'IGSS', campo: 'descuentoIgss', formato: 'moneda' },
  { encabezado: 'ISR', campo: 'descuentoIsr', formato: 'moneda' },
  { encabezado: 'Inasistencias', campo: 'descuentoInasistencias', formato: 'moneda' },
  { encabezado: 'Total descuentos', campo: 'totalDescuentos', formato: 'moneda' },
  { encabezado: 'Salario neto', campo: 'salarioNeto', formato: 'moneda' },
];

const clave = (anio: number, mes: number) => `${anio}-${mes}`;

/** Reporte de solo lectura: no tiene Nuevo/Editar/Eliminar; solo Consultar, Imprimir y Exportar. */
@Component({
  selector: 'app-reporte-planilla',
  imports: [MatPaginatorModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatMenuModule],
  templateUrl: './reporte-planilla.html',
  styleUrl: './reporte-planilla.scss',
})
export class ReportePlanilla {
  private readonly reporteService = inject(ReportePlanillaService);
  private readonly permisosService = inject(PermisosService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  private readonly exportacionService = inject(ExportacionService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly pag = new Paginacion(() => this.reporte()?.detalle ?? []);

  protected readonly periodos = signal<PeriodoFila[]>([]);
  protected readonly claveSeleccionada = signal('');
  protected readonly reporte = signal<ReportePlanillaResultado | null>(null);
  protected readonly cargandoPeriodos = signal(false);
  protected readonly cargandoReporte = signal(false);
  protected readonly procesando = signal(false);

  protected readonly permisos = computed(() => this.permisosService.permisosDe(SLUG));
  protected readonly menuCargado = this.menuService.cargado;
  protected readonly sinAcceso = computed(() => this.menuCargado() && !this.permisos().consultar);

  protected readonly titulo = computed(() => {
    const r = this.reporte();
    return r ? `Reporte de planilla ${etiquetaPeriodo(r.anio, r.mes)}` : 'Reporte de planilla';
  });

  protected readonly moneda = (valor: number | null | undefined) => textoCelda(valor, 'moneda') || '—';
  protected readonly fecha = (valor: string | null) => textoCelda(valor, 'fecha');
  protected readonly fechaHora = fechaHoraTexto;

  private yaCargado = false;
  private peticion?: Subscription;

  constructor() {
    effect(() => {
      if (this.menuCargado() && this.permisos().consultar && !this.yaCargado) {
        this.yaCargado = true;
        untracked(() => this.cargarPeriodos());
      }
    });
    this.destroyRef.onDestroy(() => this.peticion?.unsubscribe());
  }

  private cargarPeriodos(): void {
    this.cargandoPeriodos.set(true);
    this.reporteService
      .periodos()
      .pipe(
        finalize(() => this.cargandoPeriodos.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((lista) => {
        this.periodos.set(
          lista.map((p) => ({ ...p, clave: clave(p.anio, p.mes), etiqueta: etiquetaPeriodo(p.anio, p.mes) })),
        );
        // Abre el más reciente para que el reporte no arranque vacío.
        if (lista.length && !this.claveSeleccionada()) {
          this.seleccionar(clave(lista[0].anio, lista[0].mes));
        }
      });
  }

  protected seleccionar(valor: string): void {
    this.peticion?.unsubscribe();
    this.claveSeleccionada.set(valor);
    this.reporte.set(null);
    const periodo = this.periodos().find((p) => p.clave === valor);
    if (!periodo || !this.permisos().consultar) {
      this.cargandoReporte.set(false);
      return;
    }

    this.cargandoReporte.set(true);
    this.peticion = this.reporteService
      .obtener(periodo.anio, periodo.mes)
      .pipe(finalize(() => this.cargandoReporte.set(false)))
      .subscribe((r) => this.reporte.set(r));
  }

  /** Filas a imprimir/exportar: el detalle más la fila de totales generales al final. */
  private filasExport(r: ReportePlanillaResultado): object[] {
    const t = r.totales;
    return [
      ...r.detalle,
      {
        nombreEmpleado: `TOTAL GENERAL (${t.empleados} empleados)`,
        nombrePuesto: '',
        ingresoSueldoBase: t.ingresoSueldoBase,
        ingresoBonificacionDecreto: t.ingresoBonificacionDecreto,
        ingresoOtrosIngresos: t.ingresoOtrosIngresos,
        totalIngresos: t.totalIngresos,
        descuentoIgss: t.descuentoIgss,
        descuentoIsr: t.descuentoIsr,
        descuentoInasistencias: t.descuentoInasistencias,
        totalDescuentos: t.totalDescuentos,
        salarioNeto: t.salarioNeto,
      },
    ];
  }

  protected imprimir(): Promise<void> {
    const r = this.reporte();
    if (!this.permisos().imprimir || !r) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.imprimir(this.titulo(), COLUMNAS_EXPORT, this.filasExport(r)));
  }

  protected exportarPdf(): Promise<void> {
    const r = this.reporte();
    if (!this.permisos().exportar || !r) return Promise.resolve();
    return this.ejecutar(() =>
      this.exportacionService.exportarPdf(this.titulo(), COLUMNAS_EXPORT, this.filasExport(r)),
    );
  }

  protected exportarExcel(): Promise<void> {
    const r = this.reporte();
    if (!this.permisos().exportar || !r) return Promise.resolve();
    return this.ejecutar(() =>
      this.exportacionService.exportarExcel(this.titulo(), COLUMNAS_EXPORT, this.filasExport(r)),
    );
  }

  private async ejecutar(accion: () => Promise<void>): Promise<void> {
    if (this.procesando()) return;
    this.procesando.set(true);
    try {
      await accion();
    } catch (error) {
      console.error(error);
      this.notificationService.error('No se pudo generar el archivo', 'Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.procesando.set(false);
    }
  }
}
