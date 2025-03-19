import {AfterViewInit, Component, OnInit, ViewChild, EventEmitter, ElementRef} from '@angular/core';
import {ApiService} from "../api.service";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort, MatSortHeader} from "@angular/material/sort";
import {catchError, map, startWith, switchMap} from "rxjs/operators";
import {merge, of as observableOf} from "rxjs";
import {MatDialog} from "@angular/material/dialog";
import {GenomeNoteListComponent} from "./genome-note-list-component/genome-note-list.component";
import {Title} from "@angular/platform-browser";
import {MatCard, MatCardActions, MatCardTitle} from "@angular/material/card";
import {MatList, MatListItem} from "@angular/material/list";
import {FlexLayoutModule} from "@ngbracket/ngx-layout";
import {MatChip, MatChipSet} from "@angular/material/chips";
import {MatLine} from "@angular/material/core";
import {MatIcon} from "@angular/material/icon";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {
    MatCell, MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow, MatHeaderRowDef, MatNoDataRow,
    MatRow, MatRowDef,
    MatTable
} from "@angular/material/table";
import {NavigationEnd, RouterLink} from "@angular/router";
import {MatAnchor, MatButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";
import {ActivatedRoute, Router} from '@angular/router';
import {MatDivider} from "@angular/material/divider";
import {MatProgressBar} from "@angular/material/progress-bar";
import {FormControl, FormGroup, FormsModule, Validators} from '@angular/forms';


@Component({
    selector: 'app-data-portal',
    templateUrl: './data-portal.component.html',
    standalone: true,
    imports: [
        MatCard,
        MatCardTitle,
        MatCardActions,
        MatList,
        MatListItem,
        FlexLayoutModule,
        MatChipSet,
        MatLine,
        MatChip,
        MatIcon,
        MatProgressSpinner,
        MatLabel,
        MatFormField,
        MatTable,
        MatSort,
        MatHeaderCellDef,
        RouterLink,
        MatHeaderCell,
        MatCell,
        MatAnchor,
        MatColumnDef,
        MatPaginator,
        MatHeaderRow,
        MatRow,
        MatHeaderRowDef,
        MatRowDef,
        MatNoDataRow,
        MatCellDef,
        MatButton,
        MatInput,
        MatSortHeader,
        MatDivider,
        MatProgressBar,
        FormsModule
    ],
    styleUrls: ['./data-portal.component.css']
})
export class DataPortalComponent implements OnInit, AfterViewInit {
    symbiontsFilters: any[] = [];
    experimentTypeFilters: any[] = [];
    displayedColumns: string[] = ['organism', 'commonName', 'commonNameSource', 'currentStatus', 'externalReferences'];
    data: any;
    searchValue: string;
    searchChanged = new EventEmitter<any>();
    filterChanged = new EventEmitter<any>();
    lastPhylogenyVal = '';
    resultsLength = 0;
    isLoadingResults = true;
    isRateLimitReached = false;
    aggregations: any;
    isPhylogenyFilterProcessing = false; // Flag to prevent double-clicking
    activeFilters = new Array<string>();
    showAllFilters: { [key: string]: boolean } = {
        projects: false,
        experimentTypes: false,
    };

    currentStyle: string;
    currentClass = 'kingdom';
    classes = ["superkingdom", "kingdom", "subkingdom", "superphylum", "phylum", "subphylum", "superclass", "class",
        "subclass", "infraclass", "cohort", "subcohort", "superorder", "order", "suborder", "infraorder", "parvorder",
        "section", "subsection", "superfamily", "family", " subfamily", " tribe", "subtribe", "genus", "series", "subgenus",
        "species_group", "species_subgroup", "species", "subspecies", "varietas", "forma"];
    timer: any;
    phylogenyFilters: string[] = [];
    queryParams: any = {};
    genomelength = 0;
    tolqc_length = 0;
    result: any;
    displayProgressBar = false;


    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild('input', { static: true }) searchInput: ElementRef;
    public downloadForm!: FormGroup;
    dataColumnsDefination = [{ name: 'Organism', column: 'organism', selected: true },
        { name: 'Common Name', column: 'commonName', selected: true },
        { name: 'Common Name Source', column: 'commonNameSource', selected: true },
        { name: 'Current Status', column: 'currentStatus', selected: true },
        { name: 'External references', column: 'externalReferences', selected: true }];
    columnschangedChanged = new EventEmitter<any>();

    constructor(private _apiService: ApiService, private dialog: MatDialog, private titleService: Title,
                private router: Router,
                private activatedRoute: ActivatedRoute) {
    }

    ngOnInit(): void {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                if (event.urlAfterRedirects === '/data_portal') {
                    this.refreshPage();
                }
            }
        });

        this.downloadForm = new FormGroup({
            downloadOption: new FormControl('', [Validators.required]),
        });
        this.getDisplayedColumns();
        this.titleService.setTitle('Data Portal');

        const queryParamMap: any = this.activatedRoute.snapshot['queryParamMap'];
        const params = queryParamMap['params'];
        if (Object.keys(params).length !== 0) {
            for (const key in params) {
                if (params.hasOwnProperty(key)) {
                    if (params[key].includes('phylogenyFilters - ')) {
                        const phylogenyFilters = params[key].split('phylogenyFilters - ')[1];
                        // Remove square brackets and split by comma
                        this.phylogenyFilters = phylogenyFilters.slice(1, -1).split(',');
                    } else if (params[key].includes('phylogenyCurrentClass - ')) {
                        const phylogenyCurrentClass = params[key].split('phylogenyCurrentClass - ')[1];
                        this.currentClass = phylogenyCurrentClass;
                    } else if (params[key].includes('searchValue - ')){
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
        this.columnschangedChanged.subscribe(() => (this.paginator.pageIndex = 0));
        merge(this.paginator.page, this.sort.sortChange, this.searchChanged, this.filterChanged, this.columnschangedChanged)
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
                    console.log(this.aggregations)

                    // symbionts
                    this.symbiontsFilters = [];
                    if (this.aggregations.symbionts_biosamples_status.buckets.length > 0) {
                        this.symbiontsFilters = this.merge(this.symbiontsFilters,
                            this.aggregations.symbionts_biosamples_status.buckets,
                            'symbionts_biosamples_status');
                    }
                    if (this.aggregations.symbionts_raw_data_status.buckets.length > 0) {
                        this.symbiontsFilters = this.merge(this.symbiontsFilters,
                            this.aggregations.symbionts_raw_data_status.buckets,
                            'symbionts_raw_data_status');
                    }
                    if (this.aggregations.symbionts_assemblies_status.buckets.length > 0) {
                        this.symbiontsFilters = this.merge(this.symbiontsFilters,
                            this.aggregations.symbionts_assemblies_status.buckets,
                            'symbionts_assemblies_status');
                    }

                    // experiment Type
                    this.experimentTypeFilters = [];
                    if (this.aggregations?.experiment.library_construction_protocol.buckets.length > 0) {
                        this.experimentTypeFilters = this.merge(this.experimentTypeFilters,
                            this.aggregations?.experiment.library_construction_protocol.buckets,
                            'experimentType');
                    }

                    // remove empty experiment types
                    if (this.experimentTypeFilters.length > 0) {
                        this.experimentTypeFilters = this.experimentTypeFilters.filter(bucket => bucket.key !== '');
                    }

                    // get last phylogeny element for filter button
                    this.lastPhylogenyVal = this.phylogenyFilters.slice(-1)[0];

                    this.queryParams = [...this.activeFilters];

                    // add search value to URL query param
                    if (this.searchValue) {
                        this.queryParams.push(`searchValue - ${this.searchValue}`);
                    }

                    if (this.phylogenyFilters && this.phylogenyFilters.length) {
                        const index = this.queryParams.findIndex((element: any) => element.includes('phylogenyFilters - '));
                        if (index > -1) {
                            this.queryParams[index] = `phylogenyFilters - [${this.phylogenyFilters}]`;
                        } else {
                            this.queryParams.push(`phylogenyFilters - [${this.phylogenyFilters}]`);
                        }
                    }
                    // update url with the value of the phylogeny current class
                    this.updateQueryParams('phylogenyCurrentClass')
                    this.replaceUrlQueryParams();

                    return data.results;
                }),
            )
            .subscribe(data => (this.data = data));
    }

    replaceUrlQueryParams() {
        this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: this.queryParams,
            replaceUrl: true,
            skipLocationChange: false
        });
    }

    removePhylogenyFilters() {
        // update url with the value of the phylogeny current class
        const queryParamPhyloIndex = this.queryParams.findIndex((element: any) => element.includes('phylogenyFilters - '));
        if (queryParamPhyloIndex > -1) {
            this.queryParams.splice(queryParamPhyloIndex, 1);
        }

        const queryParamCurrentClassIndex = this.queryParams.findIndex((element: any) => element.includes('phylogenyCurrentClass - '));
        if (queryParamCurrentClassIndex > -1) {
            this.queryParams.splice(queryParamCurrentClassIndex, 1);
        }
        // Replace current url parameters with new parameters.
        this.replaceUrlQueryParams();
        // reset phylogeny variables
        this.phylogenyFilters = [];
        this.currentClass = 'kingdom';
        this.filterChanged.emit();
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

    toggleFilter(key: string): void {
        this.showAllFilters[key] = !this.showAllFilters[key];
    }

    merge = (first: any[], second: any[], filterLabel: string) => {
        for (const item of second) {
            item.label = filterLabel;
            first.push(item);
        }
        return first;
    }

    getStatusCount(data: any) {
        if (data) {
            for (const item of data) {
                if (item.key === 'Done') {
                    return item.doc_count;
                }
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


    updateQueryParams(urlParam: string){
        if (urlParam === 'phylogenyCurrentClass'){
            const queryParamIndex = this.queryParams.findIndex((element: any) => element.includes('phylogenyCurrentClass - '));
            if (queryParamIndex > -1) {
                this.queryParams[queryParamIndex] = `phylogenyCurrentClass - ${this.currentClass}`;
            } else {
                this.queryParams.push(`phylogenyCurrentClass - ${this.currentClass}`);
            }
        }
    }

    onFilterClick(filterValue: string, phylogenyFilter: boolean = false) {
        //reset showAllFilters
        this.showAllFilters = {
            projects: false,
            experimentTypes: false,
        };

        if (phylogenyFilter) {
            if (this.isPhylogenyFilterProcessing) {
                return;
            }
            // Set flag to prevent further clicks
            this.isPhylogenyFilterProcessing = true;

            this.phylogenyFilters.push(`${this.currentClass}:${filterValue}`);
            const index = this.classes.indexOf(this.currentClass) + 1;
            this.currentClass = this.classes[index];

            // update url with the value of the phylogeny current class
            this.updateQueryParams('phylogenyCurrentClass');

            // Replace current parameters with new parameters.
            this.replaceUrlQueryParams();
            this.filterChanged.emit();

            // Reset isPhylogenyFilterProcessing flag
            setTimeout(() => {
                this.isPhylogenyFilterProcessing = false;
            }, 500);
        } else{
            clearTimeout(this.timer);
            const index = this.activeFilters.indexOf(filterValue);
            index !== -1 ? this.activeFilters.splice(index, 1) : this.activeFilters.push(filterValue);
            this.filterChanged.emit();
        }
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

    onHistoryClick() {
        this.phylogenyFilters.splice(this.phylogenyFilters.length - 1, 1);
        const previousClassIndex = this.classes.indexOf(this.currentClass) - 1;
        this.currentClass = this.classes[previousClassIndex];
        this.filterChanged.emit();
    }

    onRefreshClick() {
        this.phylogenyFilters = [];
        this.currentClass = 'kingdom';
        // remove phylogenyFilters param from url
        const index = this.queryParams.findIndex((element: any) => element.includes('phylogenyFilters - '));
        if (index > -1) {
            this.queryParams.splice(index, 1);
            // Replace current parameters with new parameters.
            this.replaceUrlQueryParams();
        }
        this.filterChanged.emit();
    }

    getStyle(status: string) {
        if (status === 'Annotation Complete') {
            return 'background-color: #A8BAA8; color: black';
        } else {
            return 'background-color: #D8BCAA; color: black';
        }
    }

    getCommonNameSourceStyle(source: string) {
        if (source === 'UKSI') {
            return 'background-color: #D8BCAA; color: black';
        } else {
            return 'background-color: #A8BAA8; color: white';
        }
    }

    checkShowTolQc(data: any) {
        if (data.hasOwnProperty('tolqc_links')) {
            this.tolqc_length = data.tolqc_links.length;
            return data.tolqc_links.length > 0;
        } else {
            return false;
        }
    }

    checkGenomeNotes(data: any) {
        if (data.genome_notes && data.genome_notes.length !== 0) {
            this.genomelength = data.genome_notes.length;
            return true;
        } else {
            return false;
        }
    }

    checkNagoyaProtocol(data: any): boolean {
        return data.hasOwnProperty('nagoya_protocol');
    }

    openGenomeNoteDialog(data: any, dialogType: string) {
        if (dialogType === 'genome_note') {const dialogRef = this.dialog.open(GenomeNoteListComponent, {
            width: '1000px',
            autoFocus: false,
            data: {
                genomeNotes: data.genome_notes,
                dialogType: dialogType
            }
        });
        } else {
            const dialogRef = this.dialog.open(GenomeNoteListComponent, {
                width: '1000px',
                autoFocus: false,
                data: {
                    tolqcLinks: data.tolqc_links,
                    dialogType: dialogType,
                }
            })
        }
    }

    downloadFile(downloadOption: string) {
        this.displayProgressBar = true;
        this._apiService.downloadRecords(downloadOption, this.paginator.pageIndex,
            this.paginator.pageSize, this.searchValue, this.sort.active, this.sort.direction, this.activeFilters,
            this.currentClass, this.phylogenyFilters, 'data_portal').subscribe({
            next: (response: Blob) => {
                const blobUrl = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = 'data_portal.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            },
            error: error => {
                console.error('Error downloading the CSV file:', error);
            },
            complete: () => {
                this.displayProgressBar = false;
            }
        });
    }

    getDisplayedColumns() {
        this.displayedColumns = [];
        this.dataColumnsDefination.forEach(obj => {
            if (obj.selected) {
                this.displayedColumns.push(obj.column);
            }
        });
    }
}
