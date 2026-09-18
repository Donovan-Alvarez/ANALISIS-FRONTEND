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
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TokenService } from '../../../core/services/token.service';

/** Los dos campos de la nueva contraseña deben coincidir. */
function passwordsCoincidenValidator(control: AbstractControl): ValidationErrors | null {
  const nuevo = control.get('passwordNuevo')?.value;
  const confirmar = control.get('confirmarPassword')?.value;
  return nuevo && confirmar && nuevo !== confirmar ? { noCoincide: true } : null;
}

/**
 * Pantalla de cambio obligatorio de contraseña: se muestra cuando el login
 * responde requiereCambiarPassword=true (ver cambiarPasswordGuard, que
 * bloquea el resto de la app hasta que esto se complete).
 */
@Component({
  selector: 'app-cambiar-password-obligatorio',
  imports: [ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './cambiar-password-obligatorio.html',
  styleUrl: './cambiar-password-obligatorio.scss',
})
export class CambiarPasswordObligatorio {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(false);
  protected readonly hidePassword = signal(true);
  protected readonly hideConfirmar = signal(true);
  protected readonly nombreUsuario = this.tokenService.getUsuario()?.nombre ?? '';

  protected readonly form = this.fb.nonNullable.group(
    {
      passwordNuevo: ['', Validators.required],
      confirmarPassword: ['', Validators.required],
    },
    { validators: passwordsCoincidenValidator },
  );

  protected togglePassword(): void {
    this.hidePassword.update(oculta => !oculta);
  }

  protected toggleConfirmar(): void {
    this.hideConfirmar.update(oculta => !oculta);
  }

  protected cambiarPassword(): void {
    if (this.form.invalid || this.cargando()) {
      this.form.markAllAsTouched();
      return;
    }

    const { passwordNuevo } = this.form.getRawValue();
    this.cargando.set(true);
    this.authService.cambiarPasswordPropio(passwordNuevo).subscribe({
      next: () => {
        this.cargando.set(false);
        this.notificationService.success('Contraseña actualizada', 'Ya puedes usar el sistema con normalidad.');
        this.router.navigateByUrl('/empresas');
      },
      error: () => this.cargando.set(false),
    });
  }

  protected cerrarSesion(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
