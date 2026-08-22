import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Empresa } from '../../core/models/catalogo.model';
import { ReglaPassword, UsuarioResponse } from '../../core/models/usuario.model';
import { PermisosService } from '../../core/services/permisos.service';
import {
  MOCK_EMPRESAS,
  MOCK_GENEROS,
  MOCK_ROLES,
  MOCK_STATUS_USUARIO,
  MOCK_SUCURSALES,
  MOCK_USUARIOS,
} from './usuarios.mock';

/** Ruta de esta pantalla; coincide con OPCION.Pagina en la base de datos. */
const PAGINA = 'usuarios';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permisosService = inject(PermisosService);

  /** Permisos reales del rol autenticado (derivados de GET /api/menu/actual). */
  protected readonly permisos = computed(() => this.permisosService.permisosDe(PAGINA));

  // ── Catalogos ───────────────────────────────────────────────────────
  // DEMO: al conectar el backend, estos signals se llenan con las
  // respuestas de /api/empresas, /api/sucursales, etc.
  protected readonly empresas = signal(MOCK_EMPRESAS);
  protected readonly sucursales = signal(MOCK_SUCURSALES);
  protected readonly generos = signal(MOCK_GENEROS);
  protected readonly estatus = signal(MOCK_STATUS_USUARIO);
  protected readonly roles = signal(MOCK_ROLES);
  protected readonly usuarios = signal<UsuarioResponse[]>(MOCK_USUARIOS);

  // ── Estado de la pantalla ───────────────────────────────────────────
  protected readonly filtro = signal('');
  protected readonly modalAbierto = signal(false);
  protected readonly modoEdicion = signal(false);
  protected readonly guardando = signal(false);
  protected readonly usuarioAEliminar = signal<UsuarioResponse | null>(null);
  protected readonly verPassword = signal(false);
  protected readonly fotoPreview = signal<string | null>(null);
  /** Usuario que se esta editando, para el panel de datos del sistema. */
  protected readonly usuarioSeleccionado = signal<UsuarioResponse | null>(null);

  /** Empresa elegida en el combo; determina sucursales y politica de password. */
  private readonly empresaSeleccionada = signal<number | null>(null);
  private readonly passwordActual = signal('');

  protected readonly form = this.fb.nonNullable.group({
    idUsuario: ['', [Validators.required, Validators.maxLength(100)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    fechaNacimiento: ['', Validators.required],
    correoElectronico: ['', [Validators.required, Validators.email]],
    telefonoMovil: ['', Validators.required],
    password: [''],
    idEmpresa: [null as number | null, Validators.required],
    idSucursal: [null as number | null, Validators.required],
    idGenero: [null as number | null, Validators.required],
    idStatusUsuario: [null as number | null, Validators.required],
    idRole: [null as number | null, Validators.required],
    pregunta: ['', Validators.required],
    respuesta: ['', Validators.required],
    requiereCambiarPassword: [false],
  });

  constructor() {
    // El combo de Sucursales depende del de Empresa: al cambiar empresa se
    // limpia la sucursal para no dejar una que ya no pertenece.
    this.form.controls.idEmpresa.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((idEmpresa) => {
        this.empresaSeleccionada.set(idEmpresa === null ? null : Number(idEmpresa));
        this.form.controls.idSucursal.setValue(null);
      });

    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((valor) => this.passwordActual.set(valor ?? ''));
  }

  // ── Derivados ───────────────────────────────────────────────────────

  /** Solo las sucursales de la empresa elegida. */
  protected readonly sucursalesFiltradas = computed(() => {
    const idEmpresa = this.empresaSeleccionada();
    if (idEmpresa === null) return [];
    return this.sucursales().filter((s) => s.idEmpresa === idEmpresa);
  });

  /** Politica de contrasena de la empresa elegida. */
  protected readonly politica = computed<Empresa | null>(() => {
    const idEmpresa = this.empresaSeleccionada();
    return this.empresas().find((e) => e.idEmpresa === idEmpresa) ?? null;
  });

  /** Checklist en vivo de la politica de contrasena. */
  protected readonly reglasPassword = computed<ReglaPassword[]>(() => {
    const politica = this.politica();
    if (!politica) return [];
    const valor = this.passwordActual();

    const contar = (patron: RegExp) => (valor.match(patron) ?? []).length;

    const reglas: ReglaPassword[] = [
      {
        texto: `Al menos ${politica.passwordLargo} caracteres`,
        cumple: valor.length >= politica.passwordLargo,
      },
      {
        texto: `${politica.passwordCantidadMayusculas} mayuscula(s)`,
        cumple: contar(/[A-ZÁÉÍÓÚÑ]/g) >= politica.passwordCantidadMayusculas,
      },
      {
        texto: `${politica.passwordCantidadMinusculas} minuscula(s)`,
        cumple: contar(/[a-záéíóúñ]/g) >= politica.passwordCantidadMinusculas,
      },
      {
        texto: `${politica.passwordCantidadNumeros} numero(s)`,
        cumple: contar(/[0-9]/g) >= politica.passwordCantidadNumeros,
      },
      {
        texto: `${politica.passwordCantidadCaracteresEspeciales} caracter(es) especial(es)`,
        cumple:
          contar(/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/g) >= politica.passwordCantidadCaracteresEspeciales,
      },
    ];
    return reglas;
  });

  protected readonly passwordCumplePolitica = computed(() => {
    const reglas = this.reglasPassword();
    return reglas.length > 0 && reglas.every((r) => r.cumple);
  });

  /** Filas visibles segun el texto del buscador. */
  protected readonly usuariosFiltrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    const lista = this.usuarios();
    if (!texto) return lista;
    return lista.filter((u) =>
      [u.idUsuario, u.nombre, u.apellido, u.correoElectronico]
        .join(' ')
        .toLowerCase()
        .includes(texto),
    );
  });

  // ── Etiquetas para la tabla ─────────────────────────────────────────

  protected nombreSucursal(idSucursal: number): string {
    return this.sucursales().find((s) => s.idSucursal === idSucursal)?.nombre ?? '—';
  }

  protected nombreRole(idRole: number): string {
    return this.roles().find((r) => r.idRole === idRole)?.nombre ?? '—';
  }

  protected nombreEstatus(idStatus: number): string {
    return this.estatus().find((e) => e.idStatusUsuario === idStatus)?.nombre ?? '—';
  }

  /** Clase del badge segun el estatus, para que se lea de un vistazo. */
  protected claseEstatus(idStatus: number): string {
    const nombre = this.nombreEstatus(idStatus).toLowerCase();
    if (nombre === 'activo') return 'badge badge--ok';
    if (nombre.startsWith('bloqueado')) return 'badge badge--warn';
    return 'badge badge--off';
  }

  protected iniciales(usuario: UsuarioResponse): string {
    return `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase();
  }

  protected fecha(valor: string | null): string {
    if (!valor) return 'Nunca';
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? valor : d.toLocaleString('es-GT');
  }

  // ── Alta / edicion ──────────────────────────────────────────────────

  protected abrirAlta(): void {
    if (!this.permisos().alta) return;
    this.modoEdicion.set(false);
    this.fotoPreview.set(null);
    this.verPassword.set(false);
    // Sin esto, los datos de auditoria del ultimo usuario editado se
    // arrastrarian al registro nuevo.
    this.usuarioSeleccionado.set(null);
    this.form.reset({ requiereCambiarPassword: true });
    this.form.controls.idUsuario.enable();
    // En alta la contrasena es obligatoria.
    this.form.controls.password.setValidators([Validators.required]);
    this.form.controls.password.updateValueAndValidity();
    this.modalAbierto.set(true);
  }

  protected abrirEdicion(usuario: UsuarioResponse): void {
    if (!this.permisos().cambio) return;
    this.modoEdicion.set(true);
    this.verPassword.set(false);
    this.fotoPreview.set(usuario.fotografiaBase64);

    const sucursal = this.sucursales().find((s) => s.idSucursal === usuario.idSucursal);

    this.form.reset({
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      fechaNacimiento: usuario.fechaNacimiento,
      correoElectronico: usuario.correoElectronico,
      telefonoMovil: usuario.telefonoMovil,
      password: '',
      idEmpresa: sucursal?.idEmpresa ?? null,
      idSucursal: usuario.idSucursal,
      idGenero: usuario.idGenero,
      idStatusUsuario: usuario.idStatusUsuario,
      idRole: usuario.idRole,
      pregunta: usuario.pregunta,
      respuesta: usuario.respuesta,
      requiereCambiarPassword: usuario.requiereCambiarPassword,
    });
    // valueChanges de idEmpresa limpia la sucursal, hay que reponerla.
    this.form.controls.idSucursal.setValue(usuario.idSucursal);

    // El id de usuario es la llave primaria: no se edita.
    this.form.controls.idUsuario.disable();
    // En edicion, contrasena vacia significa "no cambiarla".
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();

    this.usuarioSeleccionado.set(usuario);
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.usuarioSeleccionado.set(null);
  }

  protected alternarPassword(): void {
    this.verPassword.update((v) => !v);
  }

  /** Carga la fotografia como base64, que es lo que espera el backend. */
  protected onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = () => this.fotoPreview.set(lector.result as string);
    lector.readAsDataURL(archivo);
  }

  protected quitarFoto(): void {
    this.fotoPreview.set(null);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revisa los campos marcados en rojo', 'Cerrar', { duration: 3500 });
      return;
    }

    const password = this.form.controls.password.value;
    if (password && !this.passwordCumplePolitica()) {
      this.snackBar.open('La contraseña no cumple la política de la empresa', 'Cerrar', {
        duration: 4000,
      });
      return;
    }

    this.guardando.set(true);

    // DEMO: se actualiza la lista en memoria. Al conectar el backend, aqui
    // van POST /api/usuarios o PUT /api/usuarios/{id} con UsuarioRequest.
    const v = this.form.getRawValue();
    const fila: UsuarioResponse = {
      idUsuario: v.idUsuario,
      nombre: v.nombre,
      apellido: v.apellido,
      fechaNacimiento: v.fechaNacimiento,
      idStatusUsuario: Number(v.idStatusUsuario),
      idGenero: Number(v.idGenero),
      idSucursal: Number(v.idSucursal),
      idRole: Number(v.idRole),
      correoElectronico: v.correoElectronico,
      telefonoMovil: v.telefonoMovil,
      pregunta: v.pregunta,
      respuesta: v.respuesta,
      fotografiaBase64: this.fotoPreview(),
      requiereCambiarPassword: v.requiereCambiarPassword,
      // Campos administrados por el sistema: en alta arrancan vacios, en
      // edicion se conservan los que ya tenia.
      ultimaFechaIngreso: this.usuarioSeleccionado()?.ultimaFechaIngreso ?? null,
      intentosDeAcceso: this.usuarioSeleccionado()?.intentosDeAcceso ?? 0,
      sesionActual: this.usuarioSeleccionado()?.sesionActual ?? null,
      ultimaFechaCambioPassword: this.usuarioSeleccionado()?.ultimaFechaCambioPassword ?? null,
      fechaCreacion: this.usuarioSeleccionado()?.fechaCreacion ?? new Date().toISOString(),
      usuarioCreacion: this.usuarioSeleccionado()?.usuarioCreacion ?? 'Administrador',
      fechaModificacion: this.modoEdicion() ? new Date().toISOString() : null,
      usuarioModificacion: this.modoEdicion() ? 'Administrador' : null,
    };

    if (this.modoEdicion()) {
      this.usuarios.update((lista) =>
        lista.map((u) => (u.idUsuario === fila.idUsuario ? fila : u)),
      );
    } else {
      this.usuarios.update((lista) => [fila, ...lista]);
    }

    this.guardando.set(false);
    this.cerrarModal();
    this.snackBar.open(
      this.modoEdicion() ? 'Usuario actualizado' : 'Usuario creado',
      'Cerrar',
      { duration: 3000 },
    );
  }

  // ── Baja ────────────────────────────────────────────────────────────

  protected confirmarBaja(usuario: UsuarioResponse): void {
    if (!this.permisos().baja) return;
    this.usuarioAEliminar.set(usuario);
  }

  protected cancelarBaja(): void {
    this.usuarioAEliminar.set(null);
  }

  protected eliminar(): void {
    const usuario = this.usuarioAEliminar();
    if (!usuario) return;

    // DEMO: aqui va DELETE /api/usuarios/{id}.
    this.usuarios.update((lista) => lista.filter((u) => u.idUsuario !== usuario.idUsuario));
    this.usuarioAEliminar.set(null);
    this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 3000 });
  }

  // ── Imprimir / Exportar ─────────────────────────────────────────────

  protected imprimir(): void {
    if (!this.permisos().imprimir) return;
    window.print();
  }

  protected exportar(): void {
    if (!this.permisos().exportar) return;
    // DEMO: genera un CSV en el navegador. Cuando exista el endpoint de
    // exportacion del backend, se reemplaza por la descarga que este emita.
    const encabezados = ['Usuario', 'Nombre', 'Apellido', 'Correo', 'Telefono', 'Sucursal', 'Rol', 'Estatus'];
    const filas = this.usuariosFiltrados().map((u) => [
      u.idUsuario,
      u.nombre,
      u.apellido,
      u.correoElectronico,
      u.telefonoMovil,
      this.nombreSucursal(u.idSucursal),
      this.nombreRole(u.idRole),
      this.nombreEstatus(u.idStatusUsuario),
    ]);
    const csv = [encabezados, ...filas]
      .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'usuarios.csv';
    enlace.click();
    URL.revokeObjectURL(url);
  }
}
