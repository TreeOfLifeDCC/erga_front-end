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
import {NgForOf} from "@angular/common";
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
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute, Router} from '@angular/router';
import {MatProgressBar} from '@angular/material/progress-bar';

@Component({
    selector: 'app-status-tracking',
    templateUrl: './status-tracking.component.html',
    styleUrls: ['./status-tracking.component.css'],
    imports: [
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
        MatButton
    ],
    providers: [HttpClient],
    standalone: true
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
    isPhylogenyFilterProcessing = false; // Flag to prevent double-clicking
    lastPhylogenyVal = '';
    activeFilters = new Array<string>();

    currentStyle: string;
    currentClass = 'kingdom';
    classes = ["superkingdom", "kingdom", "subkingdom", "superphylum", "phylum", "subphylum", "superclass", "class",
        "subclass", "infraclass", "cohort", "subcohort", "superorder", "order", "suborder", "infraorder", "parvorder",
        "section", "subsection", "superfamily", "family", " subfamily", " tribe", "subtribe", "genus", "series", "subgenus",
        "species_group", "species_subgroup", "species", "subspecies", "varietas", "forma"];
    timer: any;
    phylogenyFilters: string[] = [];
    symbiontsFilters: any[] = [];
    preventSimpleClick = false;
    queryParams: any = {};
    displayProgressBar = false;

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
                    } else if (params[key].includes('searchValue - ')) {
                        this.searchValue = params[key].split('searchValue - ')[1];
                    } else if (params[key].includes('searchValue - ')) {
                        this.searchValue = params[key].split('searchValue - ')[1];
                    } else {
                        this.activeFilters.push(params[key]);
                    }

                }
            }
        }

        // this.activatedRoute.queryParams.subscribe(params => {
        //     this.queryParams = {...params};
        // });
        // if ('filter' in this.queryParams){
        //     this.activeFilters = Array.isArray(this.queryParams['filter']) ?
        //         [...this.queryParams['filter']] : [this.queryParams['filter']];
        // }
        // if (this.queryParams['sortActive'] && this.queryParams['sortDirection']){
        //     this.sort.active = this.queryParams['sortActive'];
        //     this.sort.direction = this.queryParams['sortDirection'];
        // }
        // if ('searchValue' in this.queryParams){
        //     this.searchValue = this.queryParams['searchValue'];
        //     this.searchInput.nativeElement.value = this.queryParams['searchValue'];
        // }
        // if ('pageIndex' in this.queryParams){
        //     this.paginator.pageIndex = this.queryParams['pageIndex'];
        // }
        // if ('pageSize' in this.queryParams){
        //     this.paginator.pageSize = this.queryParams['pageSize'];
        // }
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
                        this.currentClass, this.phylogenyFilters, 'tracking_status_index_test'
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
                    this.updateQueryParams('phylogenyCurrentClass');

                    this.replaceUrlQueryParams();

                    return data.results;
                }),
            )
            .subscribe(data => (this.data = data));
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

    merge = (first: any[], second: any[], filterLabel: string) => {
        for (let i = 0; i < second.length; i++) {
            second[i].label = filterLabel;
            first.push(second[i]);
        }
        return first;
    }

    getStatusCount(data: any) {
        if (data) {
            for (let i = 0; i < data.length; ++i) {
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

    onFilterClick(filterName:String , filterValue: string, phylogenyFilter: boolean = false) {
        // phylogeney filter selection
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
            if (filterName.startsWith('symbionts_') || filterName.startsWith('metagenomes_')){
                filterValue = `${filterName}-${filterValue}`;
            }
            const index = this.activeFilters.indexOf(filterValue);
            console.log(index)

            index !== -1 ? this.activeFilters.splice(index, 1) : this.activeFilters.push(filterValue);
            console.log(this.activeFilters)
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
        if (status === 'Done') {
            return 'background-color: #A8BAA8; color: black';
        } else {
            return 'background-color: #D8BCAA; color: black';
        }
    }

    downloadFile(downloadOption: string) {
        this.displayProgressBar = true;
        this._apiService.downloadRecords(downloadOption, this.paginator.pageIndex,
            this.paginator.pageSize, this.searchValue, this.sort.active, this.sort.direction, this.activeFilters,
            this.currentClass, this.phylogenyFilters, 'tracking_status_index_test').subscribe({
            next: (response: Blob) => {
                const blobUrl = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = 'status_tracking.csv';
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


}
