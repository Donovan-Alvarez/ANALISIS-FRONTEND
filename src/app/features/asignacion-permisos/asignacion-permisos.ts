import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Modulo, Role } from '../../core/models/catalogo.model';
import {
  ACCIONES_PERMISO,
  AccionPermiso,
  MenuAsignacion,
  OpcionPermisoRequest,
} from '../../core/models/permiso.model';
import { CatalogosService } from '../../core/services/catalogos.service';
import { MenuService } from '../../core/services/menu.service';
import { PermisosService } from '../../core/services/permisos.service';
import { RoleOpcionService } from '../../core/services/role-opcion.service';
import { mensajeDeError } from '../../core/utils/api-error';

/** Ruta de esta pantalla; coincide con OPCION.Pagina en la base de datos. */
const PAGINA = 'asignacion-permisos';

@Component({
  selector: 'app-asignacion-permisos',
  imports: [MatIconModule],
  templateUrl: './asignacion-permisos.html',
  styleUrl: './asignacion-permisos.scss',
})
export class AsignacionPermisos implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly permisosService = inject(PermisosService);
  private readonly catalogosService = inject(CatalogosService);
  private readonly roleOpcionService = inject(RoleOpcionService);
  private readonly menuService = inject(MenuService);

  protected readonly permisos = computed(() => this.permisosService.permisosDe(PAGINA));
  protected readonly acciones = ACCIONES_PERMISO;

  protected readonly roles = signal<Role[]>([]);
  protected readonly modulos = signal<Modulo[]>([]);
  protected readonly cargandoCatalogos = signal(true);
  protected readonly cargandoCuadricula = signal(false);
  protected readonly guardando = signal(false);

  protected readonly idRole = signal<number | null>(null);
  protected readonly idModulo = signal<number | null>(null);

  /** Cuadrícula editable, agrupada por menú igual que la respuesta del backend. */
  protected readonly menus = signal<MenuAsignacion[]>([]);
  /** Copia de lo último cargado, para detectar cambios sin guardar. */
  private readonly menusOriginales = signal<MenuAsignacion[]>([]);

  ngOnInit(): void {
    forkJoin({
      roles: this.catalogosService.roles(),
      modulos: this.catalogosService.modulos(),
    }).subscribe({
      next: (datos) => {
        this.roles.set(datos.roles);
        this.modulos.set(datos.modulos);
        this.cargandoCatalogos.set(false);
      },
      error: (error) => {
        this.cargandoCatalogos.set(false);
        this.snackBar.open(
          mensajeDeError(error, 'No se pudieron cargar los catálogos'),
          'Cerrar',
          { duration: 5000 },
        );
      },
    });
  }

  // ── Derivados ───────────────────────────────────────────────────────

  protected readonly seleccionCompleta = computed(
    () => this.idRole() !== null && this.idModulo() !== null,
  );

  /** Todas las opciones aplanadas; sirve para contadores y para el PUT. */
  private readonly opcionesPlanas = computed(() =>
    this.menus().flatMap((menu) => menu.opciones),
  );

  protected readonly hayCambios = computed(
    () => JSON.stringify(this.menus()) !== JSON.stringify(this.menusOriginales()),
  );

  protected readonly totalMarcados = computed(() =>
    this.opcionesPlanas().reduce(
      (total, opcion) => total + this.acciones.filter((a) => opcion[a.clave]).length,
      0,
    ),
  );

  protected readonly totalCasillas = computed(
    () => this.opcionesPlanas().length * this.acciones.length,
  );

  protected readonly totalOpciones = computed(() => this.opcionesPlanas().length);

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
      this.menus.set([]);
      this.menusOriginales.set([]);
      return;
    }

    this.cargandoCuadricula.set(true);
    this.roleOpcionService.obtenerPorModulo(idRole, idModulo).subscribe({
      next: (respuesta) => {
        this.aplicarRespuesta(respuesta.menus);
        this.cargandoCuadricula.set(false);
      },
      error: (error) => {
        this.cargandoCuadricula.set(false);
        this.menus.set([]);
        this.menusOriginales.set([]);
        this.snackBar.open(
          mensajeDeError(error, 'No se pudieron cargar los permisos'),
          'Cerrar',
          { duration: 5000 },
        );
      },
    });
  }

  /** Guarda dos copias independientes para poder comparar y descartar. */
  private aplicarRespuesta(menus: MenuAsignacion[]): void {
    this.menus.set(this.clonar(menus));
    this.menusOriginales.set(this.clonar(menus));
  }

  private clonar(menus: MenuAsignacion[]): MenuAsignacion[] {
    return menus.map((menu) => ({
      ...menu,
      opciones: menu.opciones.map((opcion) => ({ ...opcion })),
    }));
  }

  protected nombreRoleSeleccionado(): string {
    return this.roles().find((r) => r.idRole === this.idRole())?.nombre ?? '';
  }

  // ── Edición de casillas ─────────────────────────────────────────────

  /** Aplica una transformación a las opciones que cumplan el filtro. */
  private actualizarOpciones(
    aplica: (idOpcion: number) => boolean,
    transformar: (opcion: Record<AccionPermiso, boolean>) => void,
  ): void {
    if (!this.permisos().cambio) return;
    this.menus.update((menus) =>
      menus.map((menu) => ({
        ...menu,
        opciones: menu.opciones.map((opcion) => {
          if (!aplica(opcion.idOpcion)) return opcion;
          const copia = { ...opcion };
          transformar(copia);
          return copia;
        }),
      })),
    );
  }

  protected alternar(idOpcion: number, accion: AccionPermiso): void {
    this.actualizarOpciones(
      (id) => id === idOpcion,
      (opcion) => {
        opcion[accion] = !opcion[accion];
        // "consultar" es la existencia de la fila en ROLE_OPCION: si se marca
        // cualquier otra acción, consultar tiene que quedar activo.
        if (accion !== 'consultar' && opcion[accion]) {
          opcion.consultar = true;
        }
      },
    );
  }

  protected columnaCompleta(accion: AccionPermiso): boolean {
    const opciones = this.opcionesPlanas();
    return opciones.length > 0 && opciones.every((o) => o[accion]);
  }

  protected alternarColumna(accion: AccionPermiso): void {
    const marcarTodo = !this.columnaCompleta(accion);
    this.actualizarOpciones(
      () => true,
      (opcion) => {
        opcion[accion] = marcarTodo;
        if (accion !== 'consultar' && marcarTodo) opcion.consultar = true;
      },
    );
  }

  protected filaCompleta(opcion: Record<AccionPermiso, boolean>): boolean {
    return this.acciones.every((a) => opcion[a.clave]);
  }

  protected alternarFila(idOpcion: number): void {
    const actual = this.opcionesPlanas().find((o) => o.idOpcion === idOpcion);
    if (!actual) return;
    const marcarTodo = !this.filaCompleta(actual);
    this.actualizarOpciones(
      (id) => id === idOpcion,
      (opcion) => {
        for (const accion of this.acciones) opcion[accion.clave] = marcarTodo;
      },
    );
  }

  protected marcarTodo(valor: boolean): void {
    this.actualizarOpciones(
      () => true,
      (opcion) => {
        for (const accion of this.acciones) opcion[accion.clave] = valor;
      },
    );
  }

  // ── Guardar / descartar ─────────────────────────────────────────────

  protected descartar(): void {
    this.menus.set(this.clonar(this.menusOriginales()));
  }

  protected guardar(): void {
    const idRole = this.idRole();
    const idModulo = this.idModulo();
    if (idRole === null || idModulo === null) return;
    if (!this.permisos().cambio || !this.hayCambios()) return;

    // Se manda la cuadrícula completa, incluidas las filas sin nada marcado:
    // el backend borra los permisos del módulo y reinserta solo las que traen
    // alguna casilla activa, así que omitir una fila equivale a quitarla.
    const cuerpo: OpcionPermisoRequest[] = this.opcionesPlanas().map((opcion) => ({
      idOpcion: opcion.idOpcion,
      consultar: opcion.consultar,
      alta: opcion.alta,
      baja: opcion.baja,
      cambio: opcion.cambio,
      imprimir: opcion.imprimir,
      exportar: opcion.exportar,
    }));

    this.guardando.set(true);
    this.roleOpcionService.guardarPorModulo(idRole, idModulo, cuerpo).subscribe({
      next: (respuesta) => {
        this.aplicarRespuesta(respuesta.menus);
        this.guardando.set(false);
        this.snackBar.open(
          `Permisos de "${this.nombreRoleSeleccionado()}" actualizados`,
          'Cerrar',
          { duration: 3000 },
        );
        this.refrescarMenuPropio(idRole);
      },
      error: (error) => {
        this.guardando.set(false);
        this.snackBar.open(
          mensajeDeError(error, 'No se pudieron guardar los permisos'),
          'Cerrar',
          { duration: 6000 },
        );
      },
    });
  }

  /**
   * Si el administrador acaba de editar los permisos de su propio rol, el menú
   * lateral y los botones que dependen de él quedarían desfasados hasta el
   * siguiente login. Recargarlo lo deja consistente al instante.
   */
  private refrescarMenuPropio(idRoleEditado: number): void {
    const sesion = this.permisosService.idRoleAutenticado();
    if (sesion !== idRoleEditado) return;

    this.menuService.cargarMenu().subscribe({
      error: () =>
        this.snackBar.open(
          'Los permisos se guardaron, pero el menú no se pudo refrescar. Vuelve a iniciar sesión.',
          'Cerrar',
          { duration: 6000 },
        ),
    });
  }
}
