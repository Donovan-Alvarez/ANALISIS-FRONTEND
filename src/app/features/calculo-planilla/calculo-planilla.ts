import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { filter, finalize, switchMap } from 'rxjs';
import {
  PeriodoPlanilla,
  PeriodoPlanillaFila,
  ResultadoCalculoPlanilla,
} from '../../core/models/calculo-planilla.model';
import { CalculoPlanillaService } from '../../core/services/calculo-planilla.service';
import { ColumnaExport, ExportacionService, textoCelda } from '../../core/services/exportacion.service';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { etiquetaPeriodo, fechaHoraTexto } from '../../core/utils/fecha-hora';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';


const SLUG = 'calculo-planilla';
const TITULO = 'Planillas calculadas';

const COLUMNAS_EXPORT: ColumnaExport[] = [
  { encabezado: 'Período', campo: 'etiqueta' },
  { encabezado: 'Desde', campo: 'fechaInicio', formato: 'fecha' },
  { encabezado: 'Hasta', campo: 'fechaFin', formato: 'fecha' },
  { encabezado: 'Estado', campo: 'estado' },
  { encabezado: 'Empleados', campo: 'empleadosCalculados', formato: 'numero' },
  { encabezado: 'Total ingresos', campo: 'totalIngresos', formato: 'moneda' },
  { encabezado: 'Total descuentos', campo: 'totalDescuentos', formato: 'moneda' },
  { encabezado: 'Salario neto', campo: 'salarioNeto', formato: 'moneda' },
  { encabezado: 'Procesada', campo: 'fechaHoraProcesada', formato: 'fecha' },
  { encabezado: 'Usuario', campo: 'usuarioProceso' },
];

const aClave = (anio: number, mes: number) => `${anio}-${mes}`;

@Component({
  selector: 'app-calculo-planilla',
  imports: [MatFormFieldModule, MatSelectModule, MatIconModule, MatMenuModule],
  templateUrl: './calculo-planilla.html',
  styleUrl: './calculo-planilla.scss',
})
export class CalculoPlanilla {
  private readonly calculoService = inject(CalculoPlanillaService);
  private readonly permisosService = inject(PermisosService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  private readonly exportacionService = inject(ExportacionService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected readonly periodos = signal<PeriodoPlanilla[]>([]);
  protected readonly cargando = signal(false);
  protected readonly calculando = signal(false);
  protected readonly exportando = signal(false);
  protected readonly claveSeleccionada = signal('');
  protected readonly ultimoResultado = signal<ResultadoCalculoPlanilla | null>(null);

  protected readonly permisos = computed(() => this.permisosService.permisosDe(SLUG));
  protected readonly menuCargado = this.menuService.cargado;
  protected readonly sinAcceso = computed(() => this.menuCargado() && !this.permisos().consultar);

  protected readonly filas = computed<PeriodoPlanillaFila[]>(() =>
    this.periodos().map((p) => ({
      ...p,
      clave: aClave(p.anio, p.mes),
      etiqueta: etiquetaPeriodo(p.anio, p.mes),
      estado: p.calculado ? 'Calculada' : 'Pendiente',
    })),
  );

  protected readonly seleccionado = computed(() => this.filas().find((f) => f.clave === this.claveSeleccionada()) ?? null);

  protected readonly resultadoVisible = computed(() => {
    const r = this.ultimoResultado();
    const s = this.seleccionado();
    return r && s && r.anio === s.anio && r.mes === s.mes ? r : null;
  });

  protected readonly puedeCalcular = computed(() => {
    const s = this.seleccionado();
    return this.permisos().alta && !!s && !s.calculado && !this.calculando();
  });

  protected readonly motivoNoCalcular = computed(() => {
    if (!this.permisos().alta) return 'Tu rol no tiene permiso para calcular planillas';
    const s = this.seleccionado();
    if (!s) return 'Selecciona un período';
    if (s.calculado) return 'Este período ya fue calculado';
    return '';
  });

  protected readonly fecha = (valor: string | null) => textoCelda(valor, 'fecha');
  protected readonly fechaHora = fechaHoraTexto;
  protected readonly moneda = (valor: number | null) => textoCelda(valor, 'moneda') || '—';

  private yaCargado = false;

  constructor() {
 
    effect(() => {
      if (this.menuCargado() && this.permisos().consultar && !this.yaCargado) {
        this.yaCargado = true;
        untracked(() => this.cargar(true));
      }
    });
  }

  private cargar(preseleccionar = false): void {
    this.cargando.set(true);
    this.calculoService
      .findPeriodos()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((lista) => {
        const ordenada = [...lista].sort((a, b) => a.anio - b.anio || a.mes - b.mes);
        this.periodos.set(ordenada);
        if (preseleccionar && !this.claveSeleccionada()) {
          
          const hoy = new Date();
          const actual = ordenada.find((p) => p.anio === hoy.getFullYear() && p.mes === hoy.getMonth() + 1);
          if (actual) this.claveSeleccionada.set(aClave(actual.anio, actual.mes));
        }
      });
  }

  protected seleccionar(clave: string): void {
    this.claveSeleccionada.set(clave);
  }


  protected calcular(): void {
    const periodo = this.seleccionado();
    if (!this.puedeCalcular() || !periodo) return;

    this.confirmDialog
      .confirmar({
        titulo: `¿Calcular la planilla de ${periodo.etiqueta}?`,
        mensaje:
          'Se calculará el salario de cada empleado activo y las inasistencias pendientes quedarán marcadas como procesadas. ' +
          'Esta acción no se puede deshacer.',
        textoConfirmar: 'Calcular planilla',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.calculando.set(true);
          return this.calculoService
            .calcular({ anio: periodo.anio, mes: periodo.mes })
            .pipe(finalize(() => this.calculando.set(false)));
        }),
      )
      .subscribe({
        next: (resultado) => {
          this.ultimoResultado.set(resultado);
          this.notificationService.success(`Planilla de ${periodo.etiqueta} calculada`);
          this.cargar();
        },
       
        error: () => this.cargar(),
      });
  }


  protected imprimir(): Promise<void> {
    if (!this.permisos().imprimir) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.imprimir(TITULO, COLUMNAS_EXPORT, this.filas()));
  }

  protected exportarPdf(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.exportarPdf(TITULO, COLUMNAS_EXPORT, this.filas()));
  }

  protected exportarExcel(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.exportarExcel(TITULO, COLUMNAS_EXPORT, this.filas()));
  }

  private async ejecutar(accion: () => Promise<void>): Promise<void> {
    if (this.exportando() || this.calculando()) return;
    this.exportando.set(true);
    try {
      await accion();
    } catch (error) {
      console.error(error);
      this.notificationService.error('No se pudo generar el archivo', 'Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.exportando.set(false);
    }
  }
}