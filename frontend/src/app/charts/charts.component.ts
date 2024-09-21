import { Component, Input } from '@angular/core';
import { StockChart } from 'angular-highcharts';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.css']
})
export class ChartsComponent {

  @Input() stock1!: StockChart;
  // @Input() stock: StockChart | undefined; // Define stock property as an input

}
