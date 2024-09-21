import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TickerMainComponent } from './ticker-main.component';

describe('TickerMainComponent', () => {
  let component: TickerMainComponent;
  let fixture: ComponentFixture<TickerMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TickerMainComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TickerMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
