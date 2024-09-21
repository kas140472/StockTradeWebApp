import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { StockChart } from 'angular-highcharts';

import * as Highcharts from 'highcharts/highstock'

import IndicatorsCore from "highcharts/indicators/indicators"
import indicators from 'highcharts/indicators/indicators';
import volumeByPrice from 'highcharts/indicators/volume-by-price';

import { MatDialog } from '@angular/material/dialog';

import { PortfolioService } from '../../portfolio.service';
import { firstValueFrom } from 'rxjs';
import { NewsModalComponent } from '../news-modal/news-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'; // Assuming NgbModal is used for modal service
import * as Highcharts1 from 'highcharts';
import { BuySellModalComponent } from '../buy-sell-modal/buy-sell-modal.component';

import { interval, Subject, Subscription, timer } from 'rxjs';
import { switchMap, debounceTime, takeWhile } from 'rxjs/operators';

import { ActivatedRoute } from '@angular/router';
import { SearchStoringService } from '../search-storing.service';


IndicatorsCore(Highcharts);
indicators(Highcharts);
volumeByPrice(Highcharts);

@Component({
  selector: 'app-ticker-main',
  templateUrl: './ticker-main.component.html',
  styleUrl: './ticker-main.component.css',
  providers: [PortfolioService]
})

export class TickerMainComponent implements OnInit {

  activeTab: string = 'summary';

  HOST: string = 'http://localhost:8000/'; // for local test
  // HOST: string = 'https://gcp-backend.wl.r.appspot.com/';

  readonly APIUrl=this.HOST + "api/todoapp/"

  responseStored: any;

  buySellModalResult: any;
  boughtSuccess = false;
  soldSuccess = false;

  stock!: StockChart;
  // stock!: StockChart | null;
  stockHourly!: StockChart;
  // stockEarnings!: StockChart;
  // stockEarnings!: Highcharts1.Chart;
  stockEarnings!: any;
  stockRecs!: any;
  companyProfile: any;
  autoCompData: any;
  quoteData: any;
  peersData: any;
  recData: any;
  newsData: any;
  newsWithImageValid: any;
  insiderData: any;
  earningsData: any;
  selectedArticle: any;

  isCompanyDataLoading: boolean = true;
  isQuoteDataLoading: boolean = false;
  isHourlyChartLoading: boolean = true;
  isHistChartLoading: boolean = true;

  localCurrentTime!: number;

  hourlyFromDate: Date | null = null;
  hourlyToDate: Date | null = null;

  openstatus: boolean | null = null;
  lastTimestamp: Date | null = null;

  inWatchlist: boolean = false;
  inPortfolio: boolean = false;

  gotTickerSuccess = false;
  gotCompDataSuccess = false;

  invalidTicker = false;

  companyPeers!: string[]; 
  timestampThreshold = 300; 

  quantity: number = 0;
  totalPrice: number = 0;

  errorMessages: string[] = [];

  // activeTab: string = 'details';

  stockDetails: any; 
  currentPrice!: number; 
  moneyInWallet!: any; 

  notes:any=[];
  walletArray:any=[];
  anythingWallet!: any;

  msprTotal: number = 0;
  msprPositive: number = 0;
  msprNegative: number = 0;
  changeTotal: number = 0;
  changePositive: number = 0;
  changeNegative: number = 0;

  insightsDataAggr = false;

  purchasedQuantity: number = 0;

  symbol: string = ''; 

  quoteDataSubscription!: Subscription;

  currentTimeSubscription!: Subscription;

  isBuyModalOpen: boolean = false;

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    series: []
  };

  // portService: PortfolioService;
  constructor(private http: HttpClient, private router: Router, private dialog: MatDialog, private portService: PortfolioService, private modalService: NgbModal, private route: ActivatedRoute, private changeDetectorRef: ChangeDetectorRef, private storeService: SearchStoringService) {
    this.portService = portService;
    // this.moneyInWallet = this.portService.refreshWallet();
    console.log("app.component.ts constructor: data: ", this.moneyInWallet);
    this.getCurrentTime();
  }

  clearResults(){

    this.router.navigate(['search/home']);

    console.log('results cleared');

    this.companyProfile = null;
    this.quoteData = null;

    return false;
  }


  parseTimestampAndCalculateMarketStatus() {
    if (this.quoteData && this.quoteData.t) {
      this.lastTimestamp = new Date(this.quoteData.t*1000); // Parse the timestamp
      console.log("this.lastTimestamp", this.lastTimestamp);
      const currentTime = new Date(); // Get current time
      const timeDifference = currentTime.getTime() - this.lastTimestamp.getTime(); // Calculate time difference in milliseconds
  
      // Check if more than 5 minutes have elapsed
      if (timeDifference < 5 * 60 * 1000) {
        this.openstatus = true; // Market is open
        const TODAY = new Date();
        this.hourlyToDate = TODAY;
        this.hourlyFromDate = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 1);
      } else {
        this.openstatus = false; // Market is closed
        this.hourlyToDate = this.lastTimestamp;
        this.hourlyFromDate = new Date(this.hourlyToDate.getFullYear(), this.hourlyToDate.getMonth(), this.hourlyToDate.getDate() - 1);
      }
    } else {
      this.openstatus = null; // Cannot determine market status without timestamp
    }
  }

  fetchQuoteData() {
    this.portService.getTickerQuote(this.symbol)
      .subscribe(data => {
        this.quoteData = data; // Update quoteData with new values
      });
  }

  getCurrentTime() {
    this.localCurrentTime = Date.now();
  }

  updateCurrentTime() {
    this.localCurrentTime = Date.now();
  }

  getPurchasedQuantity() {
    this.portService.getTickerDetails(this.symbol).subscribe(tickerDetails => {
      console.log('Ticker details:', tickerDetails);
      console.log('this.getPurchasedQuantity() inside1', tickerDetails);
      this.purchasedQuantity = tickerDetails.quantityData;
      console.log('this.getPurchasedQuantity() inside2', this.purchasedQuantity);
    });
  }
  
  calculateTotalPrice(): void {
    console.log("app.component.ts calcTotalPrice: data: ", this.moneyInWallet);
    this.currentPrice = this.quoteData.c;
    this.totalPrice = this.quantity * this.currentPrice;
  }

  refreshNotes(){
    this.http.get(this.APIUrl+'getdata').subscribe(data=>{
      this.notes=data;
    })
  }
  

  showAlert: boolean = false;

  addToWatchlist(ticker: string): void {
    localStorage.setItem(ticker, 'true');
    var tickerData=ticker;
    var nameData = this.companyProfile.name;
    var cData = this.quoteData.c;
    var dData = this.quoteData.d;
    var dpData = this.quoteData.dp;

    console.log(tickerData)
    var formData = new FormData();
    formData.append("tickerData",tickerData);
    formData.append("nameData",nameData);
    formData.append("cData",cData);
    formData.append("dData",dData);
    formData.append("dpData",dpData);
    console.log("formdata: ",formData);
    this.http.post(this.APIUrl+'adddata',formData).subscribe(data=>{
      alert(data);
      this.refreshNotes();
    })
  }

  clearErrorMessagesAfterDelay(delay: number) {
    setTimeout(() => {
      this.errorMessages = [];
    }, delay);
  }

addRemoveWatchlist(ticker: string): void {
    
  const isAlreadyInWatchlist = this.inWatchlist;
  this.inWatchlist = !this.inWatchlist;

  if (isAlreadyInWatchlist) {
    // this.inWatchlist = false;

    // Remove from localStorage
    localStorage.removeItem(ticker);

    this.errorMessages = [];

    this.errorMessages.push(this.symbol+" removed from watchlist.");
    this.clearErrorMessagesAfterDelay(3000); 

    // Remove from backend watchlist
    this.portService.deleteWatchlistItem(ticker);
  } else {
    // this.inWatchlist = true;
    // Add to localStorage
    localStorage.setItem(ticker, 'true');

    this.errorMessages = [];

    this.errorMessages.push(this.symbol+" added to Watchlist.");
    this.clearErrorMessagesAfterDelay(3000); 

    // Add to backend watchlist
    const tickerData = ticker;
    const nameData = this.companyProfile.name;
  
    const formData = new FormData();
    formData.append("tickerData", tickerData);
    formData.append("nameData", nameData);

    this.http.post(this.APIUrl + 'adddata', formData).subscribe(data => {
      // alert(data);
      // this.refreshNotes();
    });
  }
}

  toggleWatchlist(ticker: string): void {
    const isInWatchlist = this.isInWatchlist(ticker);
    if (isInWatchlist) {
      // Remove from watchlist
      localStorage.removeItem(ticker);
    } else {
      // Add to watchlist
      localStorage.setItem(ticker, 'true');
    }
  }
  
  isInWatchlist(ticker: string): boolean {
    return localStorage.getItem(ticker) === 'true';
  }

  async checkIfInWatchlist(ticker: any) {
    try {
      const watchlistData = await this.portService.refreshWatchData();
      
      // Check if the ticker exists in the watchlist data
      this.inWatchlist = watchlistData.some((item: any) => item.ticker === ticker);
    } catch (error) {
      console.error("Error checking watchlist:", error);
    }
  }

  async addWatchlistToLS() {
    try {
      const watchlistData = await this.portService.refreshWatchData();
      const tickers = watchlistData.map((item: any) => item.ticker);
      console.log("in addWatchlistToLS");
      // Store tickers in localStorage
      tickers.forEach(ticker => {
        localStorage.setItem(ticker, 'true');
      });
    } catch (error) {
      console.error("Error checking watchlist:", error);
    }
  }


  openNewsDetail(news: any) {
    const newsModalRef = this.modalService.open(NewsModalComponent);
    console.log("news in ticker: ", news);
    newsModalRef.componentInstance.news = news;
  }


  async ngOnInit() {
    console.log("in mainTicker");
    this.isHistChartLoading = true;
    console.log("line 336 isHistChartLoading became trueeeeeeeeeee")

    console.log("this.isCompanyDataLoading 346 = ",this.isCompanyDataLoading);

    // const tabcontent = document.getElementsByClassName('tabcontent') as HTMLCollectionOf<HTMLElement>;
    // for (let i = 0; i < tabcontent.length; i++) {
    //   tabcontent[i].style.display = 'none';
    // }

    this.route.params.subscribe(params => {
      this.symbol = params['ticker'];

      // if (this.storeService.isPreviousRouteWatchlistOrPortfolio())
      // {
      //   this.symbol = localStorage.getItem('currentTicker');
      // }

      this.handleRouteParameterChange();
      if(this.symbol == 'emptyTicker'){
        this.invalidTicker = true;
      }
      else{
        this.invalidTicker = false;
      }
      
      this.gotTickerSuccess = false;
      console.log('Symbol entered:', this.symbol);
    });
    
    this.addWatchlistToLS();
    this.refreshNotes();
    console.log("this.isCompanyDataLoading 364 = ",this.isCompanyDataLoading);
    this.searchCompanyProfile();
    console.log("this.isCompanyDataLoading 366 = ",this.isCompanyDataLoading);

    this.checkIfInWatchlist(this.symbol);
    this.parseTimestampAndCalculateMarketStatus();
    this.searchHourlyChart();
    this.getMoneyInWallet();
    this.activeTab = 'summary';
    this.openTab('summary');
   
    this.anythingWallet = await this.portService.refreshWallet();
    this.moneyInWallet = this.anythingWallet[0].curWalletValue;
    console.log("app.component.ts: this.anythingWallet: ", this.anythingWallet);
    console.log("app.component.ts: this.moneyInWallet: ", this.moneyInWallet);

    const timer$ = interval(15000);

    // Subscribe to the observable and fetch new quoteData values
    this.quoteDataSubscription = timer$
      .pipe(
        switchMap(() => this.portService.getTickerQuote(this.symbol))
      )
      .subscribe(data => {
        this.quoteData = data; // Update quoteData with new values
      });

    this.currentTimeSubscription = timer$.subscribe(() => {
        this.updateCurrentTime();
      });
  }

  handleRouteParameterChange(): void {
    console.log("in handlerouteparameterChange");
    this.activeTab = 'summary';
    this.openTab('summary');
    this.searchCompanyProfile();
    this.openTab('summary');
    // this.searchCompanyProfilePoly();
    this.searchHourlyChart();
  }


  searchClickedTicker(ticker: string){
    //console.log('peer item was clicked. peer:', ticker);
    this.router.navigate(['/search/'+ ticker]);
  }

  ngOnDestroy() {
    if (this.quoteDataSubscription) {
      this.quoteDataSubscription.unsubscribe();
    }
    if (this.currentTimeSubscription) {
      this.currentTimeSubscription.unsubscribe();
    }
  }

  aggregateData(): void {
    this.insiderData.data.forEach((item: any) => {
      console.log("app.component.ts: this.insiderData.data item: ", item);
      this.msprTotal += item.mspr;
      if (item.mspr > 0) {
        this.msprPositive += item.mspr;
      } else if (item.mspr < 0) {
        this.msprNegative += item.mspr;
      }

      this.changeTotal += item.change;
      if (item.change > 0) {
        this.changePositive += item.change;
      } else if (item.change < 0) {
        this.changeNegative += item.change;
      }
    });
    this.insightsDataAggr = true;
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

  openBuyModal() {
    this.isBuyModalOpen = true;
  }

  openModal() {
    const modal = document.getElementById('exampleModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }
  
  closeModal() {
    const modal = document.getElementById('exampleModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  openTab(tabName: string) {
    console.log("opentab called for tab: ", tabName);
    this.activeTab = tabName;
    const tabcontent = document.getElementsByClassName('tabcontent') as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = 'none';
    }
    document.getElementById(tabName + 'Tab')!.style.display = 'block';
  }

  isMarketOpen(): boolean {
    
    if (this.quoteData && this.quoteData.t) {
      const currentTime = Math.floor(Date.now() / 1000); 
      const lastTimestamp = this.quoteData.t;
      const elapsedSeconds = currentTime - lastTimestamp;
      return elapsedSeconds < this.timestampThreshold;
    }
    return false; 
  }

  async getMoneyInWallet() {
    try {
      const walletValuePromise = await this.portService.getWalletValue();
      const walletValueObservable = await walletValuePromise;
      walletValueObservable.subscribe(walletValue => {
        this.moneyInWallet = walletValue;
        console.log('Wallet Value:', this.moneyInWallet);
      });
    } catch (error) {
      console.error('Error fetching wallet value:', error);
    }
  }


  openBuySellModal(ticker: any, name: any, currentPrice: any, moneyInWallet: any, bors: any) {
    const transModalRef = this.modalService.open(
      BuySellModalComponent
    );
    transModalRef.componentInstance.ticker = ticker;
    transModalRef.componentInstance.name = name;
    transModalRef.componentInstance.currentPrice = currentPrice;
    transModalRef.componentInstance.moneyInWallet = moneyInWallet;
    transModalRef.componentInstance.bors = bors;
    transModalRef.result.then((recItem) => {
      // trigger bors alert
      console.log("recItem modal reurnnnnnnnn: ",recItem);
      this.buySellModalResult = recItem;
      if(this.buySellModalResult.bors == 'Buy') {
        this.boughtSuccess = true;
      }
      else {
        this.soldSuccess = true;
      }

      
    });
  }

  onSymbolChanged(symbol: string) {
    // Receive the symbol value from the SearchComponent
    this.symbol = symbol;
  }

  searchCompanyProfile(): void {
    this.isCompanyDataLoading = true;
    console.log("this.isCompanyDataLoading 542 = ",this.isCompanyDataLoading);
    if (this.symbol) {
      if(this.storeService.isPreviousRouteWatchlistOrPortfolio()){
        console.log("YES from localStorage");
        this.responseStored = localStorage.getItem("lastCompanyProfile");

          const responseStored = this.responseStored;
          this.companyProfile = responseStored.companyProfile;
          
          console.log(" woahhhh companyProfile.ticker: ", this.companyProfile.ticker);
          console.log('aaaaaaaaaaaaaaaaa gotTickerSuccess 1:', this.gotTickerSuccess);
          console.log("this.isCompanyDataLoading 554 = ",this.isCompanyDataLoading);
          if (this.companyProfile && this.companyProfile.ticker !== undefined) {
            this.gotTickerSuccess = true;
          } else {
            this.gotTickerSuccess = false;
          }
          console.log('aaaaaaaaaaaaaaaaa gotTickerSuccess 2:', this.gotTickerSuccess);
          
       
          this.autoCompData = responseStored.autoCompData;
          this.quoteData = responseStored.quoteData;
          this.peersData = responseStored.peersData;
          
          this.recData = responseStored.recData;
          if(this.recData.length === 0){
            this.invalidTicker = true;
          }
          this.newsData = responseStored.newsData;
          this.insiderData = responseStored.insiderData;
          this.earningsData = responseStored.earningsData;
          
          console.log('Company Profile:', this.companyProfile);
          console.log('autoCompData:', this.autoCompData);
          console.log('quoteData:', this.quoteData);
          console.log('peersData:', this.peersData);
          console.log('recData:', this.recData);
          console.log('newsData:', this.newsData);

          this.newsWithImageValid = this.newsData
          .filter((newsData: any) => newsData.image)
          .slice(0, 20);

          console.log('insiderData: ', this.insiderData);
          console.log('earningsData: ', this.earningsData);

          this.insightsDataAggr = false;
          this.aggregateData();

          this.gotCompDataSuccess = true;
          this.isCompanyDataLoading = false;
          console.log("this.isCompanyDataLoading 588 = ",this.isCompanyDataLoading);
          this.portService.checkCompDataLoaded(this.isCompanyDataLoading);

          this.purchasedQuantity = 0;

          console.log('this.getPurchasedQuantity() before', this.purchasedQuantity);
          this.getPurchasedQuantity();
          console.log('this.getPurchasedQuantity() after', this.purchasedQuantity);

          this.parseTimestampAndCalculateMarketStatus();

          this.processEarningsChart(responseStored.earningsData);
          this.processRecsChart(responseStored.recData);

          this.searchCompanyProfilePoly();

          console.log("summary tab open called line 569 searchcompanyprofile")
          this.openTab('summary');

          console.log("this.isCompanyDataLoading 613 = ",this.isCompanyDataLoading);
          
          this.router.navigate(['/search', this.symbol]);
      }
      else{
        console.log("NOT from localStorage");
        this.http.get<any>(this.HOST + 'company-profile', { params: { symbol: this.symbol } }).subscribe(
          (response) => {
            console.log("NOT from localStorage");
            this.responseStored = response;
            const responseStored = this.responseStored;
            this.companyProfile = responseStored.companyProfile;
            localStorage.setItem("lastCompanyProfile", JSON.stringify(response));
            console.log(" woahhhh companyProfile.ticker: ", this.companyProfile.ticker);
            console.log('aaaaaaaaaaaaaaaaa gotTickerSuccess 1:', this.gotTickerSuccess);
            console.log("this.isCompanyDataLoading 554 = ",this.isCompanyDataLoading);
            if (this.companyProfile && this.companyProfile.ticker !== undefined) {
              this.gotTickerSuccess = true;
            } else {
              this.gotTickerSuccess = false;
            }
            console.log('aaaaaaaaaaaaaaaaa gotTickerSuccess 2:', this.gotTickerSuccess);
            
        
            this.autoCompData = responseStored.autoCompData;
            this.quoteData = responseStored.quoteData;
            this.peersData = responseStored.peersData;
            
            this.recData = responseStored.recData;
            if(this.recData.length === 0){
              this.invalidTicker = true;
            }
            this.newsData = responseStored.newsData;
            this.insiderData = responseStored.insiderData;
            this.earningsData = responseStored.earningsData;
            
            console.log('Company Profile:', this.companyProfile);
            console.log('autoCompData:', this.autoCompData);
            console.log('quoteData:', this.quoteData);
            console.log('peersData:', this.peersData);
            console.log('recData:', this.recData);
            console.log('newsData:', this.newsData);

            this.newsWithImageValid = this.newsData
            .filter((newsData: any) => newsData.image)
            .slice(0, 20);

            console.log('insiderData: ', this.insiderData);
            console.log('earningsData: ', this.earningsData);

            this.insightsDataAggr = false;
            this.aggregateData();

            this.gotCompDataSuccess = true;
            this.isCompanyDataLoading = false;
            console.log("this.isCompanyDataLoading 588 = ",this.isCompanyDataLoading);
            this.portService.checkCompDataLoaded(this.isCompanyDataLoading);

            this.purchasedQuantity = 0;

            console.log('this.getPurchasedQuantity() before', this.purchasedQuantity);
            this.getPurchasedQuantity();
            console.log('this.getPurchasedQuantity() after', this.purchasedQuantity);

            this.parseTimestampAndCalculateMarketStatus();

            this.processEarningsChart(responseStored.earningsData);
            this.processRecsChart(responseStored.recData);

            this.searchCompanyProfilePoly();

            console.log("summary tab open called line 569 searchcompanyprofile")
            this.openTab('summary');

            console.log("this.isCompanyDataLoading 613 = ",this.isCompanyDataLoading);
            
            this.router.navigate(['/search', this.symbol]);
          },
          (error) => {
            console.error('Error fetching company profile:', error);
          }
        );
      }
    } else {
      
    }
  }

  searchCompanyProfilePoly(): void {
    console.log("in company-polyyyy");
    this.isHistChartLoading = true;
    console.log("line 578 isHistChartLoading became trueeeeeeeeeee")
    // this.isHourlyChartLoading = true;
    if (this.symbol) {
      // const emptyStock: new StockChart({});
      
      // // Set stock to the empty object
      // this.stock = emptyStock;

      this.http.get<any>(this.HOST + 'company-profile-poly', { params: { symbol: this.symbol } }).subscribe(
        (response) => {
          this.isHistChartLoading = true;
          console.log("line 589 isHistChartLoading became trueeeeeeeeeee")
          console.log('highchart response data for ', this.symbol, "; data: ", response.highchartsData);

          if(typeof response.highchartsData != 'undefined'){
            this.isHistChartLoading = false;
            console.log("line 594 isHistChartLoading became falseeeeeeeeeeee")
            console.log('highchart response data for ', this.symbol, "; data2: ", response.highchartsData, '; isHistLoading: ', this.isHistChartLoading);
            this.processHighchartsData(response.highchartsData);

          }

          
          
          
          // this.searchHourlyChart();
        
          this.router.navigate(['/search', this.symbol]);
        },
        (error) => {
          console.error('Error fetching company profile:', error);
          
        }
      );
    } else {
      
    }
  }

  searchHourlyChart(): void {
    if (this.symbol && this.hourlyFromDate && this.hourlyToDate) {

      const fromDateStr = this.hourlyFromDate.toISOString().slice(0, 10); // Extracts YYYY-MM-DD
      const toDateStr = this.hourlyToDate.toISOString().slice(0, 10); // Extracts YYYY-MM-DD


      const params = {
        symbol: this.symbol,
        fromDate: fromDateStr,
        toDate: toDateStr
      };

      this.http.get<any>(this.HOST + 'hourly-chart', { params: params }).subscribe(
        (response) => {

          console.log('hourlychart response data:', response.hourlyChartData);

          if(typeof response.hourlyChartData != 'undefined'){
            this.isHourlyChartLoading = false;
          }

          console.log('hourlyChartData in ticker-main: ', response.hourlyChartData);

          this.processHourlychartsData(response.hourlyChartData);
        
        },
        (error) => {
          console.error('Error fetching company profile:', error);
          // Handle error here
        }
      );
    } else {
      // Handle empty symbol input
    }
  }

  processRecsChart(data: any): void {
    const strongBuyData: any[] = [];
    const buyData: any[] = [];
    const holdData: any[] = [];
    const sellData: any[] = [];
    const strongSellData: any[] = [];
    const periodRecData: any[] = [];
    console.log("item0Recs:", data[0]);
    data.forEach((item: any) => {
      strongBuyData.push(item.strongBuy);
      buyData.push(item.buy);
      holdData.push(item.hold);
      sellData.push(item.sell);
      strongSellData.push(item.strongSell);
      console.log("strongBuyData: ", strongBuyData);
      console.log("holdData: ", holdData);
      const parts = item.period.split("-");

      // Extract year, month, and day from the split parts
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10); // Adjust month since JavaScript months are zero-indexed
      const day = parseInt(parts[2], 10);

      // Constructing the date object with the extracted components
      const date = new Date(year, month, day);
      const formattedDate = `${year}-${month.toString().padStart(2, '0')}`;

      // const date = new Date(item.period);
      // const formattedPeriod = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      periodRecData.push(formattedDate);
      console.log("periodRecData: ", periodRecData);
    });

    // this.stockEarnings = new StockChart({
      // rangeSelector: {
      //   selected: 2
      // },
    const options: Highcharts.Options = {
      title: {
        text: 'Recommendation Trends'
      },
      rangeSelector: {
        enabled: false 
      },
      navigator: {
        enabled: false 
      },
      xAxis: {
          categories: periodRecData,
      },
      yAxis: [{
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: '#Analysis'
        },
        lineWidth: 2
      }],
      legend: { 
        enabled: true, 
        layout: 'horizontal', 
        align: 'center',
        verticalAlign: 'bottom',
        borderWidth: 0 
      },
      tooltip: {
        shared: true
      },
      plotOptions: {
        column: {
            stacking: 'normal',
            dataLabels: {
                enabled: true,
                inside: true
            }
        }
      },
      series: [{
        type: 'column',
        name: 'StrongBuy',
        data: strongBuyData,
      },
      {
        type: 'column',
        name: 'Buy',
        data: buyData,
      },
      {
        type: 'column',
        name: 'Hold',
        data: holdData,
      },
      {
        type: 'column',
        name: 'Sell',
        data: sellData,
      },
      {
        type: 'column',
        name: 'StrongSell',
        data: strongSellData,
      }
    ]
  };
  // this.stockEarnings = new StockChart(options);
  this.stockRecs = new Highcharts.Chart('recs-chart-container', options);
  };

  processEarningsChart(data: any): void {
    const actualData: any[] = [];
    const estimateData: any[] = [];
    const periodData: any[] = [];
    const surpriseData: any[] = [];
    console.log("item0Earnings:", data[0]);
    data.forEach((item: any) => {
      actualData.push(item.actual);
      estimateData.push(item.estimate);
      surpriseData.push(item.surprise);
      console.log("actualData: ", actualData);
      console.log("estimateData: ", estimateData);

      const parts = item.period.split("-");

      // Extract year, month, and day from the split parts
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10); // Adjust month since JavaScript months are zero-indexed
      const day = parseInt(parts[2], 10);

      // Constructing the date object with the extracted components
      const date = new Date(year, month, day);
      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      periodData.push(formattedDate);
      console.log("periodData: ", periodData);
    });

    // this.stockEarnings = new StockChart({
      // rangeSelector: {
      //   selected: 2
      // },
    const options: Highcharts.Options = {
      title: {
        text: 'Historical EPS Surprises'
      },
      rangeSelector: {
        enabled: false 
      },
      navigator: {
        enabled: false 
      },
      scrollbar: {
        enabled: false 
      },
      chart: {
        backgroundColor: '#F5F5F5',
        marginLeft: 70,
        marginRight: 70,
        
      },
      xAxis: {
          categories: periodData,
      },
      yAxis: [{
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'Quantity EPS'
        },
        lineWidth: 2
      }],
      tooltip: {
        shared: true
      },
      plotOptions: {
        spline: {
            marker: {
                radius: 4,
                lineColor: '#666666',
                lineWidth: 1
            }
        }
      },
      series: [{
        type: 'spline',
        name: 'Actual',
        marker: {
          symbol: 'square'
        },
        data: actualData,
      },
      {
        type: 'spline',
        name: 'Estimate',
        marker: {
          symbol: 'diamond'
        },
        data: estimateData,
      }
    ],
    legend: {
      enabled: true
    }
  };
  // this.stockEarnings = new StockChart(options);
  this.stockEarnings = new Highcharts.Chart('earnings-chart-container', options);
  };

  processHourlychartsData(data: any): void {

    const price: any[] = [];
    console.log("item0hourly:", data[0]);
    data.forEach((item: any) => {
      price.push([
        item.t, // the date
        item.c // the price
      ]);
    });

    this.stockHourly = new StockChart({
      rangeSelector: {
        selected: 2
      },
      title: {
        text: 'Hourly chart'
      },
      yAxis: [{
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'Price'
        },
        // top: '65%',
        // height: '35%',
        // offset: 0,
        lineWidth: 2
      }],
      tooltip: {
        split: true
      },
      plotOptions: {
        series: {
          pointPlacement: 'on',
          // dataGrouping: {
          //   units: [[
          //     'week',                         // unit name
          //     [1]                             // allowed multiples
          // ], [
          //     'month',
          //     [1, 2, 3, 4, 6]
          // ]]
          // }
        }
    },
      series: [{
        // tooltip: {
        //   valueDecimals: 2
        // },
        type: 'line',
        name: 'price1',
        data: price,
        // yAxis: 1
        // pointWidth: 5
      }
    ]})

  }


  processHighchartsData(data: any): void {

    this.isHistChartLoading = false;
    console.log("line 899 isHistChartLoading became falseeeeee")
    const ohlc : any[] = [];
    const volume: any[] = [];
    console.log("item0:", data[0]);
    data.forEach((item: any) => {
      ohlc.push([
        item.t, // the date
        item.o, // open
        item.h, // high
        item.l, // low
        item.c // close
      ]);

      volume.push([
        item.t, // the date
        item.v // the volume
      ]);
    });

    this.stock = new StockChart({
      rangeSelector: {
        selected: 2
      },
      title: {
        text: this.companyProfile.ticker+' Historical'
      },
      subtitle: {
        text: 'With SMA and Volume by Price technical indicators'
      },
      yAxis: [{
        startOnTick: false,
        endOnTick: false,
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'OHLC'
        },
        height: '60%',
        lineWidth: 2,
        resize: {
          enabled: true
        }
      }, {
        labels: {
          align: 'right',
          x: -3
        },
        title: {
          text: 'Volume'
        },
        top: '65%',
        height: '35%',
        offset: 0,
        lineWidth: 2
      }],
      tooltip: {
        split: true
      },
      plotOptions: {
        series: {
          pointPlacement: 'on',
          dataGrouping: {
            units: [[
              'week',                         // unit name
              [1]                             // allowed multiples
          ], [
              'month',
              [1, 2, 3, 4, 6]
          ]]
          }
        }
    },
      series: [{
        // tooltip: {
        //   valueDecimals: 2
        // },
        // type: 'line',
        // name: 'AAPL',
        // data: data
        type: 'candlestick',
        name: 'AAPL',
        id: 'aapl',
        zIndex: 2,
        data: ohlc
      },{
        type: 'column',
        name: 'Volume',
        id: 'volume',
        data: volume,
        yAxis: 1,
        pointWidth: 5
      },
      {
        type: 'vbp',
        linkedTo: 'aapl',
        params: {
          volumeSeriesID: 'volume'
        },
        dataLabels: {
          enabled: false
        },
        zoneLines: {
          enabled: false
        }
      },
      {
        type: 'sma',
        linkedTo: 'aapl',
        zIndex: 1,
        marker: {
            enabled: false
        }
      }
    ]})
  }
}

