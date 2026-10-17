import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { filter, finalize, switchMap } from 'rxjs';
import { Persona } from '../../core/models/persona.model';
import { ColumnaExport, ExportacionService, textoCelda, valorDe } from '../../core/services/exportacion.service';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { PermisosService } from '../../core/services/permisos.service';
import { PersonaService } from '../../core/services/persona.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { PersonaFormData, PersonaFormDialog } from './persona-form-dialog/persona-form-dialog';
import { Paginacion } from '../../core/utils/paginacion';

/** Ruta y OPCION.Pagina: 'personas' (contrato-rutas.md). */
const SLUG = 'personas';
const TITULO = 'Personas';

/** Columnas de la tabla, del PDF y del Excel. */
const COLUMNAS: ColumnaExport[] = [
  { encabezado: 'Nombre', campo: 'nombre' },
  { encabezado: 'Apellido', campo: 'apellido' },
  { encabezado: 'Fecha de nacimiento', campo: 'fechaNacimiento', formato: 'fecha' },
  { encabezado: 'Género', campo: 'nombreGenero' },
  { encabezado: 'Estado civil', campo: 'nombreEstadoCivil' },
  { encabezado: 'Teléfono', campo: 'telefono' },
  { encabezado: 'Correo electrónico', campo: 'correoElectronico' },
  { encabezado: 'Dirección', campo: 'direccion' },
];

/** Minúsculas y sin tildes, para buscar 'maria' y encontrar 'María'. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Pantalla de Personas (Opción 17): datos personales base que luego se asocian a un Empleado.
 * Misma plantilla "Gen 2" que las demás (D7): botones siempre visibles y DESHABILITADOS si falta
 * el permiso; cada método repite la guarda. Errores HTTP: el toast lo pone el errorInterceptor global.
 */
@Component({
  selector: 'app-personas',
  imports: [MatPaginatorModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule, MatMenuModule],
  templateUrl: './personas.html',
  styleUrl: './personas.scss',
})
export class Personas {
  private readonly personaService = inject(PersonaService);
  private readonly permisosService = inject(PermisosService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  private readonly exportacionService = inject(ExportacionService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  protected readonly pag = new Paginacion(() => this.filtrados());

  protected readonly titulo = TITULO;
  protected readonly columnas = COLUMNAS;

  protected readonly items = signal<Persona[]>([]);
  protected readonly cargando = signal(false);
  protected readonly procesando = signal(false);
  protected readonly filtro = signal('');

  protected readonly permisos = computed(() => this.permisosService.permisosDe(SLUG));
  /** Hasta que llega el menú no se sabe si hay acceso: no mostrar "sin acceso" antes de tiempo. */
  protected readonly menuCargado = this.menuService.cargado;
  protected readonly sinAcceso = computed(() => this.menuCargado() && !this.permisos().consultar);

  /** Busca en todas las columnas visibles. */
  protected readonly filtrados = computed(() => {
    const texto = normalizar(this.filtro());
    const lista = this.items();
    if (!texto) return lista;
    return lista.filter((persona) =>
      COLUMNAS.some((c) => normalizar(textoCelda(valorDe(persona, c.campo), c.formato)).includes(texto)),
    );
  });

  protected readonly celda = (persona: Persona, campo: string, formato?: ColumnaExport['formato']) =>
    textoCelda(valorDe(persona, campo), formato) || '—';

  private yaCargado = false;

  constructor() {
    // Al refrescar (F5) la pantalla se crea antes de que el Shell cargue el menú:
    // se espera a tenerlo para decidir si se puede consultar.
    effect(() => {
      if (this.menuCargado() && this.permisos().consultar && !this.yaCargado) {
        this.yaCargado = true;
        untracked(() => this.cargar());
      }
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.personaService
      .findAll()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe((lista) => this.items.set(lista));
  }

  // ── Alta / cambio ──────────────────────────────────────────────────

  protected nueva(): void {
    if (!this.permisos().alta) return;
    this.abrirFormulario(
      { titulo: 'Nueva persona', persona: null, guardar: (payload) => this.personaService.create(payload) },
      'Persona creada',
    );
  }

  protected editar(persona: Persona): void {
    if (!this.permisos().cambio || persona.idPersona == null) return;
    const id = persona.idPersona;
    this.abrirFormulario(
      { titulo: 'Editar persona', persona, guardar: (payload) => this.personaService.update(id, payload) },
      'Persona actualizada',
    );
  }

  private abrirFormulario(data: PersonaFormData, mensajeExito: string): void {
    this.dialog
      .open<PersonaFormDialog, PersonaFormData, boolean>(PersonaFormDialog, {
        data,
        width: '640px',
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

  protected eliminar(persona: Persona): void {
    if (!this.permisos().baja || persona.idPersona == null) return;
    const id = persona.idPersona;
    this.confirmDialog
      .confirmar({
        titulo: '¿Eliminar persona?',
        mensaje: `Se eliminará a "${persona.nombreCompleto ?? persona.nombre}". Esta acción no se puede deshacer.`,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.procesando.set(true);
          // Si es empleado o tiene documentos, el backend responde 409 con un mensaje claro (toast del interceptor).
          return this.personaService.delete(id).pipe(finalize(() => this.procesando.set(false)));
        }),
      )
      .subscribe(() => {
        this.notificationService.success('Persona eliminada');
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
      // Lo típico: no se pudo descargar el chunk de jsPDF/ExcelJS (sin red).
      console.error(error);
      this.notificationService.error('No se pudo generar el archivo', 'Revisa tu conexión e intenta de nuevo.');
    } finally {
      this.procesando.set(false);
    }
  }
}
