import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { RecuperarPasswordService } from '../../../core/services/recuperar-password.service';
import { mensajeDeError } from '../../../core/utils/api-error';

type Paso = 1 | 2 | 3;

/** Los dos campos de la nueva contraseña deben coincidir. */
function passwordsCoincidenValidator(control: AbstractControl): ValidationErrors | null {
  const nuevo = control.get('passwordNuevo')?.value;
  const confirmar = control.get('confirmarPassword')?.value;
  return nuevo && confirmar && nuevo !== confirmar ? { noCoincide: true } : null;
}

@Component({
  selector: 'app-recuperar-password',
  imports: [ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.scss',
})
export class RecuperarPassword {
  private readonly fb = inject(FormBuilder);
  private readonly recuperarPasswordService = inject(RecuperarPasswordService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly paso = signal<Paso>(1);
  protected readonly cargando = signal(false);
  protected readonly pregunta = signal<string | null>(null);
  protected readonly hidePassword = signal(true);
  protected readonly hideConfirmar = signal(true);

  /** Se arrastran entre pasos solo en memoria: nunca van a localStorage. */
  private readonly idUsuario = signal('');
  private readonly idToken = signal('');

  protected readonly formUsuario = this.fb.nonNullable.group({
    idUsuario: ['', Validators.required],
  });

  protected readonly formRespuesta = this.fb.nonNullable.group({
    respuesta: ['', Validators.required],
  });

  protected readonly formPassword = this.fb.nonNullable.group(
    {
      passwordNuevo: ['', Validators.required],
      confirmarPassword: ['', Validators.required],
    },
    { validators: passwordsCoincidenValidator },
  );

  protected togglePassword(): void {
    this.hidePassword.update((oculta) => !oculta);
  }

  protected toggleConfirmar(): void {
    this.hideConfirmar.update((oculta) => !oculta);
  }

  // ── Paso 1: usuario → pregunta ───────────────────────────────────────

  protected pedirPregunta(): void {
    if (this.formUsuario.invalid || this.cargando()) {
      this.formUsuario.markAllAsTouched();
      return;
    }

    const idUsuario = this.formUsuario.getRawValue().idUsuario;
    this.cargando.set(true);
    this.recuperarPasswordService.obtenerPregunta(idUsuario).subscribe({
      next: (respuesta) => {
        this.idUsuario.set(idUsuario);
        this.pregunta.set(respuesta.pregunta);
        this.cargando.set(false);
        this.paso.set(2);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.snackBar.open(
          mensajeDeError(error, 'No se encontró ese usuario'),
          'Cerrar',
          { duration: 5000 },
        );
      },
    });
  }

  // ── Paso 2: respuesta → token ────────────────────────────────────────

  protected validarRespuesta(): void {
    if (this.formRespuesta.invalid || this.cargando()) {
      this.formRespuesta.markAllAsTouched();
      return;
    }

    const respuesta = this.formRespuesta.getRawValue().respuesta;
    this.cargando.set(true);
    this.recuperarPasswordService.validarRespuesta(this.idUsuario(), respuesta).subscribe({
      next: (resultado) => {
        this.idToken.set(resultado.idToken);
        this.cargando.set(false);
        this.paso.set(3);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        // mensajeDeError() traduce 401 como "tu sesión expiró", pero aquí no
        // hay sesión: un 401 en este endpoint es "respuesta incorrecta".
        const mensaje =
          error.status === 401
            ? 'La respuesta no es correcta'
            : mensajeDeError(error, 'No se pudo validar la respuesta');
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
      },
    });
  }

  // ── Paso 3: nueva contraseña ─────────────────────────────────────────

  protected cambiarPassword(): void {
    if (this.formPassword.invalid || this.cargando()) {
      this.formPassword.markAllAsTouched();
      return;
    }

    const { passwordNuevo } = this.formPassword.getRawValue();
    this.cargando.set(true);
    this.recuperarPasswordService.cambiarPassword(this.idToken(), passwordNuevo).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigateByUrl('/login');
        this.snackBar.open('Contraseña actualizada. Ya puedes iniciar sesión.', 'Cerrar', {
          duration: 5000,
        });
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        // Aquí caen: token inválido/expirado (400) y política de contraseña
        // no cumplida (400, mismo mensaje que ya usa Usuarios).
        this.snackBar.open(
          mensajeDeError(error, 'No se pudo cambiar la contraseña'),
          'Cerrar',
          { duration: 6000 },
        );
      },
    });
  }

  // ── Navegación entre pasos ───────────────────────────────────────────

  protected volverAPaso1(): void {
    this.paso.set(1);
    this.pregunta.set(null);
    this.formRespuesta.reset();
  }
}
