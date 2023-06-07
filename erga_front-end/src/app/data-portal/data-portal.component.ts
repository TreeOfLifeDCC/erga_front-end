import {AfterViewInit, Component, OnInit, ViewChild, EventEmitter} from '@angular/core';
import {ApiService} from "../api.service";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {catchError, map, startWith, switchMap} from "rxjs/operators";
import {merge, of as observableOf} from "rxjs";


@Component({
  selector: 'app-data-portal',
  templateUrl: './data-portal.component.html',
  styleUrls: ['./data-portal.component.css']
})
export class DataPortalComponent implements OnInit, AfterViewInit {
  codes = {
    m: 'mammals',
    d: 'dicots',
    i: 'insects',
    u: 'algae',
    p: 'protists',
    x: 'molluscs',
    t: 'other-animal-phyla',
    q: 'arthropods',
    k: 'chordates',
    f: 'fish',
    a: 'amphibians',
    b: 'birds',
    e: 'echinoderms',
    w: 'annelids',
    j: 'jellyfish',
    h: 'platyhelminths',
    n: 'nematodes',
    v: 'vascular-plants',
    l: 'monocots',
    c: 'non-vascular-plants',
    g: 'fungi',
    o: 'sponges',
    r: 'reptiles',
    s: 'sharks',
    y: 'bacteria',
    z: 'archea'
  };
  displayedColumns: string[] = ['organism', 'commonName', 'commonNameSource', 'currentStatus', 'externalReferences'];
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

  preventSimpleClick = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private _apiService: ApiService) { }

  ngOnInit(): void {
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
            this.currentClass, this.phylogenyFilters, 'data_portal'
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
      return 'background-color: #7b1fa2';
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

  getStyle(status: string) {
    if (status === 'Annotation Complete') {
      return 'background-color: limegreen; color: black';
    } else {
      return 'background-color: yellow; color: black';
    }
  }

  getCommonNameSourceStyle(source: string) {
    if (source === 'UKSI') {
      return 'background-color: yellow; color: black';
    } else {
      return 'background-color: cornflowerblue; color: white';
    }
  }

  generateTolidLink(data: any) {
    const organismName = data.organism.split(' ').join('_');
    const firstChar: string = data.tolid.charAt(0);
    const clade = this.codes[firstChar as keyof typeof this.codes];
    let project_name;
    data.project_name === 'dtol' ? project_name = 'darwin' : project_name = 'erga';
    return `https://tolqc.cog.sanger.ac.uk/${project_name}/${clade}/${organismName}`;
  }

  checkGenomeNotes(data:any) {
    if (data.genome_notes && data.genome_notes.length !== 0) {
      return true;
    } else {
      return false;
    }
  }

  checkNagoyaProtocol(data: any): boolean {
    return data.hasOwnProperty('nagoya_protocol');
  }

}
