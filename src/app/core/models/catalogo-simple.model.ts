import type { CatalogoSimpleApi } from '../services/catalogo-simple-api';

/**
 * Registro de un catálogo de un solo campo "Nombre" (Estados Civiles,
 * Status Empleado, Tipos de Documentos, Bancos), normalizado a { id, nombre }
 * sin importar cómo se llame el id en el DTO del backend.
 */
export interface ItemCatalogo {
  id: number;
  nombre: string;
}

/** Lo que cambia entre una pantalla de catálogo simple y otra. */
export interface CatalogoSimpleConfig {
  /** OPCION.Pagina: permisos y nombre de archivo de exportación. */
  slug: string;
  /** Título de la pantalla, del PDF y de la hoja de Excel. Ej. 'Estados civiles'. */
  titulo: string;
  /** En minúsculas, para los textos: 'Nuevo estado civil', 'Estado civil creado'. */
  singular: string;
  /** Etiqueta del campo y encabezado de la columna. Ej. 'Nombre'. */
  etiqueta: string;
  /** Igual que el VARCHAR2 de la BD y el @Size del DTO. */
  longitudMaxima: number;
  placeholder?: string;
  /** Ícono del estado vacío (Material Icons). */
  icono: string;
  api: CatalogoSimpleApi;
}
