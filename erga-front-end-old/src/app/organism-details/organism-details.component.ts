import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ApiService} from "../api.service";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";

@Component({
  selector: 'app-organism-details',
  templateUrl: './organism-details.component.html',
  styleUrls: ['./organism-details.component.css']
})
export class OrganismDetailsComponent implements OnInit, AfterViewInit {
  data: any;
  specimensData: any;
  specimensDataLength: number;
  specimensDisplayedColumns: string[] = ['accession', 'organism', 'commonName', 'organismPart', 'sex'];

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private route: ActivatedRoute, private _apiService: ApiService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    const routeParams = this.route.snapshot.paramMap;
    const organismId = routeParams.get('organismId');
    this._apiService.getDetailsData(organismId, 'organisms_test').subscribe(
      data => {
        this.data = data['results'][0]['_source'];
        this.isLoadingResults = false;
        this.isRateLimitReached = data === null;

        this.specimensData = new MatTableDataSource(data['results'][0]['_source']['specimens']);
        if (data['results'][0]['_source']['specimens']) {
          this.specimensDataLength = data['results'][0]['_source']['specimens'].length;
        } else {
          this.specimensDataLength = 0;
        }
        this.specimensData.paginator = this.paginator;
        this.specimensData.sort = this.sort;
      }
    );
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.specimensData.filter = filterValue.trim().toLowerCase();
    if (this.specimensData.paginator) {
      this.specimensData.paginator.firstPage();
    }
  }

  checkNagoyaProtocol(data: any): boolean {
    return data.hasOwnProperty('nagoya_protocol');
  }

}
