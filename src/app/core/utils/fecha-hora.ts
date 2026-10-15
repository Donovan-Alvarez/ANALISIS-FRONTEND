const PATRON = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];


export function fechaHoraTexto(valor: string | null | undefined): string {
  if (!valor) return '';
  const m = PATRON.exec(valor);
  if (!m) return '';
  const fecha = `${m[3]}/${m[2]}/${m[1]}`;
  return m[4] ? `${fecha} ${m[4]}:${m[5]}` : fecha;
}

/** (2026, 10) -> 'Octubre 2026' */
export function etiquetaPeriodo(anio: number, mes: number): string {
  return `${MESES[mes - 1] ?? mes} ${anio}`;
}
