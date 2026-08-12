import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const MENSAJE_CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos';
const MENSAJE_ERROR_CONEXION = 'No se pudo conectar con el servidor. Intenta nuevamente.';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

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
      next: () => this.router.navigateByUrl('/empresas'),
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        const mensaje =
          error.status === 401 ? MENSAJE_CREDENCIALES_INVALIDAS : MENSAJE_ERROR_CONEXION;
        this.snackBar.open(mensaje, 'Cerrar', { duration: 4000 });
      },
    });
  }
}
