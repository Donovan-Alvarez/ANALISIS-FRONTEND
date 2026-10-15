import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validaciones de Personas y Documentos de Persona. Son el ESPEJO de las del backend
 * (PersonaDTO, PersonaService, NumeroDocumentoValidador): aquí solo dan respuesta
 * inmediata al usuario; la que manda siempre es la del backend. Si se cambia una regla,
 * se cambia en los dos lados.
 */

/** 14 = edad mínima laboral en Guatemala; el seed oficial trae personas de 16-17 años. Igual que PersonaService. */
export const EDAD_MINIMA = 14;
export const EDAD_MAXIMA = 100;

export const REGEX_NOMBRE = /^\s*\p{L}[\p{L} '.-]*\s*$/u;
export const REGEX_CORREO = /^\s*[A-Za-z0-9]+([._%+-][A-Za-z0-9]+)*@([A-Za-z0-9]+(-[A-Za-z0-9]+)*\.)+[A-Za-z]{2,}\s*$/;
export const REGEX_TELEFONO = /^\s*\+?[0-9][0-9 -]{6,18}[0-9]\s*$/;

const DIGITOS_TELEFONO_MIN = 8;
const DIGITOS_TELEFONO_MAX = 15;

// ── Fechas (siempre como texto 'yyyy-MM-dd', sin pasar por Date/UTC) ──────

interface Fecha {
  anio: number;
  mes: number;
  dia: number;
}

function partesDeFecha(iso: string): Fecha | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return null;
  return { anio: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
}

const dosDigitos = (n: number): string => String(n).padStart(2, '0');

/** Hoy en Guatemala como 'yyyy-MM-dd' (igual que el backend; no depende de la zona del navegador). */
export function hoyGuatemala(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guatemala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

/** Años cumplidos entre una fecha de nacimiento y `hoy` (ambas 'yyyy-MM-dd'). null si alguna no es válida. */
export function edadEn(fechaNacimiento: string, hoy: string): number | null {
  const n = partesDeFecha(fechaNacimiento);
  const h = partesDeFecha(hoy);
  if (!n || !h) return null;
  let edad = h.anio - n.anio;
  if (h.mes < n.mes || (h.mes === n.mes && h.dia < n.dia)) edad--;
  return edad;
}

/** Fecha más reciente que todavía cumple la edad mínima: hoy menos EDAD_MINIMA años. Sirve de `max` del <input type="date">. */
export function fechaMaximaNacimiento(hoy: string = hoyGuatemala()): string {
  const h = partesDeFecha(hoy);
  if (!h) return '';
  // 29 de febrero -> 28 si el año de hace EDAD_MINIMA años no es bisiesto.
  const anio = h.anio - EDAD_MINIMA;
  const esBisiesto = (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
  const dia = h.mes === 2 && h.dia === 29 && !esBisiesto ? 28 : h.dia;
  return `${anio}-${dosDigitos(h.mes)}-${dosDigitos(dia)}`;
}

/** Mensaje de error para una fecha de nacimiento, o null si es válida. */
export function errorFechaNacimiento(fechaNacimiento: string, hoy: string = hoyGuatemala()): string | null {
  if (!fechaNacimiento) return 'La fecha de nacimiento es obligatoria.';
  if (!partesDeFecha(fechaNacimiento) || edadEn(fechaNacimiento, hoy) === null) {
    return 'La fecha de nacimiento no es válida.';
  }
  if (fechaNacimiento >= hoy) return 'La fecha de nacimiento no puede ser hoy ni una fecha futura.';
  const edad = edadEn(fechaNacimiento, hoy)!;
  if (edad < EDAD_MINIMA) return `La persona debe tener al menos ${EDAD_MINIMA} años (edad calculada: ${edad}).`;
  if (edad > EDAD_MAXIMA) return `La fecha de nacimiento no es razonable: supera los ${EDAD_MAXIMA} años de edad.`;
  return null;
}

// ── Teléfono ─────────────────────────────────────────────────────────

export function errorTelefono(telefono: string): string | null {
  const valor = (telefono ?? '').trim();
  if (!valor) return 'El teléfono es obligatorio.';
  if (!REGEX_TELEFONO.test(valor)) return 'Solo números, espacios y guiones (con + opcional al inicio).';
  const digitos = valor.replace(/\D/g, '').length;
  if (digitos < DIGITOS_TELEFONO_MIN || digitos > DIGITOS_TELEFONO_MAX) {
    return `El teléfono debe tener entre ${DIGITOS_TELEFONO_MIN} y ${DIGITOS_TELEFONO_MAX} dígitos.`;
  }
  return null;
}

// ── Número de documento ───────────────────────────────────────────────

const sinTildes = (texto: string | null | undefined): string =>
  (texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function esDpi(nombreTipo: string | null | undefined): boolean {
  const nombre = sinTildes(nombreTipo);
  return /\bdpi\b/.test(nombre) || nombre.startsWith('documento personal de identificacion');
}

export function esNit(nombreTipo: string | null | undefined): boolean {
  return sinTildes(nombreTipo) === 'nit';
}

/** Ayuda bajo el campo, según el tipo elegido. */
export function ayudaNumeroDocumento(nombreTipo: string | null | undefined): string {
  if (!nombreTipo) return 'Elige primero el tipo de documento.';
  if (esDpi(nombreTipo)) return 'DPI: 13 dígitos (ej. 2345 67890 1234).';
  if (esNit(nombreTipo)) return 'NIT: dígitos con dígito verificador (ej. 1234567-8 o 1234567-K).';
  return 'Entre 4 y 50 caracteres: letras, números, espacios, puntos y guiones.';
}

/** Mensaje de error para el número según el tipo, o null si es válido (mismas reglas que el backend). */
export function errorNumeroDocumento(nombreTipo: string | null | undefined, numero: string): string | null {
  const limpio = (numero ?? '').trim();
  if (!limpio) return 'El número de documento es obligatorio.';
  if (limpio.length > 50) return 'El número de documento no puede superar los 50 caracteres.';

  if (esDpi(nombreTipo)) {
    if (!/^[0-9 -]+$/.test(limpio)) return 'El DPI solo puede contener números (13 dígitos).';
    const digitos = limpio.replace(/[ -]/g, '').length;
    return digitos === 13 ? null : `El DPI debe tener exactamente 13 dígitos (ingresaste ${digitos}).`;
  }
  if (esNit(nombreTipo)) {
    return /^[0-9]{4,12}-?[0-9K]$/i.test(limpio.replace(/ /g, ''))
      ? null
      : 'El NIT debe ser numérico con dígito verificador (ej. 1234567-8 o 1234567-K).';
  }
  return limpio.length >= 4 && /^[A-Za-z0-9][A-Za-z0-9 ./-]*$/.test(limpio)
    ? null
    : 'Debe tener entre 4 y 50 caracteres, solo letras, números, espacios, puntos y guiones.';
}

// ── Validadores de Angular (ValidatorFn) ──────────────────────────────

/** Texto sin solo-espacios (Validators.required deja pasar "   "). */
export function noSoloEspacios(control: AbstractControl<string | null>): ValidationErrors | null {
  const valor = control.value ?? '';
  return valor.length > 0 && valor.trim().length === 0 ? { soloEspacios: true } : null;
}

export function validarFechaNacimiento(control: AbstractControl<string | null>): ValidationErrors | null {
  const valor = control.value ?? '';
  if (!valor) return null; // lo cubre Validators.required
  const mensaje = errorFechaNacimiento(valor);
  return mensaje ? { fechaNacimiento: mensaje } : null;
}

export function validarTelefono(control: AbstractControl<string | null>): ValidationErrors | null {
  const valor = control.value ?? '';
  if (!valor.trim()) return null; // lo cubre Validators.required / noSoloEspacios
  const mensaje = errorTelefono(valor);
  return mensaje ? { telefono: mensaje } : null;
}
