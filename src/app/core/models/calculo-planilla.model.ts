
export interface PeriodoPlanilla {
  anio: number;
  mes: number;
  fechaInicio: string;
  fechaFin: string;
  calculado: boolean;
  totalIngresos: number | null;
  totalDescuentos: number | null;
  salarioNeto: number | null;
  fechaHoraProcesada: string | null;
  usuarioProceso: string | null;
  empleadosCalculados: number;
}


export interface PeriodoPlanillaFila extends PeriodoPlanilla {
  clave: string;
  etiqueta: string;
  estado: string;
}

export interface CalculoPlanillaPayload {
  anio: number;
  mes: number;
}

export interface ResultadoCalculoPlanilla {
  anio: number;
  mes: number;
  empleadosProcesados: number;
  inasistenciasProcesadas: number;
  totalIngresos: number;
  totalDescuentos: number;
  salarioNeto: number;
  fechaHoraProcesada: string;
  usuario: string;
}