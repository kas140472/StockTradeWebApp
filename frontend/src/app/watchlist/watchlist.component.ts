import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PortfolioService } from '../../portfolio.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit {

  watchlist: any[] = [];
  showAlert: boolean = false;
  quoteData: any;

  HOST: string = 'http://localhost:8000/';

  readonly APIUrl=this.HOST + "api/todoapp/"

  constructor(private http: HttpClient, private router: Router, private portService: PortfolioService) {
    this.fetchWatchlistData();
  }

  notes:any=[];
  data!: any;
  latestPricesMap: any;
  latestPricesMapC: any;
  latestPricesMapD: any;
  latestPricesMapDP: any;
  latestCurrentPrice: any;
  watchLoaded = false;
  emptyWatchlist = false;

  refreshNotes(){
    this.http.get<any[]>(this.APIUrl+'getdata').subscribe(data=>{
      this.notes=data;
      // this.updateLocalStorage(data);
    })
  }

  isWatchlistEmpty(): void {
    if(this.data.length === 0){
      this.emptyWatchlist = true;
    } 
    else{
      this.emptyWatchlist = false;
    }
  }

  async fetchWatchlistData(): Promise<void> {
    try {
      this.data = await this.portService.refreshWatchData();
      // this.latestPricesMap = await this.getLatestCurrentPrices(this.data);

      const { latestPricesMap, latestPricesMapC, latestPricesMapD, latestPricesMapDP } = await this.getLatestCurrentPrices(this.data);
      this.latestPricesMap = latestPricesMap;
      this.latestPricesMapC = latestPricesMapC;
      this.latestPricesMapD = latestPricesMapD;
      this.latestPricesMapDP = latestPricesMapDP;

      console.log("watchlist.component.ts: data: ", this.data);
      this.watchLoaded = true;
      this.isWatchlistEmpty();
    } catch (error) {
      console.error("Error fetching watchlist data:", error);
      // Handle the error as needed
    }
  }

  public linkToDetails(ticker: any) {
    this.router.navigateByUrl('/search/' + ticker);
  }

  async getLatestCurrentQuoteData(symbol: any): Promise<{ c: number, d: number, dp: number }> {
    try {
      const data = await this.portService.getTickerQuote(symbol).toPromise();
      console.log('Data for ticker quote cgp:', data);
      return { c: data.c, d: data.d, dp: data.dp };
    } catch (error) {
      console.error('Error fetching ticker quote:', error);
      return { c: 0, d: 0, dp: 0 }; // Return default values in case of error
    }
  }

  async getLatestCurrentPrices(watchlistData: any[]): Promise<{ latestPricesMap: Map<string, { c: number, d: number, dp: number }>, latestPricesMapC: Map<string, number>, latestPricesMapD: Map<string, number>, latestPricesMapDP: Map<string, number> }> {
    const latestPricesMap = new Map<string, { c: number, d: number, dp: number }>();
    const latestPricesMapC = new Map<string, number>();
    const latestPricesMapD = new Map<string, number>();
    const latestPricesMapDP = new Map<string, number>();

    for (const item of watchlistData) {
      const ticker = item.ticker;
      const latestQuoteData = await this.getLatestCurrentQuoteData(ticker);
      console.log("latestQuoteData.value from watchlist:", latestQuoteData.c);
      const latestQuoteDataC = latestQuoteData.c;
      const latestQuoteDataD = latestQuoteData.d;
      const latestQuoteDataDP = latestQuoteData.dp;

      latestPricesMap.set(ticker, latestQuoteData);
      latestPricesMapC.set(ticker, latestQuoteDataC);
      latestPricesMapD.set(ticker, latestQuoteDataD);
      latestPricesMapDP.set(ticker, latestQuoteDataDP);

      // console.log((latestPricesMap.get(ticker)).c);
      console.log("latestPricesMap from watchlist", latestPricesMap);
    }
    return { latestPricesMap, latestPricesMapC, latestPricesMapD, latestPricesMapDP };
  }

  updateLocalStorage(data: any[]=[]): void {
    // Clear existing localStorage data
    localStorage.clear();
    console.log("watchlist.component.ts data:", data);
    // Set watchlist data in localStorage
    data.forEach(ticker => {
      localStorage.setItem(ticker.ticker, 'true');
    });
  }

  ngOnInit(): void {
    this.refreshNotes();
  }

  deleteNotes(id:any){
    
    this.http.delete(this.APIUrl+'deletenotes?id='+id).subscribe(data=>{
      alert(data);
      this.refreshNotes();
    })
  }

  deleteData(id:any){
    
    this.http.delete(this.APIUrl+'deletedata?id='+id).subscribe(data=>{
      alert(data);
      this.refreshNotes();
    })
  }

  removeFromWatchlist(ticker: any){
    console.log("inRemoveFromWatchlist!!!!!!!!!!!!!!")
    this.portService.deleteWatchlistItem(ticker);
    this.fetchWatchlistData();
    // this.router.navigateByUrl('/watchlist');
  }
}
 