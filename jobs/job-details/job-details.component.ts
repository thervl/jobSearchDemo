import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../shared/services/auth/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { AngularFireAnalytics } from '@angular/fire/analytics';

@Component({
  selector: 'app-job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.scss'],
})

export class JobDetailsComponent implements OnInit, OnDestroy {

  @Input() job
  applied;
  user$sub: Subscription

  constructor(
    private titleService: Title,
    public auth: AuthService,
    private db: AngularFirestore,
    private _snackBar: MatSnackBar,
    private analytics: AngularFireAnalytics
  ) { }

  ngOnInit() {
    this.titleService.setTitle('Worklis: ' + this.job.title)
    this.analytics.logEvent(this.job.title)
    
    this.user$sub = this.auth.user$.subscribe(user => {
      if(user) {
        let recents = user.recents || []
        if(recents.indexOf(this.job.id) == -1) {
          recents.unshift(this.job.id)
          recents.length > 30 ? recents.length = 30 : null
          this.db.collection('users').doc(user.uid).set({ recents : recents, timestamp: this.auth.timestamp() } , { merge: true })
        }
      }
    })
  }

  ngOnDestroy() {
    this.user$sub?.unsubscribe()
  }

  link(jobid) {
    this._snackBar.open('Direct link copied to clipboard.', 'Close', {
      duration: 900,
      verticalPosition: 'top',
    });
    navigator.clipboard.writeText(window.location.href + 'job-direct/' + jobid)
  }

  async createApplication(user) {
    const appRef = this.db.collection('applications').doc(this.job.id + user.uid)
    const app = await appRef.ref.get()
    if(!app.exists) {
      let batch = this.db.firestore.batch()
      let app = {
        active: false,
        applicant: user.applicant ?? { experience: [] },
        job: {
          jobid: this.job.id,
          title: this.job.title,
          company: this.job.company,
          responsibilities: this.job.responsibilities,
          essentials: this.job.essentials,
          bonuses: this.job.bonuses,
          questions: this.job.questions,
        },
        timestamp: this.auth.timestamp(),
        applicantuid: user.uid,
        recruiteruid: this.job.recruiteruid,
      }
      batch.set(this.db.firestore.collection('applications').doc(this.job.id + user.uid), app, { merge: true })      

      let feed = {
        applicantuid: user.uid,
        recruiteruid: this.job.recruiteruid,
        job: this.job.title,
        applied: this.auth.timestamp(),
        timestamp: this.auth.timestamp(),
        feedback: {
          decision: 'Pending',
        }
      }

      batch.set(this.db.firestore.collection('feedback').doc(this.job.id + user.uid), feed, { merge: true })
      batch.set(this.db.firestore.collection('users').doc(user.uid), { timestamp: this.auth.timestamp() }, { merge: true })

      batch.commit().then(res => {
        this._snackBar.open('Application created!', 'Close', {
          duration: 2000,
          verticalPosition: 'top'
        })
      }).catch(err => {
        this._snackBar.open(err, 'Close', {
          duration: 900,
          verticalPosition: 'top'
        })  
      })

    } else {
      this.applied = app.data()['applied'] as Date
    }
  }
}