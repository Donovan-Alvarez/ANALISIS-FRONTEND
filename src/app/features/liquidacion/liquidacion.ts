import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { filter, finalize } from 'rxjs';
import { Liquidacion as LiquidacionModel } from '../../core/models/liquidacion.model';
import { ColumnaExport, ExportacionService, textoCelda, valorDe } from '../../core/services/exportacion.service';
import { LiquidacionService } from '../../core/services/liquidacion.service';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { LiquidacionFormDialog } from './liquidacion-form-dialog/liquidacion-form-dialog';

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Ruta y OPCION.Pagina: 'liquidacion' (singular, como lo sembró el RBAC).
 *
 * No es un CRUD: solo consulta y alta. Una liquidación emitida es historial
 * permanente, así que no hay botones de editar ni eliminar — los permisos
 * Cambio y Baja de esta opción quedan sin uso a propósito.
 */
@Component({
  selector: 'app-liquidacion',
  imports: [MatIconModule, MatDialogModule, MatMenuModule],
  templateUrl: './liquidacion.html',
  styleUrl: './liquidacion.scss',
})
export class Liquidacion {
  private readonly liquidacionService = inject(LiquidacionService);
  private readonly permisosService = inject(PermisosService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  private readonly exportacionService = inject(ExportacionService);
  private readonly dialog = inject(MatDialog);

  protected readonly liquidaciones = signal<LiquidacionModel[]>([]);
  protected readonly cargando = signal(false);
  protected readonly procesando = signal(false);
  protected readonly filtro = signal('');

  protected readonly permisos = computed(() => this.permisosService.permisosDe('liquidacion'));
  protected readonly menuCargado = this.menuService.cargado;
  protected readonly sinAcceso = computed(() => this.menuCargado() && !this.permisos().consultar);

  protected readonly columnas: ColumnaExport[] = [
    { encabezado: 'Empleado', campo: 'nombrePersona' },
    { encabezado: 'Puesto', campo: 'nombrePuesto' },
    { encabezado: 'Contratación', campo: 'fechaContratacion', formato: 'fecha' },
    { encabezado: 'Egreso', campo: 'fechaEgreso', formato: 'fecha' },
    { encabezado: 'Liquidación', campo: 'fechaLiquidacion', formato: 'fecha' },
    { encabezado: 'Motivo', campo: 'motivoEgreso' },
    { encabezado: 'Total ingresos', campo: 'totalIngresos', formato: 'moneda' },
    { encabezado: 'Total descuentos', campo: 'totalDescuentos', formato: 'moneda' },
    { encabezado: 'Salario neto', campo: 'salarioNeto', formato: 'moneda' },
    { encabezado: 'Total neto', campo: 'totalNeto', formato: 'moneda' },
  ];

  protected readonly filtrados = computed(() => {
    const texto = normalizar(this.filtro());
    const lista = this.liquidaciones();
    if (!texto) return lista;
    return lista.filter((l) =>
      this.columnas.some((c) => normalizar(textoCelda(valorDe(l, c.campo), c.formato)).includes(texto)),
    );
  });

  protected readonly celda = (fila: LiquidacionModel, campo: string, formato?: ColumnaExport['formato']) =>
    textoCelda(valorDe(fila, campo), formato) || '—';

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
    this.liquidacionService
      .findAll()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((lista) => this.liquidaciones.set(lista));
  }

  protected nueva(): void {
    if (!this.permisos().alta) return;
    this.dialog
      .open<LiquidacionFormDialog, undefined, boolean>(LiquidacionFormDialog, {
        width: '820px',
        panelClass: 'dialog-ancho-amplio',
      })
      .afterClosed()
      .pipe(filter((guardada) => guardada === true))
      .subscribe(() => {
        this.notificationService.success('Liquidación calculada y registrada');
        this.cargar();
      });
  }

  // ── Imprimir / exportar ────────────────────────────────────────────

  protected imprimir(): Promise<void> {
    if (!this.permisos().imprimir) return Promise.resolve();
    return this.ejecutar(() =>
      this.exportacionService.imprimir('Liquidaciones', this.columnas, this.filtrados()),
    );
  }

  protected exportarPdf(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() =>
      this.exportacionService.exportarPdf('Liquidaciones', this.columnas, this.filtrados()),
    );
  }

  protected exportarExcel(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() =>
      this.exportacionService.exportarExcel('Liquidaciones', this.columnas, this.filtrados()),
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
