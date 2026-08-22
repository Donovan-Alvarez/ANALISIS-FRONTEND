import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionPermisos } from './asignacion-permisos';

describe('AsignacionPermisos', () => {
  let component: AsignacionPermisos;
  let fixture: ComponentFixture<AsignacionPermisos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionPermisos],
      // El componente resuelve permisos vía PermisosService -> MenuService,
      // que inyecta HttpClient; y usa MatSnackBar, que necesita animaciones.
      providers: [provideHttpClient(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignacionPermisos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
