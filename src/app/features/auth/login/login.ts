import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { mensajeDeError } from '../../../core/utils/api-error';

const MENSAJE_CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  protected readonly loading = signal(false);
  protected readonly hidePassword = signal(true);

  protected readonly form = this.fb.nonNullable.group({
    idUsuario: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected togglePasswordVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.hidePassword.update((hidden) => !hidden);
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: respuesta => {
        const ruta = respuesta.requiereCambiarPassword ? '/cambiar-password-obligatorio' : '/empresas';
        this.router.navigateByUrl(ruta);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        // El backend distingue credenciales inválidas de cuenta bloqueada/inactiva
        // (y avisa cuántos intentos quedan antes de bloquear); mostramos ese
        // mensaje tal cual en vez de uno genérico fijo.
        this.notificationService.error(
          'No se pudo iniciar sesión',
          mensajeDeError(error, MENSAJE_CREDENCIALES_INVALIDAS),
        );
      },
    });
  }
}
