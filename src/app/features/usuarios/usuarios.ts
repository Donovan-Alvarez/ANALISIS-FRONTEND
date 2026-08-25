import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import {
  Empresa,
  Genero,
  Role,
  StatusUsuario,
  Sucursal,
} from '../../core/models/catalogo.model';
import {
  ReglaPassword,
  UsuarioRequest,
  UsuarioResponse,
} from '../../core/models/usuario.model';
import { CatalogosService } from '../../core/services/catalogos.service';
import { PermisosService } from '../../core/services/permisos.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { mensajeDeError } from '../../core/utils/api-error';
import { aBase64Puro, aDataUri } from '../../core/utils/foto';

/** Ruta de esta pantalla; coincide con OPCION.Pagina en la base de datos. */
const PAGINA = 'usuarios';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permisosService = inject(PermisosService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly catalogosService = inject(CatalogosService);

  /** Permisos del rol autenticado, derivados de GET /api/menu/actual. */
  protected readonly permisos = computed(() => this.permisosService.permisosDe(PAGINA));

  // ── Catálogos ───────────────────────────────────────────────────────
  protected readonly empresas = signal<Empresa[]>([]);
  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly generos = signal<Genero[]>([]);
  protected readonly estatus = signal<StatusUsuario[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly usuarios = signal<UsuarioResponse[]>([]);

  // ── Estado de la pantalla ───────────────────────────────────────────
  protected readonly cargando = signal(true);
  protected readonly filtro = signal('');
  protected readonly modalAbierto = signal(false);
  protected readonly modoEdicion = signal(false);
  protected readonly guardando = signal(false);
  protected readonly eliminando = signal(false);
  protected readonly usuarioAEliminar = signal<UsuarioResponse | null>(null);
  protected readonly verPassword = signal(false);
  /** Data URI para el <img>; se convierte a base64 puro antes de enviarlo. */
  protected readonly fotoPreview = signal<string | null>(null);
  protected readonly usuarioSeleccionado = signal<UsuarioResponse | null>(null);

  private readonly empresaSeleccionada = signal<number | null>(null);
  private readonly passwordActual = signal('');

  protected readonly form = this.fb.nonNullable.group({
    idUsuario: ['', [Validators.required, Validators.maxLength(100)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    fechaNacimiento: ['', Validators.required],
    correoElectronico: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    telefonoMovil: ['', [Validators.required, Validators.maxLength(30)]],
    password: [''],
    idEmpresa: [null as number | null, Validators.required],
    idSucursal: [null as number | null, Validators.required],
    idGenero: [null as number | null, Validators.required],
    idStatusUsuario: [null as number | null, Validators.required],
    idRole: [null as number | null, Validators.required],
    pregunta: ['', [Validators.required, Validators.maxLength(200)]],
    // El backend exige respuesta siempre (@NotBlank) y la re-encripta con
    // BCrypt en cada guardado, así que también es obligatoria al editar.
    respuesta: ['', [Validators.required, Validators.maxLength(200)]],
    requiereCambiarPassword: [false],
  });

  constructor() {
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

  ngOnInit(): void {
    this.cargarTodo();
  }

  private cargarTodo(): void {
    this.cargando.set(true);
    forkJoin({
      usuarios: this.usuariosService.listar(),
      empresas: this.catalogosService.empresas(),
      sucursales: this.catalogosService.sucursales(),
      generos: this.catalogosService.generos(),
      estatus: this.catalogosService.statusUsuario(),
      roles: this.catalogosService.roles(),
    }).subscribe({
      next: (datos) => {
        this.usuarios.set(datos.usuarios);
        this.empresas.set(datos.empresas);
        this.sucursales.set(datos.sucursales);
        this.generos.set(datos.generos);
        this.estatus.set(datos.estatus);
        this.roles.set(datos.roles);
        this.cargando.set(false);
      },
      error: (error) => {
        this.cargando.set(false);
        this.snackBar.open(mensajeDeError(error, 'No se pudieron cargar los usuarios'), 'Cerrar', {
          duration: 5000,
        });
      },
    });
  }

  private recargarUsuarios(): void {
    this.usuariosService.listar().subscribe({
      next: (lista) => this.usuarios.set(lista),
      error: (error) =>
        this.snackBar.open(mensajeDeError(error), 'Cerrar', { duration: 5000 }),
    });
  }

  // ── Derivados ───────────────────────────────────────────────────────

  protected readonly sucursalesFiltradas = computed(() => {
    const idEmpresa = this.empresaSeleccionada();
    if (idEmpresa === null) return [];
    return this.sucursales().filter((s) => s.idEmpresa === idEmpresa);
  });

  protected readonly politica = computed<Empresa | null>(() => {
    const idEmpresa = this.empresaSeleccionada();
    return this.empresas().find((e) => e.idEmpresa === idEmpresa) ?? null;
  });

  /**
   * Checklist en vivo de la política de contraseña. Refleja las mismas reglas
   * que UsuarioService.validarPoliticaPassword() aplica en el servidor: aquí
   * son solo una guía visual, la validación que manda es la del backend.
   */
  protected readonly reglasPassword = computed<ReglaPassword[]>(() => {
    const politica = this.politica();
    if (!politica) return [];
    const valor = this.passwordActual();
    const contar = (patron: RegExp) => (valor.match(patron) ?? []).length;

    return [
      {
        texto: `Al menos ${politica.passwordLargo} caracteres`,
        cumple: valor.length >= politica.passwordLargo,
      },
      {
        texto: `${politica.passwordCantidadMayusculas} mayúscula(s)`,
        cumple: contar(/\p{Lu}/gu) >= politica.passwordCantidadMayusculas,
      },
      {
        texto: `${politica.passwordCantidadMinusculas} minúscula(s)`,
        cumple: contar(/\p{Ll}/gu) >= politica.passwordCantidadMinusculas,
      },
      {
        texto: `${politica.passwordCantidadNumeros} número(s)`,
        cumple: contar(/\d/g) >= politica.passwordCantidadNumeros,
      },
      {
        texto: `${politica.passwordCantidadCaracteresEspeciales} carácter(es) especial(es)`,
        cumple:
          contar(/[^\p{L}\p{N}]/gu) >= politica.passwordCantidadCaracteresEspeciales,
      },
    ];
  });

  protected readonly passwordCumplePolitica = computed(() => {
    const reglas = this.reglasPassword();
    return reglas.length > 0 && reglas.every((r) => r.cumple);
  });

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

  // ── Etiquetas ───────────────────────────────────────────────────────

  protected nombreSucursal(idSucursal: number): string {
    return this.sucursales().find((s) => s.idSucursal === idSucursal)?.nombre ?? '—';
  }

  protected nombreRole(idRole: number): string {
    return this.roles().find((r) => r.idRole === idRole)?.nombre ?? '—';
  }

  protected nombreEstatus(idStatus: number): string {
    return this.estatus().find((e) => e.idStatusUsuario === idStatus)?.nombre ?? '—';
  }

  protected claseEstatus(idStatus: number): string {
    const nombre = this.nombreEstatus(idStatus).toLowerCase();
    if (nombre === 'activo') return 'badge badge--ok';
    if (nombre.startsWith('bloqueado')) return 'badge badge--warn';
    return 'badge badge--off';
  }

  protected iniciales(usuario: UsuarioResponse): string {
    return `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase();
  }

  /** Convierte el base64 crudo del backend en algo que el <img> pueda mostrar. */
  protected fotoDe(usuario: UsuarioResponse): string | null {
    return aDataUri(usuario.fotografiaBase64);
  }

  protected fecha(valor: string | null): string {
    if (!valor) return 'Nunca';
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? valor : d.toLocaleString('es-GT');
  }

  // ── Alta / edición ──────────────────────────────────────────────────

  protected abrirAlta(): void {
    if (!this.permisos().alta) return;
    this.modoEdicion.set(false);
    this.fotoPreview.set(null);
    this.verPassword.set(false);
    this.usuarioSeleccionado.set(null);
    this.form.reset({ requiereCambiarPassword: true });
    this.form.controls.idUsuario.enable();
    this.form.controls.password.setValidators([Validators.required]);
    this.form.controls.password.updateValueAndValidity();
    this.modalAbierto.set(true);
  }

  protected abrirEdicion(usuario: UsuarioResponse): void {
    if (!this.permisos().cambio) return;
    this.modoEdicion.set(true);
    this.verPassword.set(false);
    this.fotoPreview.set(aDataUri(usuario.fotografiaBase64));

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
      // La respuesta llega encriptada con BCrypt desde el backend, así que no
      // se puede prellenar: hay que volver a capturarla en claro.
      respuesta: '',
      requiereCambiarPassword: usuario.requiereCambiarPassword,
    });
    this.form.controls.idSucursal.setValue(usuario.idSucursal);

    this.form.controls.idUsuario.disable();
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

    const v = this.form.getRawValue();
    const cuerpo: UsuarioRequest = {
      idUsuario: v.idUsuario,
      nombre: v.nombre,
      apellido: v.apellido,
      fechaNacimiento: v.fechaNacimiento,
      idStatusUsuario: Number(v.idStatusUsuario),
      password: v.password,
      idGenero: Number(v.idGenero),
      correoElectronico: v.correoElectronico,
      requiereCambiarPassword: v.requiereCambiarPassword,
      fotografiaBase64: aBase64Puro(this.fotoPreview()),
      telefonoMovil: v.telefonoMovil,
      idSucursal: Number(v.idSucursal),
      pregunta: v.pregunta,
      respuesta: v.respuesta,
      idRole: Number(v.idRole),
    };

    this.guardando.set(true);
    const edicion = this.modoEdicion();
    const peticion = edicion
      ? this.usuariosService.actualizar(v.idUsuario, cuerpo)
      : this.usuariosService.crear(cuerpo);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.recargarUsuarios();
        this.snackBar.open(edicion ? 'Usuario actualizado' : 'Usuario creado', 'Cerrar', {
          duration: 3000,
        });
      },
      error: (error) => {
        this.guardando.set(false);
        // Aquí caen las validaciones del servidor: política de contraseña,
        // usuario duplicado, sucursal/rol inexistente, etc.
        this.snackBar.open(mensajeDeError(error, 'No se pudo guardar el usuario'), 'Cerrar', {
          duration: 6000,
        });
      },
    });
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

    this.eliminando.set(true);
    this.usuariosService.eliminar(usuario.idUsuario).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.usuarioAEliminar.set(null);
        this.recargarUsuarios();
        this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.eliminando.set(false);
        this.usuarioAEliminar.set(null);
        // Oracle rechaza la baja si el usuario tiene bitácora o sesiones
        // asociadas (restricción de integridad referencial).
        this.snackBar.open(
          mensajeDeError(error, 'No se pudo eliminar el usuario'),
          'Cerrar',
          { duration: 6000 },
        );
      },
    });
  }

  // ── Imprimir / Exportar ─────────────────────────────────────────────

  protected imprimir(): void {
    if (!this.permisos().imprimir) return;
    window.print();
  }

  protected exportar(): void {
    if (!this.permisos().exportar) return;
    const encabezados = [
      'Usuario',
      'Nombre',
      'Apellido',
      'Correo',
      'Telefono',
      'Sucursal',
      'Rol',
      'Estatus',
    ];
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
      .map((f) => f.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
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
