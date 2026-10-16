/** GET /api/reporte-planilla/periodos: períodos con planilla ya calculada. */
export interface PeriodoReporte {
  anio: number;
  mes: number;
  fechaInicio: string;
  fechaFin: string;
  fechaHoraProcesada: string;
  empleados: number;
}

/** Montos almacenados en PLANILLA_CABECERA. */
export interface CabeceraReporte {
  totalIngresos: number;
  totalDescuentos: number;
  salarioNeto: number;
}

/** Suma de las filas de PLANILLA_DETALLE (las hace el backend en BigDecimal). */
export interface TotalesReporte {
  empleados: number;
  ingresoSueldoBase: number;
  ingresoBonificacionDecreto: number;
  ingresoOtrosIngresos: number;
  totalIngresos: number;
  descuentoIgss: number;
  descuentoIsr: number;
  descuentoInasistencias: number;
  totalDescuentos: number;
  salarioNeto: number;
  diasInasistencia: number;
}

export interface DetalleReporte {
  idPlanillaDetalle: number;
  idEmpleado: number;
  nombreEmpleado: string;
  nombrePuesto: string;
  nombreDepartamento: string;
  ingresoSueldoBase: number;
  ingresoBonificacionDecreto: number;
  ingresoOtrosIngresos: number;
  totalIngresos: number;
  descuentoIgss: number;
  descuentoIsr: number;
  descuentoInasistencias: number;
  totalDescuentos: number;
  salarioNeto: number;
  diasInasistencia: number;
}

/** GET /api/reporte-planilla/{anio}/{mes} */
export interface ReportePlanillaResultado {
  anio: number;
  mes: number;
  fechaInicio: string;
  fechaFin: string;
  fechaHoraProcesada: string;
  usuarioProceso: string;
  cabecera: CabeceraReporte;
  totales: TotalesReporte;
  /** true si la suma del detalle coincide al centavo con la cabecera guardada. */
  cuadraConCabecera: boolean;
  detalle: DetalleReporte[];
}
