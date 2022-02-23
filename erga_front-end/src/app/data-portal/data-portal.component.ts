import {AfterViewInit, Component, OnInit, ViewChild, EventEmitter} from '@angular/core';
import {ApiService} from "../api.service";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {catchError, map, startWith, switchMap} from "rxjs/operators";
import {merge, Observable, of as observableOf, Subject} from "rxjs";


@Component({
  selector: 'app-data-portal',
  templateUrl: './data-portal.component.html',
  styleUrls: ['./data-portal.component.css']
})
export class DataPortalComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['organism', 'commonName', 'currentStatus'];
  data: any;
  searchValue: string;
  searchChanged = new EventEmitter<any>();
  filterChanged = new EventEmitter<any>();

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;
  aggregations: any;

  activeFilters = new Array<string>();

  currentStyle: string;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private _apiService: ApiService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    this.searchChanged.subscribe(() => (this.paginator.pageIndex = 0));

    merge(this.paginator.page, this.sort.sortChange, this.searchChanged, this.filterChanged)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this._apiService.getData(this.paginator.pageIndex,
            this.paginator.pageSize, this.searchValue, this.sort.active, this.sort.direction, this.activeFilters
          ).pipe(catchError(() => observableOf(null)));
        }),
        map(data => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.isRateLimitReached = data === null;

          if (data === null) {
            return [];
          }

          // Only refresh the result length if there is new data. In case of rate
          // limit errors, we do not want to reset the paginator to zero, as that
          // would prevent users from re-triggering requests.
          this.resultsLength = data.count;
          this.aggregations = data.aggregations;
          return data.results;
        }),
      )
      .subscribe(data => (this.data = data));
  }

  getStatusCount(data: any) {
    if (data) {
      for (let i=0; i < data.length; ++i) {
        if (data[i]['key'] === 'Done')
          return data[i]['doc_count'];
      }
    }
  }

  applyFilter(event: Event) {
    this.searchValue = (event.target as HTMLInputElement).value;
    this.searchChanged.emit();
  }


  onFilterClick(filterValue: string) {
    const index = this.activeFilters.indexOf(filterValue);
    index !== -1 ? this.activeFilters.splice(index, 1) : this.activeFilters.push(filterValue);
    this.filterChanged.emit();
  }

  checkStyle(filterValue: string) {
    if (this.activeFilters.includes(filterValue)) {
      return 'background-color: #7b1fa2';
    } else {
      return '';
    }
  }

}
