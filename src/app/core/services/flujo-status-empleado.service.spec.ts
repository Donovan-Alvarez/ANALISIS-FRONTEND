import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FlujoStatusEmpleadoService } from './flujo-status-empleado.service';
import { ItemJerarquico } from '../models/catalogo-jerarquico.model';
import { environment } from '../../../environments/environment';

describe('FlujoStatusEmpleadoService · clave compuesta', () => {
  let service: FlujoStatusEmpleadoService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/api/flujo-status-empleado`;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FlujoStatusEmpleadoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('edita por la clave original aunque el formulario cambie ambos status', () => {
    let fila!: ItemJerarquico;
    service.findAll().subscribe(r => (fila = r[0]));
    http.expectOne(url).flush([{ idStatusActual: 42, idStatusNuevo: 73, nombreEvento: 'Suspender' }]);
    service.update(fila.id, { nombre: 'Reintegrar', idStatusActual: 73, idStatusNuevo: 42 }).subscribe();
    const req = http.expectOne(`${url}/42/73`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ idStatusActual: 73, idStatusNuevo: 42, nombreEvento: 'Reintegrar' });
    req.flush({ idStatusActual: 73, idStatusNuevo: 42, nombreEvento: 'Reintegrar' });
  });

  it('conserva la identidad de una fila cuando cambia el orden de la lista', () => {
    let id = 0;
    const a = { idStatusActual: 1, idStatusNuevo: 2, nombreEvento: 'A' };
    const b = { idStatusActual: 2, idStatusNuevo: 3, nombreEvento: 'B' };
    service.findAll().subscribe(r => (id = r[0].id));
    http.expectOne(url).flush([a, b]);
    service.findAll().subscribe(r => expect(r[1].id).toBe(id));
    http.expectOne(url).flush([b, a]);
    service.delete(id).subscribe();
    http.expectOne(`${url}/1/2`).flush(null);
  });
});
