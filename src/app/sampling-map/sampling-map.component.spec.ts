import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SamplingMapComponent } from './sampling-map.component';

describe('SamplingMapComponent', () => {
  let component: SamplingMapComponent;
  let fixture: ComponentFixture<SamplingMapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SamplingMapComponent]
    });
    fixture = TestBed.createComponent(SamplingMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
