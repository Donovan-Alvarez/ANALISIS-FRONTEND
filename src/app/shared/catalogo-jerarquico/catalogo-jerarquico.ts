import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { filter, finalize, switchMap } from 'rxjs';
import { CatalogoJerarquicoConfig, ItemJerarquico } from '../../core/models/catalogo-jerarquico.model';
import { ExportacionService, textoCelda, valorDe } from '../../core/services/exportacion.service';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog.service';
import {
  CatalogoJerarquicoFormData,
  CatalogoJerarquicoFormDialog,
} from './catalogo-jerarquico-form-dialog/catalogo-jerarquico-form-dialog';

/** Minúsculas y sin tildes, para buscar 'logistica' y encontrar 'Logística'. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Pantalla completa de un catálogo con padre (Departamentos: nombre + empresa;
 * Puestos: nombre + departamento, filtrado por empresa). Mismo comportamiento
 * que CatalogoSimple (plantilla Gen 2, D7), con columnas y combos por
 * configuración. CatalogoSimple no se toca: las 4 pantallas de un solo campo
 * siguen usando el suyo.
 *
 * Permisos: los cinco botones se muestran siempre y se DESHABILITAN si falta
 * el permiso (D5/D7); cada método repite la guarda. Sin "consultar" no se
 * pide la lista.
 *
 * Errores HTTP: el toast lo pone el errorInterceptor global; aquí no se duplica.
 */
@Component({
  selector: 'app-catalogo-jerarquico',
  imports: [MatIconModule, MatDialogModule, MatMenuModule],
  templateUrl: './catalogo-jerarquico.html',
  styleUrl: './catalogo-jerarquico.scss',
})
export class CatalogoJerarquico {
  readonly config = input.required<CatalogoJerarquicoConfig>();

  private readonly permisosService = inject(PermisosService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  private readonly exportacionService = inject(ExportacionService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);

  protected readonly items = signal<ItemJerarquico[]>([]);
  protected readonly cargando = signal(false);
  protected readonly procesando = signal(false);
  protected readonly filtro = signal('');

  protected readonly permisos = computed(() => this.permisosService.permisosDe(this.config().slug));
  /** Hasta que llega el menú no se sabe si hay acceso: no mostrar "sin acceso" antes de tiempo. */
  protected readonly menuCargado = this.menuService.cargado;
  protected readonly sinAcceso = computed(() => this.menuCargado() && !this.permisos().consultar);

  /** Busca en todas las columnas visibles (nombre, departamento, empresa). */
  protected readonly filtrados = computed(() => {
    const texto = normalizar(this.filtro());
    const lista = this.items();
    if (!texto) return lista;
    const columnas = this.config().columnas;
    return lista.filter((item) =>
      columnas.some((c) => normalizar(textoCelda(valorDe(item, c.campo), c.formato)).includes(texto)),
    );
  });

  protected readonly celda = (item: ItemJerarquico, campo: string, formato?: Parameters<typeof textoCelda>[1]) =>
    textoCelda(valorDe(item, campo), formato) || '—';

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
    const iniciales: CatalogoJerarquicoFormData['valoresIniciales'] = { nombre: '' };
    cfg.combos.forEach((c) => (iniciales[c.clave] = null));
    this.abrirFormulario(
      `Nuevo ${cfg.singular}`,
      iniciales,
      (payload) => cfg.api.create(payload),
      `${capitalizar(cfg.singular)} creado`,
    );
  }

  protected editar(item: ItemJerarquico): void {
    if (!this.permisos().cambio) return;
    const cfg = this.config();
    // El item trae el id de cada combo (en Puestos también idEmpresa, derivado
    // del departamento): así la Empresa aparece ya seleccionada.
    const iniciales: CatalogoJerarquicoFormData['valoresIniciales'] = { nombre: item.nombre };
    cfg.combos.forEach((c) => {
      const valor = item[c.clave];
      iniciales[c.clave] = typeof valor === 'number' ? valor : null;
    });
    this.abrirFormulario(
      `Editar ${cfg.singular}`,
      iniciales,
      (payload) => cfg.api.update(item.id, payload),
      `${capitalizar(cfg.singular)} actualizado`,
    );
  }

  private abrirFormulario(
    titulo: string,
    valoresIniciales: CatalogoJerarquicoFormData['valoresIniciales'],
    guardar: CatalogoJerarquicoFormData['guardar'],
    mensajeExito: string,
  ): void {
    const cfg = this.config();
    const data: CatalogoJerarquicoFormData = {
      titulo,
      etiqueta: cfg.etiqueta,
      longitudMaxima: cfg.longitudMaxima,
      placeholder: cfg.placeholder,
      combos: cfg.combos,
      valoresIniciales,
      guardar,
    };
    this.dialog
      .open<CatalogoJerarquicoFormDialog, CatalogoJerarquicoFormData, boolean>(CatalogoJerarquicoFormDialog, { data })
      .afterClosed()
      .pipe(filter((guardado) => guardado === true))
      .subscribe(() => {
        this.notificationService.success(mensajeExito);
        this.cargar();
      });
  }

  // ── Baja ───────────────────────────────────────────────────────────

  protected eliminar(item: ItemJerarquico): void {
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

  protected imprimir(): Promise<void> {
    if (!this.permisos().imprimir) return Promise.resolve();
    const cfg = this.config();
    return this.ejecutar(() => this.exportacionService.imprimir(cfg.titulo, cfg.columnas, this.filtrados()));
  }

  protected exportarPdf(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    const cfg = this.config();
    return this.ejecutar(() => this.exportacionService.exportarPdf(cfg.titulo, cfg.columnas, this.filtrados()));
  }

  protected exportarExcel(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    const cfg = this.config();
    return this.ejecutar(() => this.exportacionService.exportarExcel(cfg.titulo, cfg.columnas, this.filtrados()));
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
