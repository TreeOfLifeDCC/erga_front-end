import {AfterViewInit, Component, EventEmitter, OnInit, ViewChild, ElementRef} from '@angular/core';
import {ApiService} from "../api.service";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort, MatSortHeader} from "@angular/material/sort";
import {merge, of as observableOf} from "rxjs";
import {catchError, map, startWith, switchMap} from "rxjs/operators";
import {MatCard, MatCardActions, MatCardTitle} from "@angular/material/card";
import {MatList, MatListItem} from "@angular/material/list";
import {FlexModule} from "@angular/flex-layout";
import {MatLine} from "@angular/material/core";
import {MatChip, MatChipSet} from "@angular/material/chips";
import {MatIcon} from "@angular/material/icon";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef,
  MatNoDataRow, MatRow, MatRowDef,
  MatTable
} from "@angular/material/table";
import {RouterLink} from "@angular/router";
import {MatAnchor, MatButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";
import {ActivatedRoute, Router} from '@angular/router';
import {MatProgressBar} from '@angular/material/progress-bar';
import {FormsModule} from "@angular/forms";
import { TruncatePipe } from './truncate.pipe';

@Component({
  selector: 'app-publications',
  templateUrl: './publications.component.html',
  styleUrl: './publications.component.css',
  imports: [
      TruncatePipe,
      MatCard,
      MatCardTitle,
      MatCardActions,
      MatListItem,
      MatList,
      FlexModule,
      MatLine,
      MatChipSet,
      MatChip,
      MatIcon,
      MatProgressSpinner,
      MatTable,
      RouterLink,
      MatHeaderCell,
      MatColumnDef,
      MatSortHeader,
      MatCell,
      MatHeaderCellDef,
      MatCellDef,
      MatPaginator,
      MatNoDataRow,
      MatSort,
      MatAnchor,
      MatHeaderRow,
      MatRow,
      MatInput,
      MatLabel,
      MatFormField,
      MatHeaderRowDef,
      MatRowDef,
      MatProgressBar,
      MatButton,
      FormsModule
  ],
  standalone: true
})
export class PublicationsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['title', 'journalTitle', 'pubYear', 'study_id', 'organism_name'];
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
  classes = ["superkingdom", "kingdom", "subkingdom", "superphylum", "phylum", "subphylum", "superclass", "class",
    "subclass", "infraclass", "cohort", "subcohort", "superorder", "order", "suborder", "infraorder", "parvorder",
    "section", "subsection", "superfamily", "family", " subfamily", " tribe", "subtribe", "genus", "series", "subgenus",
    "species_group", "species_subgroup", "species", "subspecies", "varietas", "forma"];
  timer: any;
  phylogenyFilters: string[] = [];
  articleTypeFilters: any[] = [];
  journalFilters: any[] = [];
  pubYearFilters: any[] = [];
  queryParams: any = {};

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('input', { static: true }) searchInput: ElementRef;

  constructor(private _apiService: ApiService,
              private router: Router,
              private activatedRoute: ActivatedRoute,) { }

  ngOnInit(): void {
    // get url parameters
    const queryParamMap: any = this.activatedRoute.snapshot['queryParamMap'];
    const params = queryParamMap['params'];
    console.log(params)
    if (Object.keys(params).length !== 0) {
      for (const key in params) {
        if (params.hasOwnProperty(key)) {
           if (params[key].includes('searchValue - ')) {
            this.searchValue = params[key].split('searchValue - ')[1];
          } else {
            this.activeFilters.push(params[key]);
          }

        }
      }
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
              return this._apiService.getPublicationsData(this.paginator.pageIndex,
                  this.paginator.pageSize, this.searchValue, this.sort.active, this.sort.direction, this.activeFilters,
                  'articles'
              ).pipe(catchError(() => observableOf(null)));
            }),
            map(data => {
              // Flip flag to show that loading has finished.
              this.isLoadingResults = false;
              this.isRateLimitReached = data === null;

              if (data === null) {
                return [];
              }
              console.log(data)

              // Only refresh the result length if there is new metadataData. In case of rate
              // limit errors, we do not want to reset the metadataPaginator to zero, as that
              // would prevent users from re-triggering requests.
              this.resultsLength = data.count;
              this.aggregations = data.aggregations;

              this.articleTypeFilters = [];
              if (this.aggregations.articleType.buckets.length > 0) {
                this.articleTypeFilters = this.merge(this.articleTypeFilters,
                    this.aggregations.articleType.buckets,
                    'article_type');
              }

              this.journalFilters = [];
              if (this.aggregations.journalTitle.buckets.length > 0) {
                this.journalFilters = this.merge(this.journalFilters,
                    this.aggregations.journalTitle.buckets,
                    'journal_title');
              }

              this.pubYearFilters = [];
              if (this.aggregations.pubYear.buckets.length > 0) {
                this.pubYearFilters = this.merge(this.pubYearFilters,
                    this.aggregations.pubYear.buckets,
                    'pub_year');
              }

              this.queryParams = [...this.activeFilters];

              // add search value to URL query param
              if (this.searchValue) {
                this.queryParams.push(`searchValue - ${this.searchValue}`);
              }

              this.replaceUrlQueryParams();
              return data.results;
            }),
        )
        .subscribe(data => (this.data = data));
  }

  merge = (first: any[], second: any[], filterLabel: string) => {
    for (let i = 0; i < second.length; i++) {
      second[i].label = filterLabel;
      first.push(second[i]);
    }
    return first;
  }


  applyFilter(event: Event) {
    this.searchValue = (event.target as HTMLInputElement).value;
    this.searchChanged.emit();
  }



  refreshPage() {
    clearTimeout(this.timer);
    this.activeFilters = [];
    this.phylogenyFilters = [];
    this.currentClass = 'kingdom';
    this.searchValue = '';
    this.filterChanged.emit();
    this.router.navigate([]);
  }

  replaceUrlQueryParams() {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: this.queryParams,
      replaceUrl: true,
      skipLocationChange: false
    });
  }

  onFilterClick(filterValue: string, phylogenyFilter: boolean = false) {
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

  displayActiveFilterName(filterName: string) {
    if (filterName && filterName.startsWith('symbionts_')) {
      return 'Symbionts-' + filterName.split('-')[1];
    }
    return filterName;
  }

  getJournalName(data: any): string {
    if (data.journalTitle !== undefined) {
      return data.journalTitle;
    } else {
      return 'Wellcome Open Res';
    }
  }

  getYear(data: any): string {
    if (data.pubYear !== undefined) {
      return data.pubYear;
    } else {
      return '-';
    }
  }

}
