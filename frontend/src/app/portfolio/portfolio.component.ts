import { Component } from '@angular/core';
import { PortfolioService } from '../../portfolio.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BuySellModalComponent } from '../buy-sell-modal/buy-sell-modal.component';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval, timer } from 'rxjs';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
  providers: [PortfolioService]
})
export class PortfolioComponent {

  isEmpty: boolean = false;
  portLoaded = false;
  addFinish = true;
  
  private intervalSubscription!: Subscription;
  data!: any;
  latestPricesMap: any;
  latestCurrentPrice: any;
  moneyInWallet: any;

  constructor(private portService: PortfolioService, private transModalService: NgbModal, private http: HttpClient) {
    this.fetchPortfolioData();
    this.getMoneyInWallet();
  }


  async getMoneyInWallet() {
    try {
      const walletValuePromise = await this.portService.getWalletValue();
      const walletValueObservable = await walletValuePromise;
      walletValueObservable.subscribe(walletValue => {
        this.moneyInWallet = walletValue;
        console.log('Wallet Value modal:', this.moneyInWallet);
      });
    } catch (error) {
      console.error('Error fetching wallet value:', error);
    }
  }

  async getLatestCurrentPrice(symbol: any): Promise<number> {
    try {
      const data = await this.portService.getTickerQuote(symbol).toPromise();
      console.log('Data for ticker quote cgp:', data);
      return data.c; 
    } catch (error) {
      console.error('Error fetching ticker quote:', error);
      return 0; 
    }
  }

  async getLatestCurrentPrices(portfolioData: any[]): Promise<Map<string, number>> {
    const latestPricesMap = new Map<string, number>();
    for (const item of portfolioData) {
      const ticker = item.ticker;
      const latestPrice = await this.getLatestCurrentPrice(ticker);
      latestPricesMap.set(ticker, latestPrice);
      console.log(latestPricesMap);
    }
    return latestPricesMap;
  }

  async fetchPortfolioData(): Promise<void> {
    try {
      this.data = await this.portService.refreshPortData();
      if (this.data && this.data.length > 0) {
        console.log("data thereeeeeeeeeeeeeeeeeeeee")
        this.isEmpty = false;
      }
      if (!this.data || this.data.length <= 0){
        console.log("data not thereeeeeeeeeeeeeeeeeeeee")
        this.isEmpty = true;
      }
      this.latestPricesMap = await this.getLatestCurrentPrices(this.data);
      this.portLoaded = true;
      console.log("portfolio.component.ts: data: ", this.data);
    } catch (error) {
      console.error("Error fetching portfolio data:", error);
    }
  }

  startFetchingPortfolioData(): void {
    this.intervalSubscription = interval(1000).subscribe(() => {
      this.fetchPortfolioData();
    });
  }

  stopFetchingPortfolioData(): void {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
  }

  ngOnDestroy(): void {
    this.stopFetchingPortfolioData(); 
  }


  async openBuySell(ticker: any, name: any, moneyInWallet: any,  bors: any) {
    this.addFinish = false;
    let currentPrice = await this.getLatestCurrentPrice(ticker);
    const transModalRef = this.transModalService.open(
      BuySellModalComponent
    );
    transModalRef.componentInstance.ticker = ticker;
    transModalRef.componentInstance.name = name;
    transModalRef.componentInstance.currentPrice = currentPrice;
    transModalRef.componentInstance.moneyInWallet = 250000;
    transModalRef.componentInstance.bors = bors;
    transModalRef.result.then((res) => {
      this.startFetchingPortfolioData();
      timer(5000).subscribe(() => {
        this.stopFetchingPortfolioData();
      });
    });
    this.fetchPortfolioData();
  }

}
