import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { interval, firstValueFrom } from 'rxjs';
import { Observable, of, from } from 'rxjs';
import { Subject, Subscription, timer } from 'rxjs';
import { switchMap, debounceTime, takeWhile } from 'rxjs/operators';
import { catchError, map, tap } from 'rxjs/operators';

import { lastValueFrom } from 'rxjs';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
// import * as Highcharts from 'highcharts';
import { StockChart } from 'angular-highcharts';

import * as Highcharts from 'highcharts/highstock'

import IndicatorsCore from "highcharts/indicators/indicators"
import indicators from 'highcharts/indicators/indicators';
import volumeByPrice from 'highcharts/indicators/volume-by-price';

import { MatDialog } from '@angular/material/dialog';

import { NewsModalComponent } from './app/news-modal/news-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'; // Assuming NgbModal is used for modal service
import * as Highcharts1 from 'highcharts';
import { BuySellModalComponent } from './app/buy-sell-modal/buy-sell-modal.component';


import { ActivatedRoute } from '@angular/router';


IndicatorsCore(Highcharts);
indicators(Highcharts);
volumeByPrice(Highcharts);

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  HOST: string = 'http://localhost:8000/'; // for local test
  // HOST: string = 'https://gcp-backend.wl.r.appspot.com/';


  wallet: any;
  walletValue!: number;
  companyProfile: any;

  quoteDataPort: any;
  autoCompData: any;

  companyDataHasLoaded = false;

  
  quoteData: any;
  peersData: any;
  recData: any;
  newsData: any;
  insiderData: any;
  earningsData: any;
  selectedArticle: any;

  localCurrentTime!: number;

  hourlyFromDate: Date | null = null;
  hourlyToDate: Date | null = null;

  openstatus: boolean | null = null;
  lastTimestamp: Date | null = null;

  inWatchlist: boolean = false;

  gotTickerSuccess = false;
  gotCompDataSuccess = false;

  invalidTicker = false;

  private _StarAlertSuccess = new Subject<string>();
  private _buyAlertSuccess = new Subject<string>();
  starSuccessMessage = '';
  buySuccessMessage = '';

  dataAddedPort: boolean = false;

  companyPeers!: string[]; // Company peers list
  timestampThreshold = 300; // Threshold for market closed (in seconds)

  quantity: number = 0;
  totalPrice: number = 0;

  // activeTab: string = 'details';

  stockDetails: any; // Input property for stock details
  currentPrice!: number; // Input property for current price
  moneyInWallet!: any; // Input property for money in wallet

  notes:any=[];
  walletArray:any=[];
  anythingWallet!: any;

  msprTotal: number = 0;
  msprPositive: number = 0;
  msprNegative: number = 0;
  changeTotal: number = 0;
  changePositive: number = 0;
  changeNegative: number = 0;

  purchasedQuantity: number = 0;

  symbol: string = ''; 

  quoteDataSubscription!: Subscription;

  currentTimeSubscription!: Subscription;

  isBuyModalOpen: boolean = false;

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    series: []
  };

  constructor(private http: HttpClient) { }

  // logic when buy button is clicked


  // readonly APIUrlWallet=this.HOST+"api/todoapp/getwalletdata"
  // readonly APIUrlPortfolio=this.HOST+"api/todoapp/getwalletdata"
  readonly APIUrl = this.HOST + "api/todoapp/"

  checkCompDataLoaded(isLoading: any){
      this.companyDataHasLoaded = !isLoading;
      return isLoading;
  }


  fetchSearchutil(ticker: string): Observable<any[]> {
    const result = this.http.get<any>(this.HOST + 'company-autocomp/'+ticker).toPromise();
    console.log("fetchSearchUtil: ", result);
    return from(result);
  }

  async updateWalletData(walletValue: number): Promise<string> {
    try {
      console.log("updateWallet Dat portService wallet Value:", walletValue);
      let obj = { "curWalletValue": walletValue };
      console.log("obj wallet: ", obj);
      const result = await this.http.post<any>(this.APIUrl+'updatewalletdata', obj).toPromise();
      return result;
    } catch (error) {
      console.error('Error updating wallet data:', error);
      throw error; // Rethrow the error to handle it in the component
    }
  }

  getTickerDetails(ticker: string): Observable<any> {
    return this.http.get<any>(this.APIUrl + 'gettickerportdata/' + ticker);
  }

  getTickerQuotecg(ticker: string): Observable<any> {
    this.http.get('/company-quote/' + ticker).subscribe(data=>{
      console.log("portfolio.service.ts: getTickerQuote: ", data);
      this.quoteDataPort = data;
    })
    return this.quoteDataPort;
  }

  getTickerQuote(ticker: string): Observable<any> {
    return this.http.get<any>(this.HOST + 'company-quote/' + ticker)
      .pipe(
        map(response => response.quoteData) // Extracting quoteData from response
      );
  }

  getTickerPeers(ticker: string): Observable<any> {
    console.log("port service received request for company peers")
    return this.http.get<any>(this.HOST + 'company-peers/' + ticker)
      .pipe(
        map(response => response.peersData) // Extracting quoteData from response
      );
  }

  getTickerAutocomp(ticker: string): Observable<any> {
    return this.http.get<any>(this.HOST + 'company-autocomp/' + ticker)
      .pipe(
        map(response => response.result) // Extracting quoteData from response
      );
  }


  async refreshWallet(){
    this.http.get(this.APIUrl+'getwalletdata').subscribe(data=>{
      console.log("portfolio.service.ts: data: ", data);
      this.wallet=data;
      console.log("portfolio.service.ts: this.wallet: ", this.wallet);
      this.walletValue=this.wallet[0].curWalletValue;
      console.log("portfolio.service.ts: this.wallet[0].curWalletValue: ", this.wallet[0].curWalletValue);
    })
    // return await this.walletValue;
    return await firstValueFrom(this.http.get(this.APIUrl+'getwalletdata'));
  }

  async getWalletValue() {
    return this.http.get<any[]>(this.APIUrl+'getwalletdata').pipe(
      map(data => {
        console.log("portfolio.service.ts: data: ", data);
        this.wallet = data;
        console.log("portfolio.service.ts: this.wallet: ", this.wallet);
        this.walletValue = this.wallet[0].curWalletValue;
        console.log("portfolio.service.ts: this.wallet[0].curWalletValue: ", this.wallet[0].curWalletValue);
        return this.walletValue;
      })
    );
  }


  getPortfolioData:any=[];
  getWatchlistData:any=[];

  async refreshPortData(): Promise<any[]> {
    try {
      const data = await lastValueFrom(this.http.get(this.APIUrl + 'getportdata'));
      console.log("portfolio.service.ts: refreshPortData:1: ", data)
      this.getPortfolioData = data;
      console.log("portfolio.service.ts: refreshPortData:2: ", this.getPortfolioData)
      return this.getPortfolioData;
    } catch (error) {
      console.error("Error fetching portfolio data:", error);
      throw error; // Rethrow the error to handle it in the caller
    }
  }


  async refreshWatchData(): Promise<any[]> {
    try {
      const data = await this.http.get(this.APIUrl + 'getwatchdata').toPromise();
      console.log("portfolio.service.ts: refreshwatchData:1: ", data)
      this.getWatchlistData = data;
      console.log("portfolio.service.ts: refreshWatchData:2: ", this.getWatchlistData)
      return this.getWatchlistData;
    } catch (error) {
      console.error("Error fetching watchlist data:", error);
      throw error; // Rethrow the error to handle it in the caller
    }
  }

  deleteWatchlistItem(ticker: string) {
    console.log("in portfolio service delete watchlist item: ", ticker);
    this.http.delete(this.APIUrl + 'deletewatchlist/' + ticker).subscribe(data=>{
      // alert(data);
      this.refreshWatchData();
    })
    // return this.http.delete(this.APIUrl + 'deletewatchlist/' + ticker);
  }

  deletePortfolioItem(ticker: string) {
    console.log("in portfolio service delete portfolio item: ", ticker);
    this.http.delete(this.APIUrl + 'deleteportfolio/' + ticker).subscribe(data=>{
      // alert(data);
      // this.refreshPortData();
      console.log('Portfolio item deleted successfully:', ticker);
    })
    // return this.http.delete(this.APIUrl + 'deletewatchlist/' + ticker);
  }

  // ngOnInit(): void {
  //   this.returnPortfolioData();
  // }

  async returnPortfolioData(): Promise<any[]> {
    await this.refreshPortData();
    console.log("portfolio.service.ts: returnPortfolioData: ", this.getPortfolioData)
    return this.getPortfolioData;
  }

  async getPortfolioItemQuantity(ticker: string): Promise<number> {
    // Fetch portfolio data if not already available
    // if (!this.getPortfolioData) {
    //   await this.refreshPortData();
    //   console.log("previous quantity port data: ", this.getPortfolioData);
    // }
    let tempData = await this.refreshPortData();
    console.log("previous quantity port data2: ", tempData);
    // Find the item with the given ticker in the portfolio data
    const portfolioItem = tempData.find((item: any) => item.ticker === ticker);
    console.log("port service previous quantity: ", portfolioItem.quantityData);
    // Return the quantity if the item is found, otherwise return 0
    return portfolioItem ? portfolioItem.quantityData : 0;
  }

  onBuyClickedToDB2(ticker: any, name: any, quantity: any, totalCost: any, buyOrSell: any){

    var formData = new FormData();
    console.log("onBuyClickedToDB2:ticker:", ticker);
    formData.append("tickerData",ticker);
    formData.append("nameData",name);
    formData.append("quantityData", quantity);
    formData.append("totalCostData",totalCost);
    formData.append("buyOrSellData",buyOrSell);
    console.log("formdata: ",formData);
    this.http.post(this.APIUrl+'addportdata',formData).subscribe(data=>{
      // alert(data);
      console.log("data is being added back!!!!!!!!!!!!!!!!!!!!!!!!!!");
      this.dataAddedPort = true;
      this.refreshWallet();
    })


  }
}
