import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { filter, finalize, switchMap } from 'rxjs';
import { CatalogoSimpleConfig, ItemCatalogo } from '../../core/models/catalogo-simple.model';
import { ColumnaExport, ExportacionService } from '../../core/services/exportacion.service';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';
import {
  CatalogoSimpleFormData,
  CatalogoSimpleFormDialog,
} from './catalogo-simple-form-dialog/catalogo-simple-form-dialog';

/** Minúsculas y sin tildes, para buscar 'union' y encontrar 'Unión'. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Pantalla completa de un catálogo de un solo campo "Nombre" (plantilla Gen 2,
 * D7). La usan Estados Civiles, Status Empleado, Tipos de Documentos y Bancos:
 * cada una solo pasa su CatalogoSimpleConfig.
 *
 * Permisos: los cinco botones (Nuevo, Editar, Eliminar, Imprimir, Exportar)
 * se muestran siempre y se DESHABILITAN si falta el permiso (D5/D7); cada
 * método repite la guarda. Sin "consultar" no se pide la lista.
 *
 * Errores HTTP: el toast lo pone el errorInterceptor global con el mensaje
 * del backend (duplicado, trigger de baja...); aquí no se duplica.
 */
@Component({
  selector: 'app-catalogo-simple',
  imports: [MatIconModule, MatDialogModule, MatMenuModule],
  templateUrl: './catalogo-simple.html',
  styleUrl: './catalogo-simple.scss',
})
export class CatalogoSimple {
  readonly config = input.required<CatalogoSimpleConfig>();

  private readonly permisosService = inject(PermisosService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  private readonly exportacionService = inject(ExportacionService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);

  protected readonly items = signal<ItemCatalogo[]>([]);
  protected readonly cargando = signal(false);
  protected readonly procesando = signal(false);
  protected readonly filtro = signal('');

  protected readonly permisos = computed(() => this.permisosService.permisosDe(this.config().slug));
  /** Hasta que llega el menú no se sabe si hay acceso: no mostrar "sin acceso" antes de tiempo. */
  protected readonly menuCargado = this.menuService.cargado;
  protected readonly sinAcceso = computed(() => this.menuCargado() && !this.permisos().consultar);

  protected readonly filtrados = computed(() => {
    const texto = normalizar(this.filtro());
    const lista = this.items();
    return texto ? lista.filter((i) => normalizar(i.nombre).includes(texto)) : lista;
  });

  private yaCargado = false;

  constructor() {
    // Al refrescar (F5) la pantalla se crea antes de que el Shell cargue el
    // menú: se espera a tenerlo para decidir si se puede consultar.
    effect(() => {
      if (this.menuCargado() && this.permisos().consultar && !this.yaCargado) {
        this.yaCargado = true;
        untracked(() => this.cargar());
      }
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.config()
      .api.findAll()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((lista) => this.items.set(lista));
  }

  // ── Alta / cambio ──────────────────────────────────────────────────

  protected nuevo(): void {
    if (!this.permisos().alta) return;
    const cfg = this.config();
    this.abrirFormulario(`Nuevo ${cfg.singular}`, '', (nombre) => cfg.api.create(nombre), `${capitalizar(cfg.singular)} creado`);
  }

  protected editar(item: ItemCatalogo): void {
    if (!this.permisos().cambio) return;
    const cfg = this.config();
    this.abrirFormulario(
      `Editar ${cfg.singular}`,
      item.nombre,
      (nombre) => cfg.api.update(item.id, nombre),
      `${capitalizar(cfg.singular)} actualizado`,
    );
  }

  private abrirFormulario(
    titulo: string,
    valorInicial: string,
    guardar: CatalogoSimpleFormData['guardar'],
    mensajeExito: string,
  ): void {
    const cfg = this.config();
    const data: CatalogoSimpleFormData = {
      titulo,
      etiqueta: cfg.etiqueta,
      longitudMaxima: cfg.longitudMaxima,
      placeholder: cfg.placeholder,
      valorInicial,
      guardar,
    };
    this.dialog
      .open<CatalogoSimpleFormDialog, CatalogoSimpleFormData, boolean>(CatalogoSimpleFormDialog, { data })
      .afterClosed()
      .pipe(filter((guardado) => guardado === true))
      .subscribe(() => {
        this.notificationService.success(mensajeExito);
        this.cargar();
      });
  }

  // ── Baja ───────────────────────────────────────────────────────────

  protected eliminar(item: ItemCatalogo): void {
    if (!this.permisos().baja) return;
    const cfg = this.config();
    this.confirmDialog
      .confirmar({
        titulo: `¿Eliminar ${cfg.singular}?`,
        mensaje: `Se eliminará "${item.nombre}". Esta acción no se puede deshacer.`,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.procesando.set(true);
          return cfg.api.delete(item.id).pipe(finalize(() => this.procesando.set(false)));
        }),
      )
      .subscribe(() => {
        this.notificationService.success(`${capitalizar(cfg.singular)} eliminado`);
        this.cargar();
      });
  }

  // ── Imprimir / exportar (sobre las filas filtradas visibles) ────────

  private columnas(): ColumnaExport[] {
    return [{ encabezado: this.config().etiqueta, campo: 'nombre' }];
  }

  protected imprimir(): Promise<void> {
    if (!this.permisos().imprimir) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.imprimir(this.config().titulo, this.columnas(), this.filtrados()));
  }

  protected exportarPdf(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() =>
      this.exportacionService.exportarPdf(this.config().titulo, this.columnas(), this.filtrados()),
    );
  }

  protected exportarExcel(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() =>
      this.exportacionService.exportarExcel(this.config().titulo, this.columnas(), this.filtrados()),
    );
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
