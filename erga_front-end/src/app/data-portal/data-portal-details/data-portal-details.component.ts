import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ApiService} from "../../api.service";
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {MatPaginator} from "@angular/material/paginator";

@Component({
  selector: 'app-data-portal-details',
  templateUrl: './data-portal-details.component.html',
  styleUrls: ['./data-portal-details.component.css']
})
export class DataPortalDetailsComponent implements OnInit, AfterViewInit {
  organismData: any;
  assembliesDisplayedColumns: string[] = ['accession', 'version', 'assembly_name', 'description'];
  assembliesDataSource: MatTableDataSource<any>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private route: ActivatedRoute, private _apiService: ApiService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    const routeParams = this.route.snapshot.paramMap;
    const organismId = routeParams.get('organismId');
    this._apiService.getDetailsData(organismId).subscribe(
      data => {
        this.organismData = data.results[0]['_source'];
        this.assembliesDataSource = data.results[0]['_source']['assemblies'];
        console.log(data.results[0]['_source']['assemblies'][0]['version']);
      }
    );
    if (this.assembliesDataSource) {
      this.assembliesDataSource.paginator = this.paginator;
      this.assembliesDataSource.sort = this.sort;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.assembliesDataSource.filter = filterValue.trim().toLowerCase();

    if (this.assembliesDataSource.paginator) {
      this.assembliesDataSource.paginator.firstPage();
    }
  }

}
