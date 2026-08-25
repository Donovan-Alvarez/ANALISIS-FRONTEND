/**
 * Conversion de fotografias entre el navegador y el backend.
 *
 * FileReader.readAsDataURL produce un data URI completo
 * ("data:image/png;base64,iVBORw0KGgo..."), pero el backend hace
 * Base64.getDecoder().decode(fotografiaBase64) sobre el valor tal cual: si le
 * llega el prefijo, revienta. Por eso se envia solo la parte base64 y al
 * mostrarla hay que volver a anteponer el data URI.
 */

/** Quita el prefijo "data:...;base64," si viene. */
export function aBase64Puro(dataUri: string | null): string | null {
  if (!dataUri) return null;
  const separador = dataUri.indexOf('base64,');
  return separador === -1 ? dataUri : dataUri.slice(separador + 'base64,'.length);
}

/**
 * Reconstruye el data URI para poder usarlo en un <img src>.
 * El backend no guarda el tipo MIME, asi que se deduce de los primeros bytes
 * codificados; si no se reconoce, PNG funciona porque el navegador olfatea el
 * contenido real de todos modos.
 */
export function aDataUri(base64: string | null): string | null {
  if (!base64) return null;
  if (base64.startsWith('data:')) return base64;

  let mime = 'image/png';
  if (base64.startsWith('/9j/')) mime = 'image/jpeg';
  else if (base64.startsWith('R0lGOD')) mime = 'image/gif';
  else if (base64.startsWith('UklGR')) mime = 'image/webp';
  else if (base64.startsWith('PHN2Zy')) mime = 'image/svg+xml';

  return `data:${mime};base64,${base64}`;
}
