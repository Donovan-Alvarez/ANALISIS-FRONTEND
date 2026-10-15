/** Espejo de LiquidacionDTO (/api/liquidacion). Todo es de solo lectura. */
export interface Liquidacion {
  idLiquidacion: number;
  idEmpleado: number;
  nombrePersona: string;
  idPuesto: number;
  nombrePuesto: string;

  fechaContratacion: string;
  fechaEgreso: string;
  fechaLiquidacion: string;
  motivoEgreso: string;

  ingresoSueldoBase: number;
  ingresoBonificacionDecreto: number;
  ingresoOtrosIngresos: number;
  descuentoIgss: number;
  descuentoIsr: number;
  descuentoInasistencias: number;

  // Calculados por PR_LIQUIDACION_CALCULAR.
  salarioNeto: number;
  totalIngresos: number;
  totalDescuentos: number;
  totalNeto: number;

  fechaCreacion: string;
  usuarioCreacion: string;
}

/**
 * Lo unico que se envia. Los montos y el puesto NO viajan: el procedimiento
 * los toma del empleado, asi nadie los altera desde el cliente.
 */
export interface LiquidacionRequest {
  idEmpleado: number;
  fechaEgreso: string;
  fechaLiquidacion: string;
  motivoEgreso: string;
}

/** Empleado que todavia puede liquidarse, para el combo de la pantalla. */
export interface EmpleadoLiquidable {
  idEmpleado: number;
  nombrePersona: string;
  idPuesto: number;
  nombrePuesto: string;
  fechaContratacion: string;
  ingresoSueldoBase: number;
  ingresoBonificacionDecreto: number;
  ingresoOtrosIngresos: number;
  descuentoIgss: number;
  descuentoIsr: number;
  descuentoInasistencias: number;
}
