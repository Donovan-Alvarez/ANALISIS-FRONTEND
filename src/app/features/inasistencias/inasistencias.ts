import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { filter, finalize, switchMap } from 'rxjs';
import { Inasistencia, InasistenciaFila, InasistenciaPayload } from '../../core/models/inasistencia.model';
import { ColumnaExport, ExportacionService, textoCelda } from '../../core/services/exportacion.service';
import { InasistenciaService } from '../../core/services/inasistencia.service';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { fechaHoraTexto } from '../../core/utils/fecha-hora';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { InasistenciaFormData, InasistenciaFormDialog } from './inasistencia-form-dialog/inasistencia-form-dialog';


const SLUG = 'inasistencias';
const TITULO = 'Inasistencias de empleados';

type FiltroEstado = 'todas' | 'pendientes' | 'procesadas';

const COLUMNAS_EXPORT: ColumnaExport[] = [
  { encabezado: 'Empleado', campo: 'nombreEmpleado' },
  { encabezado: 'Puesto', campo: 'nombrePuesto' },
  { encabezado: 'Departamento', campo: 'nombreDepartamento' },
  { encabezado: 'Fecha inicial', campo: 'fechaInicial', formato: 'fecha' },
  { encabezado: 'Fecha final', campo: 'fechaFinal', formato: 'fecha' },
  { encabezado: 'Días', campo: 'dias', formato: 'numero' },
  { encabezado: 'Motivo', campo: 'motivoInasistencia' },
  { encabezado: 'Fecha procesado', campo: 'fechaProcesado', formato: 'fecha' },
  { encabezado: 'Estado', campo: 'estado' },
];


function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

@Component({
  selector: 'app-inasistencias',
  imports: [MatFormFieldModule, MatSelectModule, MatIconModule, MatDialogModule, MatMenuModule],
  templateUrl: './inasistencias.html',
  styleUrl: './inasistencias.scss',
})
export class Inasistencias {
  private readonly inasistenciaService = inject(InasistenciaService);
  private readonly permisosService = inject(PermisosService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  private readonly exportacionService = inject(ExportacionService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);

  protected readonly items = signal<InasistenciaFila[]>([]);
  protected readonly cargando = signal(false);
  protected readonly procesando = signal(false);
  protected readonly filtro = signal('');
  protected readonly estado = signal<FiltroEstado>('todas');

  protected readonly permisos = computed(() => this.permisosService.permisosDe(SLUG));
  protected readonly menuCargado = this.menuService.cargado;
  protected readonly sinAcceso = computed(() => this.menuCargado() && !this.permisos().consultar);

  protected readonly filtrados = computed(() => {
    const texto = normalizar(this.filtro());
    const estado = this.estado();
    return this.items().filter((i) => {
      if (estado === 'pendientes' && i.procesada) return false;
      if (estado === 'procesadas' && !i.procesada) return false;
      if (!texto) return true;
      return [i.nombreEmpleado, i.nombrePuesto, i.nombreDepartamento, i.motivoInasistencia ?? '']
        .some((campo) => normalizar(campo).includes(texto));
    });
  });

  protected readonly fecha = (valor: string | null) => textoCelda(valor, 'fecha');
  protected readonly fechaHora = fechaHoraTexto;

  private yaCargado = false;

  constructor() {
    
    effect(() => {
      if (this.menuCargado() && this.permisos().consultar && !this.yaCargado) {
        this.yaCargado = true;
        untracked(() => this.cargar());
      }
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.inasistenciaService
      .findAll()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((lista) =>
        this.items.set(lista.map((i) => ({ ...i, estado: i.procesada ? 'Procesada' : 'Pendiente' }))),
      );
  }

  protected cambiarEstado(valor: string): void {
    this.estado.set(valor as FiltroEstado);
  }


  protected nueva(): void {
    if (!this.permisos().alta) return;
    this.abrirFormulario(
      'Nueva inasistencia',
      null,
      (payload) => this.inasistenciaService.create(payload),
      'Inasistencia registrada',
    );
  }

  protected editar(item: Inasistencia): void {
    if (!this.permisos().cambio || item.procesada) return;
    this.abrirFormulario(
      'Editar inasistencia',
      item,
      (payload) => this.inasistenciaService.update(item.idInasistencia, payload),
      'Inasistencia actualizada',
    );
  }

  private abrirFormulario(
    titulo: string,
    inasistencia: Inasistencia | null,
    guardar: (payload: InasistenciaPayload) => ReturnType<InasistenciaService['create']>,
    mensajeExito: string,
  ): void {
    const data: InasistenciaFormData = { titulo, inasistencia, guardar };
    this.dialog
      .open<InasistenciaFormDialog, InasistenciaFormData, boolean>(InasistenciaFormDialog, { data, width: '560px' })
      .afterClosed()
      .pipe(filter((guardado) => guardado === true))
      .subscribe(() => {
        this.notificationService.success(mensajeExito);
        this.cargar();
      });
  }


  protected eliminar(item: Inasistencia): void {
    if (!this.permisos().baja || item.procesada) return;
    this.confirmDialog
      .confirmar({
        titulo: '¿Eliminar inasistencia?',
        mensaje: `Se eliminará la inasistencia de "${item.nombreEmpleado}" del ${this.fecha(item.fechaInicial)} al ${this.fecha(item.fechaFinal)}. Esta acción no se puede deshacer.`,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.procesando.set(true);
          return this.inasistenciaService.delete(item.idInasistencia).pipe(finalize(() => this.procesando.set(false)));
        }),
      )
      .subscribe(() => {
        this.notificationService.success('Inasistencia eliminada');
        this.cargar();
      });
  }

  

  protected imprimir(): Promise<void> {
    if (!this.permisos().imprimir) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.imprimir(TITULO, COLUMNAS_EXPORT, this.filtrados()));
  }

  protected exportarPdf(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.exportarPdf(TITULO, COLUMNAS_EXPORT, this.filtrados()));
  }

  protected exportarExcel(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.exportarExcel(TITULO, COLUMNAS_EXPORT, this.filtrados()));
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