import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { filter, finalize, switchMap } from 'rxjs';
import { DocumentoPersona } from '../../core/models/documento-persona.model';
import { DocumentoPersonaService } from '../../core/services/documento-persona.service';
import { ColumnaExport, ExportacionService, textoCelda, valorDe } from '../../core/services/exportacion.service';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import {
  DocumentoPersonaFormData,
  DocumentoPersonaFormDialog,
} from './documento-persona-form-dialog/documento-persona-form-dialog';
import { Paginacion } from '../../core/utils/paginacion';

/** Ruta y OPCION.Pagina: 'documentos-persona' (contrato-rutas.md). */
const SLUG = 'documentos-persona';
const TITULO = 'Documentos de personas';

/** Columnas de la tabla, del PDF y del Excel. */
const COLUMNAS: ColumnaExport[] = [
  { encabezado: 'Persona', campo: 'nombrePersona' },
  { encabezado: 'Tipo de documento', campo: 'nombreTipoDocumento' },
  { encabezado: 'Número de documento', campo: 'noDocumento' },
];

/** Minúsculas y sin tildes, para buscar 'dpi' o 'maria' y encontrar 'DPI' o 'María'. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Pantalla de Documentos de Personas (Opción 18): DPI, pasaporte, NIT, etc. de cada persona.
 * La combinación Persona + Tipo de documento es única. Misma plantilla "Gen 2" que las demás (D7).
 */
@Component({
  selector: 'app-documentos-persona',
  imports: [MatPaginatorModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule, MatMenuModule],
  templateUrl: './documentos-persona.html',
  styleUrl: './documentos-persona.scss',
})
export class DocumentosPersona {
  private readonly documentoService = inject(DocumentoPersonaService);
  private readonly permisosService = inject(PermisosService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  private readonly exportacionService = inject(ExportacionService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  protected readonly pag = new Paginacion(() => this.filtrados());

  protected readonly titulo = TITULO;
  protected readonly columnas = COLUMNAS;

  protected readonly items = signal<DocumentoPersona[]>([]);
  protected readonly cargando = signal(false);
  protected readonly procesando = signal(false);
  protected readonly filtro = signal('');

  protected readonly permisos = computed(() => this.permisosService.permisosDe(SLUG));
  protected readonly menuCargado = this.menuService.cargado;
  protected readonly sinAcceso = computed(() => this.menuCargado() && !this.permisos().consultar);

  protected readonly filtrados = computed(() => {
    const texto = normalizar(this.filtro());
    const lista = this.items();
    if (!texto) return lista;
    return lista.filter((doc) =>
      COLUMNAS.some((c) => normalizar(textoCelda(valorDe(doc, c.campo), c.formato)).includes(texto)),
    );
  });

  protected readonly celda = (doc: DocumentoPersona, campo: string, formato?: ColumnaExport['formato']) =>
    textoCelda(valorDe(doc, campo), formato) || '—';

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
    this.documentoService
      .findAll()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((lista) => this.items.set(lista));
  }

  // ── Alta / cambio ──────────────────────────────────────────────────

  protected nuevo(): void {
    if (!this.permisos().alta) return;
    this.abrirFormulario(
      {
        titulo: 'Nuevo documento',
        documento: null,
        existentes: this.items(),
        guardar: (payload) => this.documentoService.create(payload),
      },
      'Documento registrado',
    );
  }

  protected editar(doc: DocumentoPersona): void {
    if (!this.permisos().cambio) return;
    this.abrirFormulario(
      {
        titulo: 'Editar documento',
        documento: doc,
        existentes: this.items(),
        guardar: (payload) => this.documentoService.update(doc.idTipoDocumento, doc.idPersona, payload.noDocumento),
      },
      'Documento actualizado',
    );
  }

  private abrirFormulario(data: DocumentoPersonaFormData, mensajeExito: string): void {
    this.dialog
      .open<DocumentoPersonaFormDialog, DocumentoPersonaFormData, boolean>(DocumentoPersonaFormDialog, { data, width: '520px' })
      .afterClosed()
      .pipe(filter((guardado) => guardado === true))
      .subscribe(() => {
        this.notificationService.success(mensajeExito);
        this.cargar();
      });
  }

  // ── Baja ───────────────────────────────────────────────────────────

  protected eliminar(doc: DocumentoPersona): void {
    if (!this.permisos().baja) return;
    this.confirmDialog
      .confirmar({
        titulo: '¿Eliminar documento?',
        mensaje: `Se eliminará el documento "${doc.nombreTipoDocumento}" de ${doc.nombrePersona}. Esta acción no se puede deshacer.`,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.procesando.set(true);
          return this.documentoService
            .delete(doc.idTipoDocumento, doc.idPersona)
            .pipe(finalize(() => this.procesando.set(false)));
        }),
      )
      .subscribe(() => {
        this.notificationService.success('Documento eliminado');
        this.cargar();
      });
  }

  // ── Imprimir / exportar (sobre las filas filtradas visibles) ────────

  protected imprimir(): Promise<void> {
    if (!this.permisos().imprimir) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.imprimir(TITULO, COLUMNAS, this.filtrados()));
  }

  protected exportarPdf(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.exportarPdf(TITULO, COLUMNAS, this.filtrados()));
  }

  protected exportarExcel(): Promise<void> {
    if (!this.permisos().exportar) return Promise.resolve();
    return this.ejecutar(() => this.exportacionService.exportarExcel(TITULO, COLUMNAS, this.filtrados()));
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
