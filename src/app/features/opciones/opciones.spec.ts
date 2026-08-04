import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Opciones } from './opciones';

describe('Opciones', () => {
  let component: Opciones;
  let fixture: ComponentFixture<Opciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Opciones],
    }).compileComponents();

    fixture = TestBed.createComponent(Opciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
