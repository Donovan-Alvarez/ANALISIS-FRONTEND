import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusUsuario } from './status-usuario';

describe('StatusUsuario', () => {
  let component: StatusUsuario;
  let fixture: ComponentFixture<StatusUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusUsuario],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusUsuario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
