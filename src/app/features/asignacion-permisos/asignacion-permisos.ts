import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ACCIONES_PERMISO,
  AccionPermiso,
  PermisoOpcion,
} from '../../core/models/permiso.model';
import { PermisosService } from '../../core/services/permisos.service';
import { MOCK_MODULOS, MOCK_ROLES, permisosDe } from './asignacion-permisos.mock';

/** Ruta de esta pantalla; coincide con OPCION.Pagina en la base de datos. */
const PAGINA = 'asignacion-permisos';

@Component({
  selector: 'app-asignacion-permisos',
  imports: [MatIconModule],
  templateUrl: './asignacion-permisos.html',
  styleUrl: './asignacion-permisos.scss',
})
export class AsignacionPermisos {
  private readonly snackBar = inject(MatSnackBar);
  private readonly permisosService = inject(PermisosService);

  /** Permisos del rol autenticado sobre ESTA pantalla. */
  protected readonly permisos = computed(() => this.permisosService.permisosDe(PAGINA));

  protected readonly acciones = ACCIONES_PERMISO;

  // DEMO: reemplazar por GET /api/roles y GET /api/modulos.
  protected readonly roles = signal(MOCK_ROLES);
  protected readonly modulos = signal(MOCK_MODULOS);

  protected readonly idRole = signal<number | null>(null);
  protected readonly idModulo = signal<number | null>(null);

  /** Cuadricula editable. Vacia hasta que se elijan rol y modulo. */
  protected readonly filas = signal<PermisoOpcion[]>([]);
  /** Copia de lo ultimo cargado, para saber si hay cambios sin guardar. */
  private readonly filasOriginales = signal<PermisoOpcion[]>([]);
  protected readonly guardando = signal(false);

  protected readonly seleccionCompleta = computed(
    () => this.idRole() !== null && this.idModulo() !== null,
  );

  protected readonly hayCambios = computed(
    () => JSON.stringify(this.filas()) !== JSON.stringify(this.filasOriginales()),
  );

  protected readonly totalMarcados = computed(() =>
    this.filas().reduce(
      (total, fila) => total + this.acciones.filter((a) => fila[a.clave]).length,
      0,
    ),
  );

  protected readonly totalCasillas = computed(() => this.filas().length * this.acciones.length);

  // ── Selección de rol / módulo ───────────────────────────────────────

  protected onRoleChange(valor: string): void {
    this.idRole.set(valor ? Number(valor) : null);
    this.cargarCuadricula();
  }

  protected onModuloChange(valor: string): void {
    this.idModulo.set(valor ? Number(valor) : null);
    this.cargarCuadricula();
  }

  private cargarCuadricula(): void {
    const idRole = this.idRole();
    const idModulo = this.idModulo();

    if (idRole === null || idModulo === null) {
      this.filas.set([]);
      this.filasOriginales.set([]);
      return;
    }

    // DEMO: aqui va GET /api/roles/{idRole}/opciones?idModulo={idModulo}
    const datos = permisosDe(idRole, idModulo);
    this.filas.set(datos.map((f) => ({ ...f })));
    this.filasOriginales.set(datos.map((f) => ({ ...f })));
  }

  protected nombreRoleSeleccionado(): string {
    return this.roles().find((r) => r.idRole === this.idRole())?.nombre ?? '';
  }

  // ── Edición de casillas ─────────────────────────────────────────────

  protected alternar(idOpcion: number, accion: AccionPermiso): void {
    if (!this.permisos().cambio) return;
    this.filas.update((filas) =>
      filas.map((fila) =>
        fila.idOpcion === idOpcion ? { ...fila, [accion]: !fila[accion] } : fila,
      ),
    );
  }

  /** ¿Están marcadas todas las casillas de esta columna? */
  protected columnaCompleta(accion: AccionPermiso): boolean {
    const filas = this.filas();
    return filas.length > 0 && filas.every((f) => f[accion]);
  }

  protected alternarColumna(accion: AccionPermiso): void {
    if (!this.permisos().cambio) return;
    const marcarTodo = !this.columnaCompleta(accion);
    this.filas.update((filas) => filas.map((f) => ({ ...f, [accion]: marcarTodo })));
  }

  /** ¿Están marcadas las seis acciones de esta fila? */
  protected filaCompleta(fila: PermisoOpcion): boolean {
    return this.acciones.every((a) => fila[a.clave]);
  }

  protected alternarFila(idOpcion: number): void {
    if (!this.permisos().cambio) return;
    this.filas.update((filas) =>
      filas.map((fila) => {
        if (fila.idOpcion !== idOpcion) return fila;
        const marcarTodo = !this.filaCompleta(fila);
        const actualizada = { ...fila };
        for (const accion of this.acciones) {
          actualizada[accion.clave] = marcarTodo;
        }
        return actualizada;
      }),
    );
  }

  protected marcarTodo(valor: boolean): void {
    if (!this.permisos().cambio) return;
    this.filas.update((filas) =>
      filas.map((fila) => {
        const actualizada = { ...fila };
        for (const accion of this.acciones) {
          actualizada[accion.clave] = valor;
        }
        return actualizada;
      }),
    );
  }

  // ── Guardar / descartar ─────────────────────────────────────────────

  protected descartar(): void {
    this.filas.set(this.filasOriginales().map((f) => ({ ...f })));
  }

  protected guardar(): void {
    if (!this.permisos().cambio || !this.hayCambios()) return;

    this.guardando.set(true);

    // DEMO: aqui va PUT /api/roles/{idRole}/opciones con el arreglo de filas.
    // El backend debe hacer un merge sobre ROLE_OPCION: insertar las que no
    // existan, actualizar las que si, y borrar las que quedaron sin ningun
    // permiso marcado.
    this.filasOriginales.set(this.filas().map((f) => ({ ...f })));
    this.guardando.set(false);

    this.snackBar.open(
      `Permisos de "${this.nombreRoleSeleccionado()}" actualizados`,
      'Cerrar',
      { duration: 3000 },
    );
  }
}
