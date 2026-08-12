import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';

@Component({
  selector: 'app-header',
  imports: [MatIconModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  protected readonly usuario = this.tokenService.getUsuario();

  protected cerrarSesion(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}