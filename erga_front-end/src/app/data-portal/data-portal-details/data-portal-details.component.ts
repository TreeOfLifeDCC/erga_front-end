import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-data-portal-details',
  templateUrl: './data-portal-details.component.html',
  styleUrls: ['./data-portal-details.component.css']
})
export class DataPortalDetailsComponent implements OnInit {

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    const routeParams = this.route.snapshot.paramMap;
    const organismId = routeParams.get('organismId');
    console.log(organismId);
  }

}
