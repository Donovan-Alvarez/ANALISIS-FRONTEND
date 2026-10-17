import { calcularIgss, calcularIsrMensual } from './deducciones-ley';

describe('Descuentos de ley (Guatemala)', () => {
  describe('IGSS 4.83 %', () => {
    it('coincide con los datos de ejemplo del script del curso', () => {
      expect(calcularIgss(11_000)).toBe(531.3);
      expect(calcularIgss(10_500)).toBe(507.15);
      expect(calcularIgss(9_500)).toBe(458.85);
      expect(calcularIgss(7_000)).toBe(338.1);
    });

    it('sueldo cero, negativo o vacío no descuenta', () => {
      expect(calcularIgss(0)).toBe(0);
      expect(calcularIgss(-100)).toBe(0);
      expect(calcularIgss(Number.NaN)).toBe(0);
    });
  });

  describe('ISR mensual', () => {
    it('no retiene si la renta anual no supera la deducción de Q48,000 + IGSS', () => {
      // 3,700 × 12 = 44,400 < 48,000
      expect(calcularIsrMensual(3_700)).toBe(0);
    });

    it('primer tramo: 5 % sobre la renta imponible anual', () => {
      // 11,000 × 12 = 132,000 − 48,000 − 6,375.60 (IGSS) = 77,624.40 × 5 % = 3,881.22 / 12
      expect(calcularIsrMensual(11_000)).toBe(323.44);
      // 7,000 × 12 = 84,000 − 48,000 − 4,057.20 = 31,942.80 × 5 % = 1,597.14 / 12
      expect(calcularIsrMensual(7_000)).toBe(133.1);
    });

    it('segundo tramo: Q15,000 + 7 % sobre el excedente de Q300,000', () => {
      // 40,000 × 12 = 480,000 − 48,000 − 23,184 (IGSS) = 408,816
      // 15,000 + (108,816 × 7 % = 7,617.12) = 22,617.12 / 12
      expect(calcularIsrMensual(40_000)).toBe(1_884.76);
    });
  });
});
