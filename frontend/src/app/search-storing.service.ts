import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SearchStoringService {
  private searchResultsData: any;
  private previousRoute!: string;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.previousRoute = event.url;
      }
    });
  }

  setSearchResultsData(data: any): void {
    this.searchResultsData = data;
    this.searchResultsData = data;
  }

  getSearchResultsData(): any {
    return this.searchResultsData;
  }

  isPreviousRouteWatchlistOrPortfolio(): boolean {
    if(this.previousRoute){
      return this.previousRoute.includes('/watchlist') || this.previousRoute.includes('/portfolio');
    }
    else{
      return false;
    }
    
  }
}

