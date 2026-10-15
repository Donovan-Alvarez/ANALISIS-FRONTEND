/** Espejo de EmpleadoDTO del backend (/api/empleados). */
export interface Empleado {
  idEmpleado?: number;
  idPersona: number | null;
  idSucursal: number | null;
  idPuesto: number | null;
  idStatusEmpleado: number | null;
  fechaContratacion: string | null; // ISO yyyy-MM-dd

  ingresoSueldoBase: number | null;
  ingresoBonificacionDecreto: number | null;
  ingresoOtrosIngresos: number | null;
  descuentoIgss: number | null;
  descuentoIsr: number | null;
  descuentoInasistencias: number | null;

  // Solo lectura: los resuelve el backend con JOIN.
  nombrePersona?: string;
  nombreSucursal?: string;
  nombrePuesto?: string;
  idDepartamento?: number;
  nombreDepartamento?: string;
  nombreStatus?: string;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  fechaModificacion?: string;
  usuarioModificacion?: string;
}

/**
 * Status al que un empleado concreto puede moverse ahora, segun
 * FLUJO_STATUS_EMPLEADO. GET /api/empleados/{id}/status-permitidos
 */
export interface StatusPermitido {
  idStatusEmpleado: number;
  nombre: string;
  /** Nombre del evento del flujo, o 'Sin cambio' para el status actual. */
  nombreEvento: string;
}

/** Persona para el combo. Provisional: GET /api/empleados/personas */
export interface PersonaCombo {
  idPersona: number;
  nombreCompleto: string;
}
