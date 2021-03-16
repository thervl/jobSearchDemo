import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobDirectComponent } from './job-direct.component';

describe('JobDirectComponent', () => {
  let component: JobDirectComponent;
  let fixture: ComponentFixture<JobDirectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobDirectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobDirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
