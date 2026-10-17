import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { filter, finalize, switchMap } from 'rxjs';
import { Empleado } from '../../core/models/empleado.model';
import { ColumnaExport, ExportacionService, textoCelda, valorDe } from '../../core/services/exportacion.service';
import { EmpleadoService } from '../../core/services/empleado.service';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { EmpleadoFormData, EmpleadoFormDialog } from './empleado-form-dialog/empleado-form-dialog';
import { Paginacion } from '../../core/utils/paginacion';

/** Minúsculas y sin tildes, para buscar 'garcia' y encontrar 'García'. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Ruta y OPCION.Pagina: 'empleados'.
 *
 * Permisos: los cinco botones se muestran siempre y se deshabilitan si falta
 * el permiso, igual que en las pantallas de catálogo. Sin "consultar" no se
 * pide la lista.
 *
 * Errores HTTP: el toast lo pone el errorInterceptor global; aquí no se
 * duplica. Por eso los subscribe solo tienen rama de éxito.
 */
@Component({
  selector: 'app-empleados',
  imports: [MatPaginatorModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule, MatMenuModule],
  templateUrl: './empleados.html',
  styleUrl: './empleados.scss',
})
export class Empleados {
  private readonly empleadoService = inject(EmpleadoService);
  private readonly permisosService = inject(PermisosService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  private readonly exportacionService = inject(ExportacionService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  protected readonly pag = new Paginacion(() => this.filtrados());

  protected readonly empleados = signal<Empleado[]>([]);
  protected readonly cargando = signal(false);
  protected readonly procesando = signal(false);
  protected readonly filtro = signal('');

  protected readonly permisos = computed(() => this.permisosService.permisosDe('empleados'));
  protected readonly menuCargado = this.menuService.cargado;
  protected readonly sinAcceso = computed(() => this.menuCargado() && !this.permisos().consultar);

  /** Columnas de la tabla y de los archivos: una sola definición para ambos. */
  protected readonly columnas: ColumnaExport[] = [
    { encabezado: 'Empleado', campo: 'nombrePersona' },
    { encabezado: 'Puesto', campo: 'nombrePuesto' },
    { encabezado: 'Departamento', campo: 'nombreDepartamento' },
    { encabezado: 'Sucursal', campo: 'nombreSucursal' },
    { encabezado: 'Status', campo: 'nombreStatus' },
    { encabezado: 'Contratación', campo: 'fechaContratacion', formato: 'fecha' },
    { encabezado: 'Sueldo base', campo: 'ingresoSueldoBase', formato: 'moneda' },
    { encabezado: 'Bonificación', campo: 'ingresoBonificacionDecreto', formato: 'moneda' },
    { encabezado: 'Otros ingresos', campo: 'ingresoOtrosIngresos', formato: 'moneda' },
    { encabezado: 'IGSS', campo: 'descuentoIgss', formato: 'moneda' },
    { encabezado: 'ISR', campo: 'descuentoIsr', formato: 'moneda' },
    { encabezado: 'Inasistencias', campo: 'descuentoInasistencias', formato: 'moneda' },
  ];

  protected readonly filtrados = computed(() => {
    const texto = normalizar(this.filtro());
    const lista = this.empleados();
    if (!texto) return lista;
    return lista.filter((e) =>
      this.columnas.some((c) => normalizar(textoCelda(valorDe(e, c.campo), c.formato)).includes(texto)),
    );
  });

  protected readonly celda = (fila: Empleado, campo: string, formato?: ColumnaExport['formato']) =>
    textoCelda(valorDe(fila, campo), formato) || '—';

  private yaCargado = false;

  constructor() {
    // Al refrescar (F5) la pantalla se crea antes de que el Shell cargue el
    // menú: se espera a tenerlo para saber si hay permiso de consulta.
    effect(() => {
      if (this.menuCargado() && this.permisos().consultar && !this.yaCargado) {
        this.yaCargado = true;
        untracked(() => this.cargar());
      }
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.empleadoService
      .findAll()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((lista) => this.empleados.set(lista));
  }

  // ── Alta / cambio ──────────────────────────────────────────────────

  protected nuevo(): void {
    if (!this.permisos().alta) return;
    this.abrirFormulario({ titulo: 'Nuevo empleado', empleado: null }, 'Empleado creado');
  }

  protected editar(empleado: Empleado): void {
    if (!this.permisos().cambio) return;
    this.abrirFormulario({ titulo: 'Editar empleado', empleado }, 'Empleado actualizado');
  }

  private abrirFormulario(data: EmpleadoFormData, mensajeExito: string): void {
    this.dialog
      .open<EmpleadoFormDialog, EmpleadoFormData, boolean>(EmpleadoFormDialog, {
        data,
        width: '900px',
        panelClass: 'dialog-ancho-amplio',
      })
      .afterClosed()
      .pipe(filter((guardado) => guardado === true))
      .subscribe(() => {
        this.notificationService.success(mensajeExito);
        this.cargar();
      });
  }

  // ── Baja ───────────────────────────────────────────────────────────

  protected eliminar(empleado: Empleado): void {
    if (!this.permisos().baja) return;
    this.confirmDialog
      .confirmar({
        titulo: '¿Eliminar empleado?',
        mensaje:
          `Se eliminará a "${empleado.nombrePersona}". Esta acción no se puede deshacer. ` +
          'No se podrá eliminar si ya tiene liquidación, inasistencias o cuentas bancarias.',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.procesando.set(true);
          return this.empleadoService
            .delete(empleado.idEmpleado!)
            .pipe(finalize(() => this.procesando.set(false)));
        }),
      )
      .subscribe(() => {
        this.notificationService.success('Empleado eliminado');
        this.cargar();
      });
  }

  // ── Imprimir / exportar (sobre las filas visibles) ──────────────────

  protected imprimir(): Promise<void> {
    if (!this.permisos().imprimir) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.imprimir('Empleados', this.columnas, this.filtrados()));
  }

  protected exportarPdf(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.exportarPdf('Empleados', this.columnas, this.filtrados()));
  }

  protected exportarExcel(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.exportarExcel('Empleados', this.columnas, this.filtrados()));
  }

  private async ejecutar(accion: () => Promise<void>): Promise<void> {
    if (this.procesando()) return;
    this.procesando.set(true);
    try {
      await accion();
    } catch (error) {
      // Lo típico: no se pudo descargar el chunk de jsPDF/ExcelJS (sin red).
      console.error(error);
      this.notificationService.error('No se pudo generar el archivo', 'Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.procesando.set(false);
    }
  }
}
