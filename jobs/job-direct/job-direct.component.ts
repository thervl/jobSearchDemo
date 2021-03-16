import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-job-direct',
  templateUrl: './job-direct.component.html',
  styleUrls: ['./job-direct.component.scss']
})
export class JobDirectComponent implements OnInit, OnDestroy {

  jobid: string;
  job$: Observable<any>
  job$sub: Subscription

  constructor(private route: ActivatedRoute, private db: AngularFirestore, private titleService: Title) { }

  ngOnInit(): void {
    this.jobid = this.route.snapshot.paramMap.get('jobid')
    this.job$ = this.db.collection('jobs').doc(this.jobid).valueChanges()
    this.job$sub = this.job$.subscribe(data => {
      this.titleService.setTitle(data.title)
    })
  }

  ngOnDestroy() {
    this.job$sub?.unsubscribe()
  }

}
