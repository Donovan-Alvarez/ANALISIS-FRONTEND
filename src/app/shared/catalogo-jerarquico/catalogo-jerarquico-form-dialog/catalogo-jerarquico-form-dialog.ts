import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Observable, catchError, concatMap, finalize, from, map, of, switchMap, tap } from 'rxjs';
import { ComboConfig, OpcionCombo, PayloadJerarquico } from '../../../core/models/catalogo-jerarquico.model';

export interface CatalogoJerarquicoFormData {
  titulo: string;
  etiqueta: string;
  longitudMaxima: number;
  placeholder?: string;
  combos: ComboConfig[];
  /** Al editar: nombre e id de cada combo (incluida la Empresa del puesto). Al crear: '' y null. */
  valoresIniciales: { nombre: string; [clave: string]: string | number | null };
  /**
   * Hace el POST/PUT. El diálogo se cierra solo si termina bien: ante un 409
   * queda abierto con lo escrito. El toast de error lo pone el
   * errorInterceptor global.
   */
  guardar: (payload: PayloadJerarquico) => Observable<unknown>;
}

function noSoloEspacios(control: AbstractControl<string>): ValidationErrors | null {
  const valor = control.value ?? '';
  return valor.length > 0 && valor.trim().length === 0 ? { soloEspacios: true } : null;
}

/**
 * Formulario de un catálogo con padre: nombre + combos en cascada
 * (Empresa -> Departamento).
 *
 * - Las opciones se piden nuevas en cada apertura y en cada cambio del padre
 *   (sin CatalogosService ni caché). switchMap descarta respuestas viejas si
 *   el usuario cambia rápido de padre.
 * - Al editar, cada combo se fija DESPUÉS de cargar sus opciones y sin emitir
 *   eventos, así que no dispara el reset de la cascada. Mientras dura esa
 *   carga inicial los combos están deshabilitados.
 * - Al cambiar un padre, el hijo se resetea; si el padre no tiene hijos, el
 *   combo hijo queda deshabilitado con su texto sinOpciones. Guardar se
 *   habilita solo con todos los combos elegidos.
 */
@Component({
  selector: 'app-catalogo-jerarquico-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatIconModule],
  templateUrl: './catalogo-jerarquico-form-dialog.html',
  styleUrl: './catalogo-jerarquico-form-dialog.scss',
})
export class CatalogoJerarquicoFormDialog implements OnInit {
  protected readonly data = inject<CatalogoJerarquicoFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CatalogoJerarquicoFormDialog, boolean>);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly guardando = signal(false);
  protected readonly inicializando = signal(true);
  protected readonly opciones = signal<Record<string, OpcionCombo[]>>({});
  protected readonly cargandoOpciones = signal<Record<string, boolean>>({});

  protected readonly nombre = new FormControl(String(this.data.valoresIniciales.nombre ?? ''), {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(this.data.longitudMaxima), noSoloEspacios],
  });

  protected readonly combos: Record<string, FormControl<number | null>> = Object.fromEntries(
    this.data.combos.map((c) => [c.clave, new FormControl<number | null>({ value: null, disabled: true }, Validators.required)]),
  );

  private readonly form = new FormGroup({ nombre: this.nombre, ...this.combos });

  /** Espejo de los valores en un signal: la app es zoneless y la plantilla lee de aquí. */
  private readonly valores = signal<Record<string, unknown>>({});

  /** Todos los combos tienen valor (Guardar se habilita solo así). */
  protected readonly completo = computed(() => {
    const v = this.valores();
    return this.data.combos.every((c) => v[c.clave] != null);
  });

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.sincronizar());
    this.conectarCascada();
    this.cargarInicial();
  }

  // ── Cascada ────────────────────────────────────────────────────────

  /** Cambio del padre por el usuario -> reset del hijo y opciones nuevas. */
  private conectarCascada(): void {
    for (const hijo of this.data.combos.filter((c) => c.dependeDe)) {
      const padre = this.combos[hijo.dependeDe!];
      const control = this.combos[hijo.clave];
      padre.valueChanges
        .pipe(
          tap(() => {
            control.reset(null);
            control.disable({ emitEvent: false });
            this.fijarOpciones(hijo.clave, []);
            this.fijarCargando(hijo.clave, true);
          }),
          switchMap((idPadre) => (idPadre == null ? of([]) : this.pedirOpciones(hijo, idPadre))),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((opciones) => {
          this.fijarOpciones(hijo.clave, opciones);
          this.fijarCargando(hijo.clave, false);
          this.actualizarHabilitado(hijo);
          this.sincronizar();
        });
    }
  }

  /**
   * Carga en orden (padres primero) y fija los valores iniciales sin emitir
   * eventos, cada uno después de tener sus opciones.
   */
  private cargarInicial(): void {
    from(this.data.combos)
      .pipe(
        concatMap((combo) => {
          this.fijarCargando(combo.clave, true);
          const idPadre = combo.dependeDe ? this.combos[combo.dependeDe].value : null;
          const opciones$ = combo.dependeDe && idPadre == null ? of([]) : this.pedirOpciones(combo, idPadre);
          return opciones$.pipe(map((opciones) => ({ combo, opciones })));
        }),
        finalize(() => {
          this.inicializando.set(false);
          this.data.combos.forEach((c) => this.actualizarHabilitado(c));
          this.sincronizar();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ combo, opciones }) => {
        this.fijarOpciones(combo.clave, opciones);
        this.fijarCargando(combo.clave, false);
        const inicial = this.data.valoresIniciales[combo.clave];
        const valor = typeof inicial === 'number' && opciones.some((o) => o.id === inicial) ? inicial : null;
        this.combos[combo.clave].setValue(valor, { emitEvent: false });
      });
  }

  /** Un error HTTP no corta la cascada: el toast lo pone el interceptor y el combo queda vacío. */
  private pedirOpciones(combo: ComboConfig, idPadre: number | null): Observable<OpcionCombo[]> {
    return combo.opciones(idPadre).pipe(catchError(() => of([])));
  }

  private actualizarHabilitado(combo: ComboConfig): void {
    const control = this.combos[combo.clave];
    const padreElegido = !combo.dependeDe || this.combos[combo.dependeDe].value != null;
    const hayOpciones = (this.opciones()[combo.clave] ?? []).length > 0;
    if (!this.inicializando() && padreElegido && hayOpciones && !this.guardando()) {
      control.enable({ emitEvent: false });
    } else {
      control.disable({ emitEvent: false });
    }
  }

  private fijarOpciones(clave: string, opciones: OpcionCombo[]): void {
    this.opciones.update((actual) => ({ ...actual, [clave]: opciones }));
  }

  private fijarCargando(clave: string, cargando: boolean): void {
    this.cargandoOpciones.update((actual) => ({ ...actual, [clave]: cargando }));
  }

  private sincronizar(): void {
    this.valores.set(this.form.getRawValue());
  }

  // ── Plantilla ──────────────────────────────────────────────────────

  /** Texto de la primera opción del <select>, según el estado del combo. */
  protected textoVacio(combo: ComboConfig): string {
    if (this.cargandoOpciones()[combo.clave]) return 'Cargando…';
    const v = this.valores();
    if (combo.dependeDe && v[combo.dependeDe] == null) {
      const padre = this.data.combos.find((c) => c.clave === combo.dependeDe);
      return `Primero selecciona ${padre ? 'una ' + padre.etiqueta.toLowerCase() : 'el campo anterior'}`;
    }
    return (this.opciones()[combo.clave] ?? []).length ? 'Selecciona…' : combo.sinOpciones;
  }

  /** El padre está elegido, ya cargó y no tiene hijos. */
  protected sinOpciones(combo: ComboConfig): boolean {
    if (this.inicializando() || this.cargandoOpciones()[combo.clave]) return false;
    const v = this.valores();
    const padreElegido = !combo.dependeDe || v[combo.dependeDe] != null;
    return padreElegido && (this.opciones()[combo.clave] ?? []).length === 0;
  }

  // ── Acciones ───────────────────────────────────────────────────────

  protected cancelar(): void {
    this.dialogRef.close(false);
  }

  protected guardar(evento?: Event): void {
    evento?.preventDefault();
    if (this.guardando() || this.inicializando()) return;
    if (this.nombre.invalid) {
      this.nombre.markAsTouched();
      return;
    }
    if (!this.completo()) return;

    const payload: PayloadJerarquico = { nombre: this.nombre.value.trim() };
    for (const combo of this.data.combos) {
      if (combo.seEnvia) payload[combo.clave] = this.combos[combo.clave].value as number;
    }

    this.guardando.set(true);
    this.dialogRef.disableClose = true;
    this.data.combos.forEach((c) => this.combos[c.clave].disable({ emitEvent: false }));
    this.data.guardar(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.guardando.set(false);
        this.dialogRef.disableClose = false;
        this.data.combos.forEach((c) => this.actualizarHabilitado(c));
      },
    });
  }
}
