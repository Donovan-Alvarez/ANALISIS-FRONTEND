import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Observable, catchError, finalize, forkJoin, map, of } from 'rxjs';
import { OpcionCombo } from '../../../core/models/catalogo-jerarquico.model';
import { DocumentoPersona, DocumentoPersonaPayload } from '../../../core/models/documento-persona.model';
import { PersonaService } from '../../../core/services/persona.service';
import { TipoDocumentoService } from '../../../core/services/tipo-documento.service';
import { ayudaNumeroDocumento, errorNumeroDocumento, noSoloEspacios } from '../../../core/utils/validaciones-persona';

export interface DocumentoPersonaFormData {
  titulo: string;
  /** null = alta; con valor = cambio (solo se puede editar el número). */
  documento: DocumentoPersona | null;
  /** Lista actual de la pantalla: sirve para avisar de un duplicado ANTES de enviar (el backend vuelve a validar). */
  existentes: DocumentoPersona[];
  /**
   * Hace el POST/PUT. El diálogo se cierra solo si termina bien: ante un error
   * queda abierto con lo escrito. El toast de error lo pone el errorInterceptor global.
   */
  guardar: (payload: DocumentoPersonaPayload) => Observable<unknown>;
}

/**
 * Formulario de Documento de Persona (Opción 18).
 *
 * - Persona + Tipo de documento es único: si ya existe esa pareja se avisa en el formulario y no se
 *   deja guardar. El backend lo valida de nuevo (por si dos personas guardan a la vez).
 * - Al EDITAR solo cambia el número: persona y tipo son la llave y quedan bloqueados.
 * - El formato del número depende del tipo (DPI: 13 dígitos, NIT, genérico), igual que en el backend.
 */
@Component({
  selector: 'app-documento-persona-form-dialog',
  imports: [MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatDialogModule, MatIconModule],
  templateUrl: './documento-persona-form-dialog.html',
  styleUrl: './documento-persona-form-dialog.scss',
})
export class DocumentoPersonaFormDialog implements OnInit {
  protected readonly data = inject<DocumentoPersonaFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DocumentoPersonaFormDialog, boolean>);
  private readonly personaService = inject(PersonaService);
  private readonly tipoDocumentoService = inject(TipoDocumentoService);

  protected readonly esEdicion = this.data.documento !== null;

  protected readonly guardando = signal(false);
  protected readonly cargandoOpciones = signal(true);
  protected readonly personas = signal<OpcionCombo[]>([]);
  protected readonly tipos = signal<OpcionCombo[]>([]);

  // Espejo de los combos en signals (la app es zoneless y la plantilla lee de aquí).
  // Van ANTES de los controles: el validador del número los lee al construirse.
  private readonly idPersonaSel = signal<number | null>(null);
  private readonly idTipoSel = signal<number | null>(null);

  protected readonly nombreTipo = computed(() => this.tipos().find((t) => t.id === this.idTipoSel())?.nombre ?? null);
  protected readonly ayuda = computed(() => ayudaNumeroDocumento(this.nombreTipo()));

  /** Ya existe un documento de este tipo para esta persona (solo aplica en alta). */
  protected readonly duplicado = computed(() => {
    if (this.esEdicion) return false;
    const persona = this.idPersonaSel();
    const tipo = this.idTipoSel();
    return (
      persona != null &&
      tipo != null &&
      this.data.existentes.some((d) => d.idPersona === persona && d.idTipoDocumento === tipo)
    );
  });

  protected readonly idPersona = new FormControl<number | null>(null, Validators.required);
  protected readonly idTipoDocumento = new FormControl<number | null>(null, Validators.required);
  protected readonly noDocumento = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      noSoloEspacios,
      Validators.maxLength(50),
      (control: AbstractControl<string>): ValidationErrors | null => {
        const nombreTipo = this.nombreTipo();
        if (!control.value?.trim() || !nombreTipo) return null; // lo cubren required / el combo de tipo
        const mensaje = errorNumeroDocumento(nombreTipo, control.value);
        return mensaje ? { numeroDocumento: mensaje } : null;
      },
    ],
  });

  protected readonly form = new FormGroup({
    idPersona: this.idPersona,
    idTipoDocumento: this.idTipoDocumento,
    noDocumento: this.noDocumento,
  });

  constructor() {
    this.idPersona.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.idPersonaSel.set(v));
    this.idTipoDocumento.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => {
      this.idTipoSel.set(v);
      // El formato del número depende del tipo: se revalida al cambiarlo.
      this.noDocumento.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    const doc = this.data.documento;
    if (doc) this.noDocumento.setValue(doc.noDocumento);

    // Persona y tipo son la llave: al editar quedan bloqueados.
    this.idPersona.disable({ emitEvent: false });
    this.idTipoDocumento.disable({ emitEvent: false });

    forkJoin({
      personas: this.personaService.findAll().pipe(
        map((lista) =>
          lista.map((p) => ({ id: p.idPersona!, nombre: p.nombreCompleto ?? `${p.nombre} ${p.apellido}` })),
        ),
        catchError(() => of([] as OpcionCombo[])),
      ),
      tipos: this.tipoDocumentoService.findAll().pipe(
        map((lista) => lista.map((t) => ({ id: t.id, nombre: t.nombre }))),
        catchError(() => of([] as OpcionCombo[])),
      ),
    })
      .pipe(finalize(() => this.cargandoOpciones.set(false)))
      .subscribe(({ personas, tipos }) => {
        this.personas.set(personas);
        this.tipos.set(tipos);

        const idPersona = personas.some((p) => p.id === doc?.idPersona) ? doc!.idPersona : null;
        const idTipo = tipos.some((t) => t.id === doc?.idTipoDocumento) ? doc!.idTipoDocumento : null;
        this.idPersona.setValue(idPersona, { emitEvent: false });
        this.idTipoDocumento.setValue(idTipo, { emitEvent: false });
        this.idPersonaSel.set(idPersona);
        this.idTipoSel.set(idTipo);
        this.noDocumento.updateValueAndValidity();

        if (!this.esEdicion) {
          if (personas.length) this.idPersona.enable({ emitEvent: false });
          if (tipos.length) this.idTipoDocumento.enable({ emitEvent: false });
        }
      });
  }

  /** Mensaje de error del número de documento (solo si ya lo tocaron). */
  protected errorNumero(): string | null {
    const c = this.noDocumento;
    if (!c.invalid || !(c.touched || c.dirty)) return null;
    const e = c.errors ?? {};
    if (e['required']) return 'El número de documento es obligatorio.';
    if (e['soloEspacios']) return 'El número de documento no puede quedar solo con espacios.';
    if (e['maxlength']) return 'Máximo 50 caracteres.';
    if (e['numeroDocumento']) return e['numeroDocumento'] as string;
    return 'Valor no válido.';
  }

  protected cancelar(): void {
    this.dialogRef.close(false);
  }

  protected guardar(evento?: Event): void {
    evento?.preventDefault();
    if (this.guardando() || this.cargandoOpciones() || this.duplicado()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    if (v.idPersona == null || v.idTipoDocumento == null) return;
    const payload: DocumentoPersonaPayload = {
      idPersona: v.idPersona,
      idTipoDocumento: v.idTipoDocumento,
      noDocumento: v.noDocumento.trim(),
    };

    this.guardando.set(true);
    this.dialogRef.disableClose = true;
    this.noDocumento.disable({ emitEvent: false });
    if (!this.esEdicion) {
      this.idPersona.disable({ emitEvent: false });
      this.idTipoDocumento.disable({ emitEvent: false });
    }
    this.data.guardar(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.guardando.set(false);
        this.dialogRef.disableClose = false;
        this.noDocumento.enable({ emitEvent: false });
        if (!this.esEdicion) {
          this.idPersona.enable({ emitEvent: false });
          this.idTipoDocumento.enable({ emitEvent: false });
        }
      },
    });
  }
}
