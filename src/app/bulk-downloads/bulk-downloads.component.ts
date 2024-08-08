import { Component, OnInit } from '@angular/core';
import {MatCard, MatCardActions, MatCardTitle} from "@angular/material/card";

@Component({
  selector: 'app-bulk-downloads',
  templateUrl: './bulk-downloads.component.html',
  styleUrls: ['./bulk-downloads.component.css'],
  imports: [
    MatCardActions,
    MatCardTitle,
    MatCard
  ],
  standalone: true
})
export class BulkDownloadsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
