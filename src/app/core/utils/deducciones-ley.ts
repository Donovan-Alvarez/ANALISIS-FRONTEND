/**
 * Descuentos de ley de un asalariado en Guatemala, calculados sobre el sueldo
 * base mensual. La bonificación incentivo (Decreto 37-2001) no está afecta ni
 * al IGSS ni al ISR, por eso no entra en la base.
 *
 * IGSS — cuota laboral del 4.83 % sobre el salario (Acuerdo 1118 de la Junta
 * Directiva del IGSS). Coincide con los datos de ejemplo del script del curso:
 * Q11,000 × 4.83 % = Q531.30.
 *
 * ISR — Ley de Actualización Tributaria (Decreto 10-2012), rentas del trabajo:
 *   renta imponible anual = sueldo × 12 − Q48,000 (deducción fija) − IGSS anual
 *   impuesto anual        = 5 % hasta Q300,000; Q15,000 + 7 % sobre el excedente
 *   retención mensual     = impuesto anual / 12
 * El aguinaldo y el Bono 14 están exentos, así que no se suman a la proyección.
 */

export const TASA_IGSS_LABORAL = 0.0483;
export const DEDUCCION_ANUAL_ISR = 48_000;
export const LIMITE_PRIMER_TRAMO_ISR = 300_000;
export const TASA_ISR_PRIMER_TRAMO = 0.05;
export const TASA_ISR_SEGUNDO_TRAMO = 0.07;
export const IMPUESTO_FIJO_SEGUNDO_TRAMO = LIMITE_PRIMER_TRAMO_ISR * TASA_ISR_PRIMER_TRAMO; // Q15,000

/**
 * Redondeo a centavos (half-up). toFixed(8) limpia el error de punto flotante
 * antes de redondear: 323.435 llega como 323.43499999… y debe dar 323.44.
 */
export function aCentavos(monto: number): number {
  return Math.round(Number((monto * 100).toFixed(8))) / 100;
}

/** Cuota laboral mensual del IGSS. */
export function calcularIgss(sueldoBase: number): number {
  if (!Number.isFinite(sueldoBase) || sueldoBase <= 0) return 0;
  return aCentavos(sueldoBase * TASA_IGSS_LABORAL);
}

/** Retención mensual de ISR, proyectando el sueldo base a 12 meses. */
export function calcularIsrMensual(sueldoBase: number): number {
  if (!Number.isFinite(sueldoBase) || sueldoBase <= 0) return 0;
  const igssAnual = calcularIgss(sueldoBase) * 12;
  const imponible = Math.max(0, sueldoBase * 12 - DEDUCCION_ANUAL_ISR - igssAnual);
  const impuestoAnual =
    imponible <= LIMITE_PRIMER_TRAMO_ISR
      ? imponible * TASA_ISR_PRIMER_TRAMO
      : IMPUESTO_FIJO_SEGUNDO_TRAMO + (imponible - LIMITE_PRIMER_TRAMO_ISR) * TASA_ISR_SEGUNDO_TRAMO;
  return aCentavos(impuestoAnual / 12);
}
