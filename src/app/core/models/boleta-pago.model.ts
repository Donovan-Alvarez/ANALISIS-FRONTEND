export interface PeriodoPago {
  anio: number;
  mes: number;
}
export interface EmpleadoPago {
  idEmpleado: number;
  nombre: string;
}
export interface CuentaPago {
  idCuentaBancaria: number;
  banco: string;
  numeroDeCuenta: string;
}
export interface DetallePago {
  idPlanillaDetalle: number;
  anio: number;
  mes: number;
  idEmpleado: number;
  empleado: string;
  puesto: string;
  fechaContratacion: string;
  ingresoSueldoBase: number;
  ingresoBonificacionDecreto: number;
  ingresoOtrosIngresos: number;
  descuentoIgss: number;
  descuentoIsr: number;
  descuentoInasistencias: number;
  salarioNeto: number | null;
}
export interface BoletaPago {
  detalle: DetallePago;
  cuentasActivas: CuentaPago[];
}
