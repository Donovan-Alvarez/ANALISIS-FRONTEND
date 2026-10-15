import {
  EDAD_MAXIMA,
  EDAD_MINIMA,
  REGEX_CORREO,
  REGEX_NOMBRE,
  ayudaNumeroDocumento,
  edadEn,
  errorFechaNacimiento,
  errorNumeroDocumento,
  errorTelefono,
  esDpi,
  esNit,
  fechaMaximaNacimiento,
  hoyGuatemala,
} from './validaciones-persona';

const HOY = '2026-10-13';
const DPI = 'Documento Personal de Identificacion (DPI)';

describe('validaciones-persona', () => {
  describe('fechas y edad', () => {
    it('calcula los años cumplidos respetando el día del cumpleaños', () => {
      expect(edadEn('2008-10-13', HOY)).toBe(18);
      expect(edadEn('2008-10-14', HOY)).toBe(17);
      expect(edadEn('1992-11-25', HOY)).toBe(33);
      expect(edadEn('no-es-fecha', HOY)).toBeNull();
    });

    it('rechaza fechas vacías, de hoy y futuras', () => {
      expect(errorFechaNacimiento('', HOY)).toContain('obligatoria');
      expect(errorFechaNacimiento(HOY, HOY)).toContain('hoy ni una fecha futura');
      expect(errorFechaNacimiento('2027-01-01', HOY)).toContain('futura');
    });

    it(`exige al menos ${EDAD_MINIMA} años y como máximo ${EDAD_MAXIMA}`, () => {
      expect(errorFechaNacimiento('2008-10-13', HOY)).toBeNull(); // cumple 18 hoy
      expect(errorFechaNacimiento('2008-10-14', HOY)).toContain('al menos 18');
      expect(errorFechaNacimiento('1926-10-13', HOY)).toBeNull(); // 100 años exactos
      expect(errorFechaNacimiento('1925-10-12', HOY)).toContain('no es razonable');
    });

    it('la fecha máxima del selector es hoy menos 18 años (y maneja el 29 de febrero)', () => {
      expect(fechaMaximaNacimiento(HOY)).toBe('2008-10-13');
      expect(fechaMaximaNacimiento('2028-02-29')).toBe('2010-02-28');
      expect(errorFechaNacimiento(fechaMaximaNacimiento(HOY), HOY)).toBeNull();
    });

    it('hoyGuatemala usa la zona de Guatemala, no la del navegador', () => {
      // 2026-10-14 03:30 UTC sigue siendo el 13 de octubre en Guatemala (UTC-6).
      expect(hoyGuatemala(new Date('2026-10-14T03:30:00Z'))).toBe('2026-10-13');
    });
  });

  describe('formatos de texto', () => {
    it('acepta nombres con tildes, ñ, apóstrofe y guion', () => {
      for (const ok of ['Ernesto Arturo', 'Aguilar Ríos', "O'Connor", 'Ana-Lucía', 'Núñez']) {
        expect(REGEX_NOMBRE.test(ok), ok).toBe(true);
      }
      for (const mal of ['123', 'Ana1', '', '-Ana', '@x']) {
        expect(REGEX_NOMBRE.test(mal), mal).toBe(false);
      }
    });

    it('valida el correo (el vacío lo permite el Validators.pattern, es opcional)', () => {
      for (const ok of ['equesada@itcompany.com', 'a@b.co', 'juan.perez@mail.example.org', 'nombre+tag@dominio.gt']) {
        expect(REGEX_CORREO.test(ok), ok).toBe(true);
      }
      for (const mal of ['sinarroba.com', 'a@b', 'a@b.', '@x.com', 'a..b@x.com', '.a@x.com', 'a@-x.com', 'a b@x.com', 'a@x.c']) {
        expect(REGEX_CORREO.test(mal), mal).toBe(false);
      }
    });

    it('valida el teléfono: formato y entre 8 y 15 dígitos', () => {
      for (const ok of ['502-53180319', '53180319', '+502 5318 0319', '5318-0319']) {
        expect(errorTelefono(ok), ok).toBeNull();
      }
      expect(errorTelefono('')).toContain('obligatorio');
      expect(errorTelefono('123')).not.toBeNull();
      expect(errorTelefono('abcdefgh')).not.toBeNull();
      expect(errorTelefono('1234567890123456')).toContain('entre 8 y 15');
    });
  });

  describe('número de documento', () => {
    it('reconoce DPI y NIT por el nombre del tipo, sin importar tildes ni mayúsculas', () => {
      expect(esDpi(DPI)).toBe(true);
      expect(esDpi('DPI')).toBe(true);
      expect(esDpi('Pasaporte')).toBe(false);
      expect(esNit('NIT')).toBe(true);
      expect(esNit(' nit ')).toBe(true);
      expect(esNit('NIT especial')).toBe(false);
    });

    it('DPI: exactamente 13 dígitos (acepta espacios y guiones)', () => {
      expect(errorNumeroDocumento(DPI, '9843 55061 4572')).toBeNull();
      expect(errorNumeroDocumento(DPI, '2345678901234')).toBeNull();
      expect(errorNumeroDocumento(DPI, '2345-67890-1234')).toBeNull();
      expect(errorNumeroDocumento(DPI, '12345')).toContain('13 dígitos');
      expect(errorNumeroDocumento(DPI, '98435506145721')).toContain('13 dígitos');
      expect(errorNumeroDocumento(DPI, '9843A55061457')).toContain('solo puede contener números');
    });

    it('NIT: dígitos y verificador (0-9 o K), con o sin guion', () => {
      expect(errorNumeroDocumento('NIT', '1234567-8')).toBeNull();
      expect(errorNumeroDocumento('NIT', '12345678')).toBeNull();
      expect(errorNumeroDocumento('NIT', '1234567k')).toBeNull();
      expect(errorNumeroDocumento('NIT', '12')).not.toBeNull();
      expect(errorNumeroDocumento('NIT', 'abc-d')).not.toBeNull();
    });

    it('otros tipos: 4 a 50 caracteres alfanuméricos', () => {
      expect(errorNumeroDocumento('Pasaporte', 'A1234567')).toBeNull();
      expect(errorNumeroDocumento('Licencia de Conducir', '1234 56 789')).toBeNull();
      expect(errorNumeroDocumento('Pasaporte', 'ab')).not.toBeNull();
      expect(errorNumeroDocumento('Pasaporte', '***###')).not.toBeNull();
      expect(errorNumeroDocumento('Pasaporte', '   ')).toContain('obligatorio');
      expect(errorNumeroDocumento('Pasaporte', 'A'.repeat(51))).toContain('50 caracteres');
    });

    it('la ayuda del campo cambia con el tipo', () => {
      expect(ayudaNumeroDocumento(null)).toContain('Elige primero');
      expect(ayudaNumeroDocumento(DPI)).toContain('13 dígitos');
      expect(ayudaNumeroDocumento('NIT')).toContain('verificador');
      expect(ayudaNumeroDocumento('Pasaporte')).toContain('4 y 50');
    });
  });
});
