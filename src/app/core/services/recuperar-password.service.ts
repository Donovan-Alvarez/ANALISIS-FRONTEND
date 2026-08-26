import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CambiarPasswordRequest,
  PreguntaRequest,
  PreguntaResponse,
  ValidarRespuestaRequest,
  ValidarRespuestaResponse,
} from '../models/recuperar-password.model';

/** Los 3 pasos del wizard de "olvidé mi contraseña" (sin sesión). */
@Injectable({ providedIn: 'root' })
export class RecuperarPasswordService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth/recuperar-password`;

  obtenerPregunta(idUsuario: string): Observable<PreguntaResponse> {
    const cuerpo: PreguntaRequest = { idUsuario };
    return this.http.post<PreguntaResponse>(`${this.apiUrl}/pregunta`, cuerpo);
  }

  validarRespuesta(idUsuario: string, respuesta: string): Observable<ValidarRespuestaResponse> {
    const cuerpo: ValidarRespuestaRequest = { idUsuario, respuesta };
    return this.http.post<ValidarRespuestaResponse>(`${this.apiUrl}/validar-respuesta`, cuerpo);
  }

  cambiarPassword(idToken: string, passwordNuevo: string): Observable<void> {
    const cuerpo: CambiarPasswordRequest = { idToken, passwordNuevo };
    return this.http.post<void>(`${this.apiUrl}/cambiar`, cuerpo);
  }
}
