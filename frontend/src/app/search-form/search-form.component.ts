import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import {map, startWith, switchMap, tap} from 'rxjs/operators';
import {AsyncPipe} from '@angular/common';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';

import { PortfolioService } from '../../portfolio.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { filter, finalize } from 'rxjs/operators';

import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.css']
})

export class SearchComponent {
  symbol: string = ''; 
  ticker: string= '';
  isLoading = true;;
  title = 'autocomplete';

  options = ["Sam", "Varun", "Jasmine"];

  filteredOptions: any;
  filteredOptionsFilteredArray: any;
  dataHasLoaded = false;


  formGroup! : FormGroup;

  getNames(){
    this.portService.fetchSearchutil(this.ticker).subscribe((response: any) => {
      this.options = response.autoCompData.result;
      console.log("autocomp options response: ",response.autoCompData.result);
      console.log("autocomp options: ",this.options);
      
      const displaySymbolsArray = response.autoCompData.result.map((item: any) => {
        return {
          displaySymbol: item.displaySymbol,
          description: item.description,
          type: item.type
        };
      });
      console.log("displaySymbolsArray", displaySymbolsArray);
      const filteredDisplaySymbolsArray = this.filteredOptionsFiltered(displaySymbolsArray);
      this.filteredOptions = filteredDisplaySymbolsArray;
     
      this.isLoading = false;
    })
  }

  filteredOptionsFiltered(displaySymbolsArray: any[]) {
    return displaySymbolsArray.filter((item: any) => {
      return item.type === 'Common Stock' && !item.displaySymbol.includes('.');
    });
  }

  ngOnInit(){
    this.initForm();
    this.getNames();
  }

  initForm(){
    this.formGroup = this.formBuilder.group({
      'employee' : ['']
    });
    if (this.formGroup) {
      this.formGroup.get('employee')?.valueChanges.subscribe(response => {
        console.log('data is ', response);
        this.ticker = response;
        this.getNames();
        console.log('symbol is ', response);
        this.filterData(response);
      });
    }
  }

  filterData(enteredData: any){
    this.filteredOptions = this.options.filter((item: any) => {
      console.log("here in filterData enteredData: ", enteredData);
      let ds = item.displaySymbol;
      console.log("here in filterData item: ", item);
      console.log("here in filterData ds: ", ds);
      return ds.toLowerCase().indexOf(enteredData.toLowerCase()) > -1
    })
  }

  constructor(private formBuilder: FormBuilder, private router: Router, private portService: PortfolioService) {
  }

  navigateToSearch(item: any) {
    console.log("this.formGroup.value", this.formGroup.value);
    console.log("navigateToSearch item", item);
    
    if(item == ''){
      this.router.navigate(['/search', "emptyTicker"]);
    }
    
    if (item !== this.symbol) {
      // Navigate to the search route with the entered symbol
      console.log("yayyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy")

      localStorage.setItem('currentTicker', item);
      console.log("set local storage ticker to: ", item);

      this.router.navigate(['/search', item]);
      this.dataHasLoaded = this.portService.companyDataHasLoaded;
    }
  }

  navigateToHome() {
    // Navigate to the home page
    this.symbol = '';
    this.router.navigate(['/search/home']);
    
    console.log('results cleared');

    this.symbol = "";

    return false;
  }
}
