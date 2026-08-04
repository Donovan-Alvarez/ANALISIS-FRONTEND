import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignacionPermisos } from './asignacion-permisos';

describe('AsignacionPermisos', () => {
  let component: AsignacionPermisos;
  let fixture: ComponentFixture<AsignacionPermisos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignacionPermisos],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignacionPermisos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
