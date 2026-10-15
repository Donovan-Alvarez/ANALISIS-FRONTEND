import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentoPersona, DocumentoPersonaPayload } from '../models/documento-persona.model';

/** /api/documentos-persona. La llave compuesta va en la URL: /{idTipoDocumento}/{idPersona}. */
@Injectable({ providedIn: 'root' })
export class DocumentoPersonaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/documentos-persona`;

  findAll(): Observable<DocumentoPersona[]> {
    return this.http.get<DocumentoPersona[]>(this.apiUrl);
  }

  findByPersona(idPersona: number): Observable<DocumentoPersona[]> {
    return this.http.get<DocumentoPersona[]>(`${this.apiUrl}/por-persona/${idPersona}`);
  }

  create(payload: DocumentoPersonaPayload): Observable<DocumentoPersona> {
    return this.http.post<DocumentoPersona>(this.apiUrl, payload);
  }

  /** Solo cambia el número de documento; tipo y persona son la llave. */
  update(idTipoDocumento: number, idPersona: number, noDocumento: string): Observable<DocumentoPersona> {
    return this.http.put<DocumentoPersona>(`${this.apiUrl}/${idTipoDocumento}/${idPersona}`, {
      idTipoDocumento,
      idPersona,
      noDocumento,
    });
  }

  delete(idTipoDocumento: number, idPersona: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idTipoDocumento}/${idPersona}`);
  }
}
