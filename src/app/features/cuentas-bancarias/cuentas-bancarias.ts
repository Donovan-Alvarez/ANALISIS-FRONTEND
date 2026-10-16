import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { filter, finalize, switchMap } from 'rxjs';
import { CuentaBancaria, CuentaBancariaFila, CuentaBancariaPayload } from '../../core/models/cuenta-bancaria.model';
import { CuentaBancariaService } from '../../core/services/cuenta-bancaria.service';
import { ColumnaExport, ExportacionService } from '../../core/services/exportacion.service';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import {
  CuentaBancariaFormData,
  CuentaBancariaFormDialog,
} from './cuenta-bancaria-form-dialog/cuenta-bancaria-form-dialog';

const SLUG = 'cuentas-bancarias';
const TITULO = 'Cuentas bancarias de empleados';

type FiltroEstado = 'todas' | 'activas' | 'inactivas';

const COLUMNAS_EXPORT: ColumnaExport[] = [
  { encabezado: 'Empleado', campo: 'nombreEmpleado' },
  { encabezado: 'Puesto', campo: 'nombrePuesto' },
  { encabezado: 'Banco', campo: 'nombreBanco' },
  { encabezado: 'Número de cuenta', campo: 'numeroDeCuenta' },
  { encabezado: 'Estado', campo: 'estado' },
];

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

@Component({
  selector: 'app-cuentas-bancarias',
  imports: [MatFormFieldModule, MatSelectModule, MatIconModule, MatDialogModule, MatMenuModule],
  templateUrl: './cuentas-bancarias.html',
  styleUrl: './cuentas-bancarias.scss',
})
export class CuentasBancarias {
  private readonly cuentaService = inject(CuentaBancariaService);
  private readonly permisosService = inject(PermisosService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  private readonly exportacionService = inject(ExportacionService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);

  protected readonly items = signal<CuentaBancariaFila[]>([]);
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
    return this.items().filter((c) => {
      if (estado === 'activas' && !c.activa) return false;
      if (estado === 'inactivas' && c.activa) return false;
      if (!texto) return true;
      return [c.nombreEmpleado, c.nombrePuesto, c.nombreBanco, c.numeroDeCuenta].some((campo) =>
        normalizar(campo).includes(texto),
      );
    });
  });

  protected readonly totalActivas = computed(() => this.items().filter((c) => c.activa).length);

  private yaCargado = false;

  constructor() {
    // El menú (y con él los permisos) llega después del primer render.
    effect(() => {
      if (this.menuCargado() && this.permisos().consultar && !this.yaCargado) {
        this.yaCargado = true;
        untracked(() => this.cargar());
      }
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.cuentaService
      .findAll()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((lista) =>
        this.items.set(lista.map((c) => ({ ...c, estado: c.activa ? 'Activa' : 'Inactiva' }))),
      );
  }

  protected cambiarEstado(valor: string): void {
    this.estado.set(valor as FiltroEstado);
  }

  protected nueva(): void {
    if (!this.permisos().alta) return;
    this.abrirFormulario(
      'Nueva cuenta bancaria',
      null,
      (payload) => this.cuentaService.create(payload),
      'Cuenta bancaria registrada',
    );
  }

  protected editar(item: CuentaBancaria): void {
    if (!this.permisos().cambio) return;
    this.abrirFormulario(
      'Editar cuenta bancaria',
      item,
      (payload) => this.cuentaService.update(item.idCuentaBancaria, payload),
      'Cuenta bancaria actualizada',
    );
  }

  private abrirFormulario(
    titulo: string,
    cuenta: CuentaBancaria | null,
    guardar: (payload: CuentaBancariaPayload) => ReturnType<CuentaBancariaService['create']>,
    mensajeExito: string,
  ): void {
    const data: CuentaBancariaFormData = { titulo, cuenta, guardar };
    this.dialog
      .open<CuentaBancariaFormDialog, CuentaBancariaFormData, boolean>(CuentaBancariaFormDialog, { data, width: '560px' })
      .afterClosed()
      .pipe(filter((guardado) => guardado === true))
      .subscribe(() => {
        this.notificationService.success(mensajeExito);
        this.cargar();
      });
  }

  protected eliminar(item: CuentaBancaria): void {
    if (!this.permisos().baja) return;
    this.confirmDialog
      .confirmar({
        titulo: '¿Eliminar cuenta bancaria?',
        mensaje: `Se eliminará la cuenta ${item.numeroDeCuenta} de ${item.nombreBanco} de "${item.nombreEmpleado}". Si solo dejó de usarse, puedes editarla y marcarla como inactiva. Esta acción no se puede deshacer.`,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.procesando.set(true);
          return this.cuentaService
            .delete(item.idCuentaBancaria)
            .pipe(finalize(() => this.procesando.set(false)));
        }),
      )
      .subscribe(() => {
        this.notificationService.success('Cuenta bancaria eliminada');
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
