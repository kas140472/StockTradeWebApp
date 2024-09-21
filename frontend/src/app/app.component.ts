import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import {map, startWith, switchMap, tap} from 'rxjs/operators';
import {AsyncPipe} from '@angular/common';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';

import { PortfolioService } from '../portfolio.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { filter, finalize } from 'rxjs/operators';

import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

}
