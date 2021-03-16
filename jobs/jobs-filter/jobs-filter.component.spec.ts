import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsFilterComponent } from './jobs-filter.component';

describe('JobsFilterComponent', () => {
  let component: JobsFilterComponent;
  let fixture: ComponentFixture<JobsFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobsFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobsFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
