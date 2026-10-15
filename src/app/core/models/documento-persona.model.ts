/**
 * DocumentoPersonaDTO del backend (/api/documentos-persona).
 * La llave es compuesta (idTipoDocumento + idPersona): una persona no repite un tipo.
 * nombreTipoDocumento y nombrePersona son solo de lectura.
 */
export interface DocumentoPersona {
  idTipoDocumento: number;
  idPersona: number;
  noDocumento: string;
  nombreTipoDocumento?: string;
  nombrePersona?: string;
}

/** Lo que se envía en el POST/PUT. */
export type DocumentoPersonaPayload = Pick<DocumentoPersona, 'idTipoDocumento' | 'idPersona' | 'noDocumento'>;
