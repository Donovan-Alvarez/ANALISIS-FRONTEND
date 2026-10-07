import {
  nombreArchivo,
  nombreHojaValido,
  textoCelda,
  valorDe,
  valorExcel,
} from './exportacion.service';

describe('ExportacionService · conversión de valores', () => {
  describe('fechas sin zona del backend (LocalDate / LocalDateTime)', () => {
    it("'2026-10-07' se muestra 07/10/2026, nunca el día anterior", () => {
      expect(textoCelda('2026-10-07', 'fecha')).toBe('07/10/2026');
    });

    it("'2026-10-07T00:30:00' se muestra 07/10/2026, nunca el día anterior", () => {
      expect(textoCelda('2026-10-07T00:30:00', 'fecha')).toBe('07/10/2026');
    });

    it('el atajo ingenuo con new Date() sí falla en una zona UTC-x (control de la prueba)', () => {
      // Documenta por qué no se usa new Date(texto): en Guatemala (UTC-6)
      // '2026-10-07' se lee como UTC y cae el 6 de octubre.
      const desfaseMin = new Date(2026, 9, 7).getTimezoneOffset();
      const ingenuo = new Date('2026-10-07').getDate();
      expect(ingenuo).toBe(desfaseMin > 0 ? 6 : 7);
    });

    it("en Excel '2026-10-07' sale como Date real con el mismo día", () => {
      const v = valorExcel('2026-10-07', 'fecha');
      expect(v).toBeInstanceOf(Date);
      const d = v as Date;
      expect([d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]).toEqual([2026, 10, 7]);
    });

    it("en Excel '2026-10-07T00:30:00' sale como Date real con el mismo día y hora", () => {
      const v = valorExcel('2026-10-07T00:30:00', 'fecha');
      expect(v).toBeInstanceOf(Date);
      const d = v as Date;
      expect([d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()]).toEqual([
        2026, 10, 7, 0, 30,
      ]);
    });

    it('un Date local conserva su día', () => {
      expect(textoCelda(new Date(2026, 9, 7, 0, 30), 'fecha')).toBe('07/10/2026');
      const d = valorExcel(new Date(2026, 9, 7, 0, 30), 'fecha') as Date;
      expect(d.getUTCDate()).toBe(7);
    });

    it('nulo o texto que no es fecha queda vacío', () => {
      expect(textoCelda(null, 'fecha')).toBe('');
      expect(textoCelda('no es fecha', 'fecha')).toBe('');
      expect(valorExcel(undefined, 'fecha')).toBeNull();
    });
  });

  describe('números y moneda (es-GT, GTQ)', () => {
    it('numero con separador de miles', () => {
      expect(textoCelda(1234.5, 'numero')).toBe('1,234.5');
      expect(valorExcel('1234.5', 'numero')).toBe(1234.5);
    });

    it('moneda en quetzales', () => {
      expect(textoCelda(1234.5, 'moneda')).toMatch(/^Q\s?1,234\.50$/);
      expect(valorExcel(1234.5, 'moneda')).toBe(1234.5);
    });

    it('valor no numérico queda vacío', () => {
      expect(textoCelda('abc', 'numero')).toBe('');
      expect(valorExcel('abc', 'moneda')).toBeNull();
    });
  });

  describe('utilidades', () => {
    it('texto por defecto y nulos', () => {
      expect(textoCelda('Soltero(a)')).toBe('Soltero(a)');
      expect(textoCelda(null)).toBe('');
    });

    it('valorDe sigue rutas con punto', () => {
      expect(valorDe({ persona: { nombre: 'Ana' } }, 'persona.nombre')).toBe('Ana');
      expect(valorDe({ persona: null }, 'persona.nombre')).toBeUndefined();
    });

    it('nombre de archivo sin tildes ni espacios, con fecha local', () => {
      expect(nombreArchivo('Estados civiles', new Date(2026, 9, 7))).toBe('estados-civiles_2026-10-07');
      expect(nombreArchivo('Liquidación de Empleado', new Date(2026, 0, 2))).toBe('liquidacion-de-empleado_2026-01-02');
    });

    it('nombre de hoja válido para Excel', () => {
      expect(nombreHojaValido('Estados civiles')).toBe('Estados civiles');
      expect(nombreHojaValido('a/b:c*d?[e]')).toBe('a b c d  e');
      expect(nombreHojaValido('x'.repeat(40))).toHaveLength(31);
    });
  });
});
