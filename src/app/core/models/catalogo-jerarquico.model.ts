import type { Observable } from 'rxjs';
import type { CatalogoJerarquicoApi } from '../services/catalogo-jerarquico-api';
import type { ColumnaExport } from '../services/exportacion.service';

/** Opción de un <select>: siempre { id, nombre }. */
export interface OpcionCombo {
  id: number;
  nombre: string;
}

/**
 * Fila de un catálogo con padre (Departamentos, Puestos): id + nombre + los
 * campos que traiga el DTO (idEmpresa, nombreEmpresa, idDepartamento...).
 */
export interface ItemJerarquico {
  id: number;
  nombre: string;
  [campo: string]: unknown;
}

/** Cuerpo del POST/PUT: el nombre y los combos que se envían (seEnvia). */
export type PayloadJerarquico = { nombre: string } & Record<string, string | number>;

/** Un combo del formulario. Se encadenan con dependeDe (Empresa -> Departamento). */
export interface ComboConfig {
  /** Campo del item y del payload: 'idEmpresa', 'idDepartamento'. */
  clave: string;
  /** 'Empresa', 'Departamento'. */
  etiqueta: string;
  /**
   * Carga las opciones; recibe el valor del combo padre (null si no tiene).
   * Se llama en cada apertura del formulario y en cada cambio del padre:
   * sin caché, para no mostrar datos viejos.
   */
  opciones: (idPadre: number | null) => Observable<OpcionCombo[]>;
  /** Clave del combo padre, si depende de otro. */
  dependeDe?: string;
  /** false = solo filtra (la Empresa en Puestos): no se envía al backend. */
  seEnvia: boolean;
  /** Texto cuando el padre está elegido pero no hay opciones. */
  sinOpciones: string;
}

/** Lo que cambia entre una pantalla de catálogo con padre y otra. */
export interface CatalogoJerarquicoConfig {
  /** OPCION.Pagina: permisos y nombre de archivo de exportación. */
  slug: string;
  /** Título de la pantalla, del PDF y de la hoja de Excel. */
  titulo: string;
  /** En minúsculas y masculino: 'Nuevo departamento', 'Puesto creado'. */
  singular: string;
  /** Etiqueta del campo nombre. */
  etiqueta: string;
  /** Igual que el VARCHAR2 de la BD y el @Size del DTO. */
  longitudMaxima: number;
  placeholder?: string;
  /** Ícono del estado vacío (Material Icons). */
  icono: string;
  /** En orden: primero los padres. */
  combos: ComboConfig[];
  /** Columnas de la tabla, del PDF y del Excel. */
  columnas: ColumnaExport[];
  api: CatalogoJerarquicoApi;
}
