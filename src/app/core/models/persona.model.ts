/**
 * PersonaDTO del backend (GET/POST/PUT/DELETE /api/personas).
 * nombreGenero, nombreEstadoCivil y nombreCompleto son solo de lectura:
 * el backend los ignora si llegan en el cuerpo.
 */
export interface Persona {
  idPersona?: number;
  nombre: string;
  apellido: string;
  /** 'yyyy-MM-dd' (LocalDate): es lo que entrega y recibe <input type="date">. */
  fechaNacimiento: string;
  idGenero: number;
  nombreGenero?: string;
  direccion: string;
  telefono: string;
  correoElectronico?: string | null;
  idEstadoCivil: number;
  nombreEstadoCivil?: string;
  nombreCompleto?: string;
}

/** Lo que se envía en el POST/PUT. */
export type PersonaPayload = Omit<Persona, 'idPersona' | 'nombreGenero' | 'nombreEstadoCivil' | 'nombreCompleto'>;
