import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Observable, catchError, finalize, forkJoin, map, of } from 'rxjs';
import { OpcionCombo } from '../../../core/models/catalogo-jerarquico.model';
import { Persona, PersonaPayload } from '../../../core/models/persona.model';
import { EstadoCivilService } from '../../../core/services/estado-civil.service';
import { GeneroService } from '../../../core/services/genero.service';
import {
  REGEX_CORREO,
  REGEX_NOMBRE,
  fechaMaximaNacimiento,
  noSoloEspacios,
  validarFechaNacimiento,
  validarTelefono,
} from '../../../core/utils/validaciones-persona';

export interface PersonaFormData {
  titulo: string;
  /** null = alta; con valor = cambio (se precargan los campos). */
  persona: Persona | null;
  /**
   * Hace el POST/PUT. El diálogo se cierra solo si termina bien: ante un error
   * queda abierto con lo escrito. El toast de error lo pone el errorInterceptor global.
   */
  guardar: (payload: PersonaPayload) => Observable<unknown>;
}

/**
 * Formulario de Persona (Opción 17).
 *
 * - Género y Estado civil se piden nuevos en cada apertura (sin caché), igual que los combos de
 *   Departamentos/Puestos. Mientras cargan, el formulario no se puede enviar.
 * - Las validaciones de formato (correo, teléfono, fecha de nacimiento) son el espejo de las del
 *   backend; si el backend rechaza algo igual, el mensaje llega en el toast y el diálogo sigue abierto.
 */
@Component({
  selector: 'app-persona-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatIconModule],
  templateUrl: './persona-form-dialog.html',
  styleUrl: './persona-form-dialog.scss',
})
export class PersonaFormDialog implements OnInit {
  protected readonly data = inject<PersonaFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PersonaFormDialog, boolean>);
  private readonly generoService = inject(GeneroService);
  private readonly estadoCivilService = inject(EstadoCivilService);

  protected readonly guardando = signal(false);
  protected readonly cargandoOpciones = signal(true);
  protected readonly generos = signal<OpcionCombo[]>([]);
  protected readonly estadosCiviles = signal<OpcionCombo[]>([]);

  /** El usuario no puede elegir una fecha que ya incumpla la edad mínima. */
  protected readonly fechaMaxima = fechaMaximaNacimiento();

  protected readonly form = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50), noSoloEspacios, Validators.pattern(REGEX_NOMBRE)],
    }),
    apellido: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50), noSoloEspacios, Validators.pattern(REGEX_NOMBRE)],
    }),
    fechaNacimiento: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validarFechaNacimiento],
    }),
    idGenero: new FormControl<number | null>(null, Validators.required),
    idEstadoCivil: new FormControl<number | null>(null, Validators.required),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50), noSoloEspacios, validarTelefono],
    }),
    correoElectronico: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(50), Validators.pattern(REGEX_CORREO)],
    }),
    direccion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100), noSoloEspacios],
    }),
  });

  ngOnInit(): void {
    const p = this.data.persona;
    if (p) {
      this.form.patchValue({
        nombre: p.nombre,
        apellido: p.apellido,
        fechaNacimiento: p.fechaNacimiento,
        telefono: p.telefono,
        correoElectronico: p.correoElectronico ?? '',
        direccion: p.direccion,
      });
    }

    // Los combos esperan a sus opciones; un error HTTP no rompe el diálogo (el toast lo pone el interceptor).
    this.form.controls.idGenero.disable({ emitEvent: false });
    this.form.controls.idEstadoCivil.disable({ emitEvent: false });

    forkJoin({
      generos: this.generoService.findAll().pipe(
        map((lista) => lista.map((g) => ({ id: g.idGenero!, nombre: g.nombre }))),
        catchError(() => of([] as OpcionCombo[])),
      ),
      estadosCiviles: this.estadoCivilService.findAll().pipe(
        map((lista) => lista.map((e) => ({ id: e.id, nombre: e.nombre }))),
        catchError(() => of([] as OpcionCombo[])),
      ),
    })
      .pipe(finalize(() => this.cargandoOpciones.set(false)))
      .subscribe(({ generos, estadosCiviles }) => {
        this.generos.set(generos);
        this.estadosCiviles.set(estadosCiviles);

        const idGenero = generos.some((g) => g.id === p?.idGenero) ? p!.idGenero : null;
        const idEstadoCivil = estadosCiviles.some((e) => e.id === p?.idEstadoCivil) ? p!.idEstadoCivil : null;
        this.form.patchValue({ idGenero, idEstadoCivil });

        if (generos.length) this.form.controls.idGenero.enable({ emitEvent: false });
        if (estadosCiviles.length) this.form.controls.idEstadoCivil.enable({ emitEvent: false });
      });
  }

  /**
   * Mensaje de error de un campo (solo si ya lo tocaron). `mensajePatron` es el texto cuando falla el formato.
   */
  protected error(control: AbstractControl, etiqueta: string, mensajePatron = 'Formato no válido.'): string | null {
    if (!control.invalid || !(control.touched || control.dirty)) return null;
    const e = control.errors ?? {};
    if (e['required']) return `${etiqueta} es obligatorio.`;
    if (e['soloEspacios']) return `${etiqueta} no puede quedar solo con espacios.`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    if (e['fechaNacimiento']) return e['fechaNacimiento'] as string;
    if (e['telefono']) return e['telefono'] as string;
    if (e['pattern']) return mensajePatron;
    return 'Valor no válido.';
  }

  protected cancelar(): void {
    this.dialogRef.close(false);
  }

  protected guardar(evento?: Event): void {
    evento?.preventDefault();
    if (this.guardando() || this.cargandoOpciones()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: PersonaPayload = {
      nombre: v.nombre.trim(),
      apellido: v.apellido.trim(),
      fechaNacimiento: v.fechaNacimiento,
      idGenero: v.idGenero!,
      direccion: v.direccion.trim(),
      telefono: v.telefono.trim(),
      correoElectronico: v.correoElectronico.trim() || null,
      idEstadoCivil: v.idEstadoCivil!,
    };

    this.guardando.set(true);
    this.dialogRef.disableClose = true;
    this.form.disable({ emitEvent: false });
    this.data.guardar(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.guardando.set(false);
        this.dialogRef.disableClose = false;
        this.form.enable({ emitEvent: false });
      },
    });
  }
}
