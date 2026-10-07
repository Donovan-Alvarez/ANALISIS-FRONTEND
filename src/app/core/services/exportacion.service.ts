import { Injectable, inject } from '@angular/core';
import type { jsPDF } from 'jspdf';
import { TokenService } from './token.service';

export type FormatoColumna = 'texto' | 'numero' | 'moneda' | 'fecha';

/** Una columna de la tabla a exportar/imprimir (D5). */
export interface ColumnaExport {
  encabezado: string;
  /** Propiedad de la fila; admite rutas con punto, p. ej. 'persona.nombre'. */
  campo: string;
  formato?: FormatoColumna;
}

const LOCALE = 'es-GT';
const MONEDA = 'GTQ';
const MIME_PDF = 'application/pdf';
const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const FORMATO_NUMERO = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });
const FORMATO_MONEDA = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: MONEDA });

const NUMFMT_EXCEL: Record<FormatoColumna, string | undefined> = {
  texto: undefined,
  numero: '#,##0.##',
  moneda: '"Q"#,##0.00',
  fecha: 'dd/mm/yyyy',
};

// ── Conversión de valores (funciones puras, exportadas para las pruebas) ──

/** Lee `campo` de la fila, siguiendo rutas con punto. */
export function valorDe(fila: object, campo: string): unknown {
  return campo
    .split('.')
    .reduce<unknown>((actual, parte) => (actual == null ? undefined : (actual as Record<string, unknown>)[parte]), fila);
}

interface PartesFecha {
  anio: number;
  mes: number; // 1-12
  dia: number;
  hora: number;
  minuto: number;
  segundo: number;
}

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;

/**
 * Extrae año/mes/día (y hora) SIN pasar por UTC.
 *
 * El backend manda LocalDate ('2026-10-07') o LocalDateTime
 * ('2026-10-07T00:30:00') sin zona. `new Date('2026-10-07')` lo interpreta
 * como medianoche UTC, que en Guatemala (UTC-6) es el 6 de octubre a las
 * 18:00: por eso aquí se leen los números del texto tal cual.
 */
function partesDeFecha(valor: unknown): PartesFecha | null {
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    return {
      anio: valor.getFullYear(),
      mes: valor.getMonth() + 1,
      dia: valor.getDate(),
      hora: valor.getHours(),
      minuto: valor.getMinutes(),
      segundo: valor.getSeconds(),
    };
  }
  if (typeof valor !== 'string') return null;
  const m = PATRON_FECHA.exec(valor.trim());
  if (!m) return null;
  return {
    anio: Number(m[1]),
    mes: Number(m[2]),
    dia: Number(m[3]),
    hora: Number(m[4] ?? 0),
    minuto: Number(m[5] ?? 0),
    segundo: Number(m[6] ?? 0),
  };
}

function aNumero(valor: unknown): number | null {
  if (valor == null || valor === '') return null;
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

const dosDigitos = (n: number): string => String(n).padStart(2, '0');

/** Texto que se muestra en la celda del PDF. Nulos o inválidos → ''. */
export function textoCelda(valor: unknown, formato: FormatoColumna = 'texto'): string {
  switch (formato) {
    case 'numero': {
      const n = aNumero(valor);
      return n == null ? '' : FORMATO_NUMERO.format(n);
    }
    case 'moneda': {
      const n = aNumero(valor);
      return n == null ? '' : FORMATO_MONEDA.format(n);
    }
    case 'fecha': {
      const p = partesDeFecha(valor);
      return p ? `${dosDigitos(p.dia)}/${dosDigitos(p.mes)}/${p.anio}` : '';
    }
    default:
      return valor == null ? '' : String(valor);
  }
}

/**
 * Valor tipado para la celda de Excel. Las fechas salen como Date real
 * construida en UTC, porque exceljs escribe las fechas en UTC: así Excel
 * muestra el mismo día que mandó el backend.
 */
export function valorExcel(valor: unknown, formato: FormatoColumna = 'texto'): string | number | Date | null {
  switch (formato) {
    case 'numero':
    case 'moneda':
      return aNumero(valor);
    case 'fecha': {
      const p = partesDeFecha(valor);
      return p ? new Date(Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo)) : null;
    }
    default:
      return valor == null ? null : String(valor);
  }
}

/** 'Estados civiles' → 'estados-civiles_2026-10-07' */
export function nombreArchivo(titulo: string, hoy = new Date()): string {
  const base =
    titulo
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'exportacion';
  const fecha = `${hoy.getFullYear()}-${dosDigitos(hoy.getMonth() + 1)}-${dosDigitos(hoy.getDate())}`;
  return `${base}_${fecha}`;
}

/** Excel limita el nombre de hoja a 31 caracteres y prohíbe []:*?/\ */
export function nombreHojaValido(nombre: string): string {
  const limpio = nombre.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31);
  return limpio || 'Hoja1';
}

/**
 * Servicio único de PDF/Excel/impresión para todas las pantallas (D5).
 *
 * jsPDF, jspdf-autotable y ExcelJS se cargan con import() dinámico: no pesan
 * en el bundle inicial y solo se descargan con el primer clic en Imprimir o
 * Exportar. Si una pantalla necesita algo que este servicio no cubre, se
 * extiende aquí; nadie agrega otra librería por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class ExportacionService {
  private readonly tokenService = inject(TokenService);

  async exportarPdf(titulo: string, columnas: ColumnaExport[], filas: object[]): Promise<void> {
    const doc = await this.generarPdf(titulo, columnas, filas);
    this.descargar(doc.output('blob'), `${nombreArchivo(titulo)}.pdf`);
  }

  /** Mismo PDF que exportarPdf, con autoPrint, abierto en un iframe oculto. */
  async imprimir(titulo: string, columnas: ColumnaExport[], filas: object[]): Promise<void> {
    const doc = await this.generarPdf(titulo, columnas, filas);
    doc.autoPrint();
    this.imprimirEnIframe(doc.output('blob'));
  }

  async exportarExcel(nombreHoja: string, columnas: ColumnaExport[], filas: object[]): Promise<void> {
    const modulo = await import('exceljs');
    // El build de navegador de exceljs es UMD: según el bundler llega como
    // default o como namespace.
    const ExcelJS: typeof modulo.default = modulo.default ?? (modulo as unknown as typeof modulo.default);

    const libro = new ExcelJS.Workbook();
    libro.creator = this.usuarioActual();
    libro.created = new Date();

    const hoja = libro.addWorksheet(nombreHojaValido(nombreHoja), {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    hoja.columns = columnas.map((c, i) => ({
      header: c.encabezado,
      key: `c${i}`,
      width: this.anchoColumna(c, filas),
      style: NUMFMT_EXCEL[c.formato ?? 'texto'] ? { numFmt: NUMFMT_EXCEL[c.formato ?? 'texto'] } : {},
    }));

    for (const fila of filas) {
      const registro: Record<string, unknown> = {};
      columnas.forEach((c, i) => (registro[`c${i}`] = valorExcel(valorDe(fila, c.campo), c.formato)));
      hoja.addRow(registro);
    }

    const encabezado = hoja.getRow(1);
    encabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    encabezado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6C69E0' } };
    hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnas.length } };

    const buffer = await libro.xlsx.writeBuffer();
    this.descargar(new Blob([buffer], { type: MIME_XLSX }), `${nombreArchivo(nombreHoja)}.xlsx`);
  }

  // ── PDF ────────────────────────────────────────────────────────────

  private async generarPdf(titulo: string, columnas: ColumnaExport[], filas: object[]): Promise<jsPDF> {
    const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

    const doc = new jsPDF({
      unit: 'pt',
      format: 'letter',
      orientation: columnas.length > 5 ? 'landscape' : 'portrait',
    });
    const margen = 40;
    const totalPaginas = '{total_pages_count_string}';
    const generado = new Date().toLocaleString(LOCALE, { dateStyle: 'short', timeStyle: 'short' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(titulo, margen, margen);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 106, 134);
    doc.text(`Generado: ${generado} · Usuario: ${this.usuarioActual()}`, margen, margen + 16);

    const columnStyles: Record<number, { halign: 'right' }> = {};
    columnas.forEach((c, i) => {
      if (c.formato === 'numero' || c.formato === 'moneda') columnStyles[i] = { halign: 'right' };
    });

    autoTable(doc, {
      startY: margen + 30,
      margin: { left: margen, right: margen, bottom: margen },
      head: [columnas.map((c) => c.encabezado)],
      body: filas.map((fila) => columnas.map((c) => textoCelda(valorDe(fila, c.campo), c.formato))),
      columnStyles,
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [108, 105, 224], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 246, 255] },
      didDrawPage: () => {
        const ancho = doc.internal.pageSize.getWidth();
        const alto = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(107, 106, 134);
        doc.text(`Página ${doc.getNumberOfPages()} de ${totalPaginas}`, ancho - margen, alto - 20, { align: 'right' });
      },
    });

    doc.putTotalPages(totalPaginas);
    return doc;
  }

  // ── Utilidades ─────────────────────────────────────────────────────

  private usuarioActual(): string {
    const usuario = this.tokenService.getUsuario();
    return usuario?.nombre || usuario?.idUsuario || 'Sin sesión';
  }

  private anchoColumna(columna: ColumnaExport, filas: object[]): number {
    const largos = filas.map((f) => textoCelda(valorDe(f, columna.campo), columna.formato).length);
    return Math.min(60, Math.max(10, columna.encabezado.length, ...largos) + 2);
  }

  /** Descarga sin file-saver: Blob + URL.createObjectURL + <a download>. */
  private descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Un window.open después de un await lo frenan los bloqueadores de
   * ventanas emergentes; el iframe oculto no. El PDF trae autoPrint, así que
   * el visor abre el diálogo de impresión al cargar.
   */
  private imprimirEnIframe(blob: Blob): void {
    const url = URL.createObjectURL(new Blob([blob], { type: MIME_PDF }));
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;
    document.body.appendChild(iframe);
    // Se limpia con margen: si se quita antes de que el usuario cierre el
    // diálogo de impresión, algunos navegadores cancelan la impresión.
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  }
}
