import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AuthService } from '../../shared/services/auth/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { startWith, map, switchMap, debounceTime } from 'rxjs/operators';
import { Observable } from 'rxjs';
import PlaceResult = google.maps.places.PlaceResult;
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-job-edit',
  templateUrl: './job-edit.component.html',
  styleUrls: ['./job-edit.component.scss'],
  encapsulation : ViewEncapsulation.None,
})

export class JobEditComponent implements OnInit {

  job$;
  jobid
  jobpost: FormGroup
  resposi
  question: FormControl

  inputArrays = ['responsibilities', 'essentials', 'bonuses']
  industryList = ['Accounting and Finance', 'Admin and Office', 'Advertising and Marketing', 'Animal Care', 'Art, Fashion and Design', 'Business Operations', 'Cleaning and Facilities', 'Computer and IT', 'Construction', 'Customer Service', 'Education', 'Energy and Mining', 'Entertainment and Travel', 'Farming and Outdoors', 'Healthcare', 'Human Resources', 'Installation, Maintenance and Repair', 'Legal', 'Management', 'Manufacturing and Warehouse', 'Media, Communications and Writing', 'Personal Care and Services', 'Property', 'Protective Services', 'Restaurant and Hospitality', 'Sales and Retail', 'Science and Engineering', 'Social Services and Non-Profit', 'Sports Fitness and Recreation', 'Transportation and Logistics']
  // currencies = ["AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN", "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BOV", "BRL", "BSD", "BTN", "BWP", "BYR", "BZD", "CAD", "CDF", "CHE", "CHF", "CHW", "CLF", "CLP", "CNY", "COP", "COU", "CRC", "CUC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EGP", "ERN", "ETB", "EUR", "FJD", "FKP", "GBP", "GEL", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK", "JMD", "JOD", "JPY", "KES", "KGS", "KHR", "KMF", "KPW", "KRW", "KWD", "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LTL", "LVL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRO", "MUR", "MVR", "MWK", "MXN", "MXV", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLL", "SOS", "SRD", "SSP", "STD", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "USN", "USS", "UYI", "UYU", "UZS", "VEF", "VND", "VUV", "WST", "XAF", "XAG", "XAU", "XBA", "XBB", "XBC", "XBD", "XCD", "XDR", "XFU", "XOF", "XPD", "XPF", "XPT", "XTS", "XXX", "YER", "ZAR", "ZMW"];
  time = ['Per hour', 'Per month', 'Per annum']
  currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PLN', 'CHF', 'CZK', 'NZD'].sort()

  template;
  templates$: Observable<any>
  questions$: Observable<any>
  filteredResult: Observable<string[]>;

  loading = false
  
  constructor (
    public auth: AuthService, 
    private db: AngularFirestore, 
    private fb: FormBuilder, 
    private route: ActivatedRoute,
    private _snackBar: MatSnackBar
    ) { }

  ngOnInit() {
    this.job$ = this.route.paramMap.pipe(
      switchMap(params => {
        this.jobid = params.get('jobid')
        return this.db.collection('jobs').doc(this.jobid).valueChanges()
      })
    )

    this.job$.subscribe(data => {
      this.jobpost = this.fb.group({
        recruiteruid: [data.recruiteruid],
        timestamp: this.auth.timestamp(),
        title: [data.title ?? '', Validators.required],
        company: [data.company ?? '', Validators.required],
        holidays: [data.holidays ?? 25, Validators.required],
        currency: [data.currency ?? 'GBP', Validators.required],
        salary: [data.salary ?? 0, Validators.required],
        time: [data.time ?? ''],
        mission: [data.mission] ?? '',
        remote: [data.remote] ?? '',
        hours: [data.hours] ?? 38,
        overtime: [data.overtime] ?? [],
        industries: [data.industries] ?? [],
        countries: this.fb.array(data.countries ?? []),
        locations: this.fb.array(data.locations ?? []),
        tags: this.fb.array(data.tags ?? []),
        responsibilities: this.fb.array(data.responsibilities ?? []),
        essentials: this.fb.array(data.essentials ?? []),
        bonuses: this.fb.array(data.bonuses ?? []),
        perks: this.fb.array(data.perks ?? []),
        questions: this.fb.array(data.questions ?? []),
      })  

      this.jobpost.valueChanges.pipe(debounceTime(4000)).subscribe(form => {
        let batch = this.db.firestore.batch()
        batch.set(this.db.collection('jobs').doc(this.jobid).ref, form, { merge: true })
        batch.set(this.db.collection('users').doc(data.recruiteruid).ref, { timestamp: this.auth.timestamp() }, { merge: true })
        batch.commit().then(res => { this.snackBar('Changes saved') }).catch(err => { this.snackBar(err) })
      })
    })
    
    this.questions$ = this.db.collection('questions', ref => ref.where('active', '==', true)).valueChanges()

    this.templates$ = this.db.collection('templates').snapshotChanges().pipe(
      map(jobs => {
        return jobs.map((a) => {
          const data: Object = a.payload.doc.data();
          const id = a.payload.doc['id'];
          return { id, ...data };
        });
      })
    )
  }

  updateHours(e){
    this.jobpost.get('hours').setValue(e.value)
  }

  onAutocompleteSelected(result: PlaceResult, dom) {
    let element = document.createElement('div')
    element.innerHTML = result.adr_address
    let div = element.getElementsByClassName('country-name')
    let country = div[0].textContent || div[0].innerHTML;
    (this.jobpost.get('countries') as FormArray).push(new FormControl(country))

    const location = this.fb.group({
      address: result.formatted_address,
      geopoint: {
        longitude: result.geometry.location.lng(),
        latitude: result.geometry.location.lat()
      }
    }); (this.jobpost.get('locations') as FormArray).push(location)
    dom.value = ''
  }

  private _filter(array, value: string): string[] {
    const filterValue = value.toLowerCase();
    return array.filter(option => option.toLowerCase().includes(filterValue));
  }

  filterAutoComplete(array, input = '') {
    array = array.map(q => { return q.question })
    this.filteredResult = this.jobpost.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(array, input ? input : '')));
  }

  newQuestion(questions, question, uid) {
    const collection = questions.map(q => { return q.question })
    const index = collection.indexOf(question.value)
    if(index < 0) {
      let batch = this.db.firestore.batch()
      let id = this.db.createId()
      batch.set(this.db.collection('questions').doc(id).ref, { active: false, question: question.value })
      batch.set(this.db.collection('users').doc(uid).ref, { timestamp: this.auth.timestamp() }, { merge: true })
      batch.commit()
    }
    this.add('questions', question)
  }

  paste(formsarray, input) {
    navigator.clipboard.readText().then(data => {
      let array = data.split('\n')
      array.forEach(element => {
        (this.jobpost.get(formsarray) as FormArray).push(new FormControl(element))        
      })
      input.value = ''
    })
  }
    
  add(formsarray, input) {
    if(input.value) {
      (this.jobpost.get(formsarray) as FormArray).push(new FormControl(input.value))
      input.value = ''
    }
  }
  
  remove(formsarray, remove) {
    (this.jobpost.get(formsarray) as FormArray).removeAt(remove)
  }

  drop(formsarray, event: CdkDragDrop<string[]>) {
    moveItemInArray(this.jobpost.get(formsarray).value, event.previousIndex, event.currentIndex);
    (this.jobpost.get(formsarray) as FormArray).setValue(this.jobpost.get(formsarray).value)
  }

  trackByFn(index, item) {
    return index
  }

  async select(selected) {
    const { responsibilities, essentials, bonuses, tags } = (await this.db.collection('templates').doc(selected.value).get().toPromise()).data() as any
    responsibilities.map(a => { (this.jobpost.get('responsibilities') as FormArray).push(new FormControl(a)) })
    essentials.map(a => { (this.jobpost.get('essentials') as FormArray).push(new FormControl(a)) })
    bonuses.map(a => { (this.jobpost.get('bonuses') as FormArray).push(new FormControl(a)) })
    tags.map(a => { (this.jobpost.get('tags') as FormArray).push(new FormControl(a)) })
  }

  async templater(input) {
    const { responsibilities, essentials, bonuses, tags } = this.jobpost.value
    this.db.collection('templates').doc(input).set({
      responsibilities: responsibilities,
      essentials: essentials,
      bonuses: bonuses,
      tags: tags
    })
    input.value = ''
  }

  snackBar(message) {
    this._snackBar.open(message, 'Close', {
      duration: 2000,
      verticalPosition: 'top',
    })
  }

  clear() {
    this.jobpost.reset()
  }
}