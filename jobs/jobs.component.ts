import { Component, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from '../shared/services/auth/auth.service';
import { JobsFilterComponent } from './jobs-filter/jobs-filter.component';
import { filter, conforms } from 'lodash-es';
import { Title } from '@angular/platform-browser';
import { debounceTime, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('500ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})

export class JobsComponent implements AfterViewInit, OnDestroy {

  constructor(
    private titleService: Title,
    public auth: AuthService,
    private db: AngularFirestore,
    public dialog: MatDialog
  ) { }
  
  cities = [ 
    { name: 'Amsterdam', country: 'NL', geopoint: { lat: 52.3675734, lng: 4.9041389 }},
    { name: 'Barcelona', country: 'ES', geopoint: { lat: 41.3850639, lng: 2.1734035 }},
    { name: 'Berlin', country: 'DE', geopoint: { lat: 52.52000659999999, lng: 13.404954 }},
    { name: 'London', country: 'UK', geopoint: { lat: 51.5073509, lng: -0.1277583 }},
    { name: 'Madrid', country: 'ES', geopoint: { lat: 40.4167754, lng: -3.7037902 }},
    { name: 'Paris', country: 'FR', geopoint: { lat: 48.856614, lng: 2.3522219 }},
    { name: 'Warsaw', country: 'PL', geopoint: { lat: 52.2296756, lng: 21.0122287 }} 
  ]

  displayedColumns: string[] = ['company', 'title', 'date']
  dataSource: MatTableDataSource<any>
  jobs: object; expandedElement: string
  search; visited = false
  country = 'UK'
  loaded = false

  jobs$sub: Subscription
  dialog$sub: Subscription
  
  @ViewChild(MatPaginator, {static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, {static: false }) sort: MatSort;

  ngAfterViewInit() {
    this.titleService.setTitle("Worklis: Job search")
    let jobs$ = this.db.collection('jobs', ref => ref.where('active', '==', true).where('countries', 'array-contains', this.country ))
    .snapshotChanges()
      .pipe(
        map(jobs => {
          return jobs.map((a) => {
            const data: Object = a.payload.doc.data();
            const id = a.payload.doc['id'];
            return { id, ...data };
          });
        }),
        debounceTime(1500)
      )
      this.jobs$sub = jobs$.subscribe(data => {
        this.jobs = data
        this.dataSource = new MatTableDataSource(data)
        this.dataSource.sortingDataAccessor = (item, property) => {
          switch(property) {
            case 'title': return item['title']
            case 'company': return item['company']
            case 'date': return item['timestamp'].toDate()
            default: return item[property]
          }
        }
        this.dataSource.filterPredicate = (data, filter) => {
          let searchStr = JSON.stringify(data)
          return searchStr.trim().toLowerCase().indexOf(filter) != -1;
        }
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loaded = true
      })
  }

  ngOnDestroy() {
    this.jobs$sub?.unsubscribe()
    this.dialog$sub?.unsubscribe()
  }

  trackByIndex = (index: number): number => {
    return index;
  }

  fly(city) {
    this.form['location'] = city.name
    this.form['geopoint'] = city.geopoint
    this.country = city.country
    this.filterDistance(city.geopoint, 100)
    this.applyFilters()
  }

  form = new Object;

  filterDialog(): void {
    const dialogRef = this.dialog.open(JobsFilterComponent, {
      width: '90%',
      maxWidth: '400px',
      data: this.form ? this.form : {}
    }); 
    
    this.dialog$sub = dialogRef.beforeClosed().subscribe(output => {
      if(output) {
        this.country = output.country
        this.filterIndustries(output.industries)
        this.filterTime(output.hours)
        this.filterRemote(output.remote)
        this.filterDistance(output.geopoint, output.distance)
        this.applyFilters()
        this.form = output ? output : this.form
      }
    })
  } 
 
  /// Active filter rules
  filters = {}

  datasearch(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private applyFilters() {
    this.dataSource.data = filter(this.jobs, conforms(this.filters) )
  }

  filterRecents(e, recents: object[]) {
    this.filters['id'] = e.checked ? val => recents ? recents.indexOf(val) > -1 : true : val => true
    this.applyFilters()
  }

  filterIndustries(industries: string[]) {
    this.filters['industries'] = val => industries.length > 0 ? val.filter(value => industries.includes(value)).length > 0 : true
  }
  
  filterTime(hours: number) {
    this.filters['hours'] = val => val < hours
  }

  filterRemote(remote: string) {
    this.filters['remote'] = val => {
      switch(remote) {
        case '' || 'Include remote': return true;
        case 'Only remote': return val == "Only remote"
      }
    }
  }

  filterDistance(geopoint: object, radius: number) {
    this.filters['locations'] = val => geopoint ? val.some(intersect) : true
    function intersect(location) {
      return getDistance(location.geopoint.latitude, location.geopoint.longitude, geopoint['lat'], geopoint['lng']) < radius
    }
    
    function getDistance(lat1, lon1, lat2, lon2) {
      let R = 6371
      let φ1 = lat1 * (Math.PI / 180)
      let φ2 = lat2 * (Math.PI / 180)
      let Δφ = (lat2-lat1) * (Math.PI / 180)
      let Δλ = (lon2-lon1) * (Math.PI / 180)
     
      let a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2)
      let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
      return R * c;
    }
  }
}