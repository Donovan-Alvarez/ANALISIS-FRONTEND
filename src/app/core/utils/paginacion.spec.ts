import { signal } from '@angular/core';
import { Paginacion } from './paginacion';

describe('Paginacion', () => {
  const numeros = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

  it('con 10 registros o menos no muestra el paginador', () => {
    const pag = new Paginacion(() => numeros(10));
    expect(pag.visible()).toBe(false);
    expect(pag.pagina()).toHaveLength(10);
  });

  it('con más de 10 muestra 10 por página y permite cambiar de página y tamaño', () => {
    const pag = new Paginacion(() => numeros(23));
    expect(pag.visible()).toBe(true);
    expect(pag.pagina()).toEqual(numeros(10));

    pag.cambiar({ pageIndex: 2, pageSize: 10, previousPageIndex: 1, length: 23 });
    expect(pag.pagina()).toEqual([21, 22, 23]);

    pag.cambiar({ pageIndex: 0, pageSize: 25, previousPageIndex: 2, length: 23 });
    expect(pag.pagina()).toHaveLength(23);
  });

  it('si un filtro deja menos páginas, se queda en la última que existe', () => {
    const lista = signal(numeros(40));
    const pag = new Paginacion(() => lista());
    pag.cambiar({ pageIndex: 3, pageSize: 10, previousPageIndex: 0, length: 40 });
    expect(pag.pagina()).toEqual([31, 32, 33, 34, 35, 36, 37, 38, 39, 40]);

    lista.set(numeros(12)); // p. ej. el usuario escribe en el buscador
    expect(pag.indice()).toBe(1);
    expect(pag.pagina()).toEqual([11, 12]);
  });
});
