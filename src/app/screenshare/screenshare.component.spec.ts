import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenshareComponent } from './screenshare.component';

describe('ScreenshareComponent', () => {
  let component: ScreenshareComponent;
  let fixture: ComponentFixture<ScreenshareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScreenshareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScreenshareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
