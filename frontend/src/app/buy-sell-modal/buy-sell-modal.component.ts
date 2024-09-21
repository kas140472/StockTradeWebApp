import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../portfolio.service';
import { error } from 'jquery';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-buy-sell-modal',
  templateUrl: './buy-sell-modal.component.html',
  styleUrls: ['./buy-sell-modal.component.css']
})
export class BuySellModalComponent implements OnInit {
  @Input() public ticker: any;
  @Input() public name: any;
  @Input() public currentPrice: any = 0;
  @Input() public moneyInWallet: any;
  @Input() public bors: any;
  
  inputQuantity: number = 0;
  purchasedQuantity: number = 0;
  purchasedTotalCost: any = 0;
  stockItem: any;
  stockTicker: any;
  previousQuantity = 0;

  moneyInWalletModal: number = 0;

  errorMessages: string[] = [];

  getWalletInModal(): number {
    let inMethodVar = this.moneyInWalletModal;
    if (this.bors === 'Buy') {
      // Subtract the total cost from the wallet for buying
      return inMethodVar - (this.inputQuantity * this.currentPrice);
    } else if (this.bors === 'Sell') {
      // Add the total gained from selling to the wallet
      return inMethodVar + (this.inputQuantity * this.currentPrice);
    } else {
      // Return the current wallet value if the operation is neither buy nor sell
      return inMethodVar;
    }
  }

  async getMoneyInWallet() {
    try {
      const walletValuePromise = await this.portService.getWalletValue();
      const walletValueObservable = await walletValuePromise;
      walletValueObservable.subscribe(walletValue => {
        this.moneyInWalletModal = walletValue;
        console.log('Wallet Value modal:', this.moneyInWalletModal);
      });
    } catch (error) {
      console.error('Error fetching wallet value:', error);
    }
  }

  async updateWalletData(walletValue: number) {
    try {
      const result = await this.portService.updateWalletData(walletValue);
      console.log('Wallet data updated successfully:', result);
    } catch (error) {
      console.error('Error updating wallet data:', error);
    }
  }

  public async finalbors() {
    if (this.bors === 'Sell') {

      this.purchasedTotalCost = this.currentPrice * this.inputQuantity;

      this.portService.getPortfolioItemQuantity(this.stockTicker).then(quantity => {
        this.previousQuantity = quantity;
      });

      if (this.inputQuantity > this.previousQuantity) {
        this.errorMessages.push("Not enough shares!");
      }

      let newQuantity = this.previousQuantity - this.inputQuantity;

      if(newQuantity == 0){
        console.log("quantity became zero: ",this.stockTicker);
        
        console.log("this.stockTicker, ",this.stockTicker);
        this.portService.deletePortfolioItem(this.stockTicker);
        
      }
      else{
        this.portService.onBuyClickedToDB2(this.stockTicker, this.name, this.inputQuantity, this.purchasedTotalCost, 'sell');
      }

      this.moneyInWalletModal = this.moneyInWalletModal + this.purchasedTotalCost;
      console.log("buysell modal updating this.moneyInWalletModal",this.moneyInWalletModal)
      this.updateWalletData(this.moneyInWalletModal);
      
    } else if (this.bors === 'Buy') {
  
      this.purchasedTotalCost = this.currentPrice * this.inputQuantity;
      this.portService.onBuyClickedToDB2(this.stockTicker, this.name, this.inputQuantity, this.purchasedTotalCost, 'buy');     
      this.moneyInWalletModal = this.moneyInWalletModal - this.purchasedTotalCost;
      console.log("buysell modal updating this.moneyInWalletModal",this.moneyInWalletModal)
      this.updateWalletData(this.moneyInWalletModal);
      
    }
    const currentUrl = this.router.url;
    console.log('Current URL:', currentUrl);
    if(currentUrl == '/portfolio'){
      await this.handleRouteParameterChangeMod();
    }

    const resultObject = {
      ticker: this.stockTicker,
      bors: this.bors
    };
    
    this.transModalService.close(resultObject);
  }

  handleRouteParameterChangeMod(): void {
    this.portService.refreshPortData();
    this.router.navigate(['/portfolio']);
  }

  async getPreviousQuantity(){
    await this.portService.getPortfolioItemQuantity(this.stockTicker).then(quantity => {
      this.previousQuantity = quantity;
      console.log("this.previousQuantity: ", this.previousQuantity)
    });
  }

  printErrors() {
    this.errorMessages = [];
    
    if (this.bors === 'Buy' && (this.inputQuantity * this.currentPrice) > this.moneyInWalletModal) {
      this.errorMessages.push("Not enough money in wallet to buy these shares.");
    }
  
    else if (this.bors === 'Sell' && this.inputQuantity > this.previousQuantity) {
      this.errorMessages.push("You don't own enough shares to sell this quantity.");
    }
  
    return this.errorMessages;
  }

  constructor(public transModalService: NgbActiveModal, private portService: PortfolioService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.stockTicker = this.ticker;
    this.getMoneyInWallet();
    this.getPreviousQuantity();

  }
}
