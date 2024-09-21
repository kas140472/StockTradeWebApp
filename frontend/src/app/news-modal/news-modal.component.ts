import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-news-modal',
  templateUrl: './news-modal.component.html',
  styleUrl: './news-modal.component.css'
})
export class NewsModalComponent implements OnInit {

  @Input() public news: any;

  constructor(public newsModalService: NgbActiveModal) {}

  ngOnInit() {
    console.log("news received by modal: ", this.news);
  }

}
