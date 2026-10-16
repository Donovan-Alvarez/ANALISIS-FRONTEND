/** CuentaBancariaEmpleadoDTO del backend (GET/POST/PUT /api/cuentas-bancarias). */
export interface CuentaBancaria {
  idCuentaBancaria: number;
  idEmpleado: number;
  idBanco: number;
  numeroDeCuenta: string;
  activa: boolean;
  nombreEmpleado: string;
  nombrePuesto: string;
  nombreBanco: string;
}

/** Fila de la tabla: la cuenta más el texto de su estado (para exportar). */
export interface CuentaBancariaFila extends CuentaBancaria {
  estado: string;
}

export interface CuentaBancariaPayload {
  idEmpleado: number;
  idBanco: number;
  numeroDeCuenta: string;
  activa: boolean;
}

/** Dígitos separados por guiones, igual que el @Pattern del DTO. Ej. 001-438715 */
export const PATRON_NUMERO_CUENTA = /^\d+(-\d+)*$/;
export const LONGITUD_MIN_NUMERO_CUENTA = 5;
export const LONGITUD_MAX_NUMERO_CUENTA = 50;
