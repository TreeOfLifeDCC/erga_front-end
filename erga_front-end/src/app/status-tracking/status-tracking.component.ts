import {AfterViewInit, Component, EventEmitter, OnInit, ViewChild, ElementRef} from '@angular/core';
import {ApiService} from "../api.service";
import {MatLegacyPaginator as MatPaginator} from "@angular/material/legacy-paginator";
import {MatSort} from "@angular/material/sort";
import {merge, of as observableOf} from "rxjs";
import {catchError, map, startWith, switchMap} from "rxjs/operators";
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-status-tracking',
  templateUrl: './status-tracking.component.html',
  styleUrls: ['./status-tracking.component.css']
})
export class StatusTrackingComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['organism', 'commonName', 'biosamples', 'raw_data', 'assemblies_status',
    'annotation_complete'];
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
  currentClass = 'kingdom';
  classes = ["superkingdom", "kingdom", "subkingdom", "superphylum", "phylum","subphylum","superclass","class",
    "subclass", "infraclass", "cohort", "subcohort", "superorder", "order", "suborder", "infraorder", "parvorder",
    "section", "subsection", "superfamily", "family"," subfamily"," tribe", "subtribe", "genus", "series", "subgenus",
    "species_group", "species_subgroup", "species", "subspecies", "varietas", "forma"];
  timer: any;
  phylogenyFilters: string[] = [];
  queryParams: any = {};
  preventSimpleClick = false;


  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('input', { static: true }) searchInput: ElementRef;

  constructor(private _apiService: ApiService,
              private router: Router,
              private activatedRoute: ActivatedRoute,) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.queryParams = {...params};
    });
    if ('filter' in this.queryParams){
      this.activeFilters = Array.isArray(this.queryParams['filter']) ?
        [...this.queryParams['filter']] : [this.queryParams['filter']];
    }
    if (this.queryParams['sortActive'] && this.queryParams['sortDirection']){
      this.sort.active = this.queryParams['sortActive'];
      this.sort.direction = this.queryParams['sortDirection'];
    }
    if ('searchValue' in this.queryParams){
      this.searchValue = this.queryParams['searchValue'];
      this.searchInput.nativeElement.value = this.queryParams['searchValue'];
    }
    if ('pageIndex' in this.queryParams){
      this.paginator.pageIndex = this.queryParams['pageIndex'];
    }
    if ('pageSize' in this.queryParams){
      this.paginator.pageSize = this.queryParams['pageSize'];
    }
  }

  ngAfterViewInit() {
    // If the user changes the metadataSort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    this.searchChanged.subscribe(() => (this.paginator.pageIndex = 0));
    this.filterChanged.subscribe(() => (this.paginator.pageIndex = 0));
    merge(this.paginator.page, this.sort.sortChange, this.searchChanged, this.filterChanged)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this._apiService.getData(this.paginator.pageIndex,
            this.paginator.pageSize, this.searchValue, this.sort.active, this.sort.direction, this.activeFilters,
            this.currentClass, this.phylogenyFilters, 'tracking_status_index'
          ).pipe(catchError(() => observableOf(null)));
        }),
        map(data => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.isRateLimitReached = data === null;

          if (data === null) {
            return [];
          }

          // Only refresh the result length if there is new metadataData. In case of rate
          // limit errors, we do not want to reset the metadataPaginator to zero, as that
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

  convertProjectName(data: string) {
    if (data === 'dtol') {
      return 'DToL';
    } else {
      return data;
    }
  }

  applyFilter(event: Event) {
    this.searchValue = (event.target as HTMLInputElement).value;
    this.searchChanged.emit();
  }


  onFilterClick(filterValue: string) {
    console.log('double click');
    this.preventSimpleClick = true;
    clearTimeout(this.timer);
    const index = this.activeFilters.indexOf(filterValue);
    index !== -1 ? this.activeFilters.splice(index, 1) : this.activeFilters.push(filterValue);
    this.filterChanged.emit();
  }

  checkStyle(filterValue: string) {
    if (this.activeFilters.includes(filterValue)) {
      return 'background-color: #A8BAA8';
    } else {
      return '';
    }
  }

  changeCurrentClass(filterValue: string) {
    console.log('single click');
    let delay = 200;
    this.preventSimpleClick = false;
    this.timer = setTimeout(() => {
      if (!this.preventSimpleClick) {
        this.phylogenyFilters.push(`${this.currentClass}:${filterValue}`);
        const index = this.classes.indexOf(this.currentClass) + 1;
        this.currentClass = this.classes[index];
        console.log(this.phylogenyFilters);
        this.filterChanged.emit();
      }
    }, delay);
  }

  onHistoryClick() {
    this.phylogenyFilters.splice(this.phylogenyFilters.length - 1, 1);
    const previousClassIndex = this.classes.indexOf(this.currentClass) - 1;
    this.currentClass = this.classes[previousClassIndex];
    this.filterChanged.emit();
  }

  onRefreshClick() {
    this.phylogenyFilters = [];
    this.currentClass = 'kingdom';
    this.filterChanged.emit();
  }

  checkColor(status: string) {
    if (status === 'Done')
      return 'accent'
    else
      return 'yellow'
  }

  getStyle(status: string) {
    if (status === 'Done') {
      return 'background-color: #A8BAA8; color: black';
    } else {
      return 'background-color: #D8BCAA; color: black';
    }
  }


}
