import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import PlaceResult = google.maps.places.PlaceResult;

@Component({
  selector: 'app-jobs-filter',
  templateUrl: './jobs-filter.component.html',
  styleUrls: ['./jobs-filter.component.scss']
})
export class JobsFilterComponent implements OnInit {
  filters: FormGroup;
  industryList: string[] = ['Accounting and Finance', 'Admin and Office', 'Advertising and Marketing', 'Animal Care', 'Art, Fashion and Design', 'Business Operations', 'Cleaning and Facilities', 'Computer and IT', 'Construction', 'Customer Service', 'Education', 'Energy and Mining', 'Entertainment and Travel', 'Farming and Outdoors', 'Healthcare', 'Human Resources', 'Installation, Maintenance and Repair', 'Legal', 'Management', 'Manufacturing and Warehouse', 'Media, Communications and Writing', 'Personal Care and Services', 'Property', 'Protective Services', 'Restaurant and Hospitality', 'Sales and Retail', 'Science and Engineering', 'Social Services and Non-Profit', 'Sports Fitness and Recreation', 'Transportation and Logistics']

  constructor(
    private fb: FormBuilder, 
    private dialogRef: MatDialogRef<JobsFilterComponent>, 
    @Inject(MAT_DIALOG_DATA) public dialog: any
  ) { }

  ngOnInit() {
    this.filters = this.fb.group({
      industries: this.dialog.industries ? [this.dialog.industries] : [''],
      hours: this.dialog.hours || 38,
      country: this.dialog.country || '',
      location: new FormControl({ value: this.dialog.location, disabled: this.dialog.remote == 'Only remote' }),
      geopoint: this.dialog.geopoint || false,
      distance: new FormControl({ value: this.dialog.distance || 50, disabled: this.dialog.remote == 'Only remote' }),
      remote: this.dialog.remote || 'Include remote' ,
    })
  }

  onAutocompleteSelected(result: PlaceResult) {
    console.log(result.geometry.location.toJSON())
    let element = document.createElement('div')
    element.innerHTML = result.adr_address
    let div = element.getElementsByClassName('country-name')
    let country = div[0].textContent || div[0].innerHTML;
    this.filters.value.country = country
    this.filters.value.location = result.formatted_address
    this.filters.value.geopoint = result.geometry.location.toJSON()
  }

  remoteSwitch(e) {
    e.value == 'Only remote' ? this.filters.get('location').disable() : this.filters.get('location').enable()
    e.value == 'Only remote' ? this.filters.get('distance').disable() : this.filters.get('distance').enable()
  }

  updateHours(e) {
    this.filters.get('hours').setValue(e.value)
  }

  updateDistance(e) {
    this.filters.get('distance').setValue(e.value)
  }

  close(save) {
    save ? this.dialogRef.close(this.filters.value) : this.dialogRef.close(false) 
  }

  clear() {
    this.filters = this.fb.group({
      industries: [''],
      hours: 38,
      country: null,
      location: null,
      geopoint: null,
      distance: 50,
      remote: ['Include remote'],
    })
  }
}