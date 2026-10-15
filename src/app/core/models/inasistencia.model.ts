/** InasistenciaDTO del backend (GET/POST/PUT /api/inasistencias). */
export interface Inasistencia {
  idInasistencia: number;
  idEmpleado: number;
  nombreEmpleado: string;
  nombrePuesto: string;
  nombreDepartamento: string;
  /** 'YYYY-MM-DD' */
  fechaInicial: string;
  /** 'YYYY-MM-DD' */
  fechaFinal: string;
  dias: number;
  motivoInasistencia: string | null;
  /** Solo la pone el proceso Calcular Planilla; null = pendiente. */
  fechaProcesado: string | null;
  procesada: boolean;
}

/** Fila de la tabla: la inasistencia más el texto de su estado (para exportar). */
export interface InasistenciaFila extends Inasistencia {
  estado: string;
}

export interface InasistenciaPayload {
  idEmpleado: number;
  fechaInicial: string;
  fechaFinal: string;
  motivoInasistencia: string | null;
}

/** GET /api/inasistencias/empleados: opciones del combo de Empleado. */
export interface EmpleadoOpcion {
  idEmpleado: number;
  nombreCompleto: string;
  nombrePuesto: string;
  nombreDepartamento: string;
}