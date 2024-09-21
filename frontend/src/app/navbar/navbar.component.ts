import { Component } from '@angular/core';
import { SearchStoringService } from '../search-storing.service';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {

  route: string = "/search/home"; // Rename var to route

  constructor(private storeService: SearchStoringService) {
  }

  updateRoute(): string {
    // console.log("in updateRoute()");
    if (this.storeService.isPreviousRouteWatchlistOrPortfolio()) {
      const prevTicker = localStorage.getItem('currentTicker');
      // console.log("in updateRoute() prev ticker = ", prevTicker);
      if (prevTicker) {
        // console.log("in updateRoute() returning = ", "/search/" + prevTicker);
        return "/search/" + prevTicker;
      } else {
        // console.log("in updateRoute() 1 - returning /search/home ");
        return "/search/home"; // Handle the case when prevTicker is undefined
      }
    } else {
      // console.log("in updateRoute() 2 - returning /search/home ");
      return "/search/home";
    }
}

}