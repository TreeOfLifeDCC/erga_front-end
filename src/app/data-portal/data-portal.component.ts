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
import {FlexLayoutModule} from "@angular/flex-layout";
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
import {RouterLink} from "@angular/router";
import {MatAnchor, MatButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";
import {MatTableExporterModule} from "mat-table-exporter";
import {ActivatedRoute} from '@angular/router';
import {MatProgressBar} from "@angular/material/progress-bar";


interface FilterGroup {
    itemLimit: number;
    defaultItemLimit: number;
    isCollapsed: boolean;
    filters: any[];
}

interface FilterGroups {
    projects: FilterGroup;
}

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
        MatTableExporterModule,
        MatProgressBar
    ],
    styleUrls: ['./data-portal.component.css']
})
export class DataPortalComponent implements OnInit, AfterViewInit {
    symbiontsFilters: any[] = [];
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

    filterGroups = {
        projects: {
            defaultItemLimit: 5,
            itemLimit: 5,
            isCollapsed: true,
            filters: []
        }
    };
    displayProgressBar = false;


    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild('input', { static: true }) searchInput: ElementRef;
    private isProcessing: boolean;

    constructor(
        private _apiService: ApiService,
        private dialog: MatDialog,
        private titleService: Title,
        private activatedRoute: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.titleService.setTitle("Data Portal");

        this.activatedRoute.queryParams.subscribe((params) => {
            this.queryParams = { ...params };

            this.activeFilters = [];
            this.phylogenyFilters = [];
            this.searchValue = '';
            this.currentClass = "kingdom";

            if ("filter" in this.queryParams) {
                this.activeFilters = Array.isArray(this.queryParams["filter"])
                    ? [...this.queryParams["filter"]]
                    : [this.queryParams["filter"]];
            }
            if ("phylogenyFilters" in this.queryParams) {
                let phylogenyFilters = [];

                if (Array.isArray(this.queryParams["phylogenyFilters"])) {
                    phylogenyFilters = [...this.queryParams["phylogenyFilters"]];
                } else {
                    phylogenyFilters = [this.queryParams["phylogenyFilters"]];
                }

                phylogenyFilters = phylogenyFilters.filter((item) => item !== "");

                if (phylogenyFilters.length > 0) {
                    this.phylogenyFilters = phylogenyFilters;
                    this.activeFilters.push(...this.phylogenyFilters);
                }
            }
            if (this.queryParams["sortActive"] && this.queryParams["sortDirection"]) {
                this.sort.active = this.queryParams["sortActive"];
                this.sort.direction = this.queryParams["sortDirection"];
            }
            if ("searchValue" in this.queryParams) {
                this.searchValue = this.queryParams["searchValue"];
                this.searchInput.nativeElement.value = this.queryParams["searchValue"];
            }
            if ("pageIndex" in this.queryParams) {
                this.paginator.pageIndex = this.queryParams["pageIndex"];
            }
            if ("pageSize" in this.queryParams) {
                this.paginator.pageSize = this.queryParams["pageSize"];
            }
            if ("currentClass" in this.queryParams) {
                this.currentClass = this.queryParams["currentClass"];
            }

            this.filterChanged.emit();
            this.searchChanged.emit();
        });
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

                    const activeFiltersForSort = this.activeFilters.filter(
                        filter => !filter.includes(':')
                    );

                    return this._apiService.getData(this.paginator.pageIndex,
                        this.paginator.pageSize, this.searchValue, this.sort.active, this.sort.direction,
                        activeFiltersForSort, this.currentClass, this.phylogenyFilters, 'data_portal_test'
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

                    this.filterGroups.projects.filters = this.aggregations.project_name.buckets;

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

    onFilterClick(filterValue: string) {
        clearTimeout(this.timer);
        const index = this.activeFilters.indexOf(filterValue);
        index !== -1 ? this.activeFilters.splice(index, 1) : this.activeFilters.push(filterValue);
        if (filterValue.includes(':')) {
            this.onRefreshClick();
        } else {
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
        if (filterName.startsWith("symbionts_")) {
            return "Symbionts-" + filterName.split("-")[1];
        }
        if (filterName.includes(":")) {
            const filterNameSplitted = filterName.split("-");
            const lastPart = filterNameSplitted[filterNameSplitted.length - 1];
            return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
        }
        return filterName;
    }

    changeCurrentClassWithFiltering(filterValue: string) {

        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;

        this.phylogenyFilters.push(`${this.currentClass}:${filterValue}`);

        const index = this.classes.indexOf(this.currentClass) + 1;
        this.currentClass = this.classes[index];

        const newPhylogenyFilter = `${this.currentClass}:${filterValue}`;
        const existingPhylogenyFilterIndex = this.activeFilters.findIndex(filter => filter.includes(':'));
        if (existingPhylogenyFilterIndex !== -1) {
            this.activeFilters[existingPhylogenyFilterIndex] = newPhylogenyFilter;
        } else {
            this.activeFilters.push(newPhylogenyFilter);
        }

        this.filterChanged.emit();

        setTimeout(() => {
            this.isProcessing = false;
        }, 200);
    }

    onHistoryClick() {
        if (this.phylogenyFilters.length > 0) {

            let filter = this.phylogenyFilters[0];
            const lastIndex = filter.lastIndexOf("-");

            if (lastIndex !== -1) {
                filter = filter.substring(0, lastIndex);
                this.phylogenyFilters = [filter];
            } else {
                this.phylogenyFilters = [];
            }

            const previousClassIndex = this.classes.indexOf(this.currentClass) - 1;
            this.currentClass = this.classes[previousClassIndex];
            this.filterChanged.emit();
        }
    }

    onRefreshClick() {
        this.phylogenyFilters = [];
        this.currentClass = 'kingdom';

        const existingPhylogenyFilterIndex = this.activeFilters.findIndex(filter => filter.includes(':'));
        if (existingPhylogenyFilterIndex !== -1) {
            this.activeFilters.splice(existingPhylogenyFilterIndex, 1);
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

    toggleCollapse(filterGroupName: keyof FilterGroups) {
        const group = this.filterGroups[filterGroupName];
        group.isCollapsed = !group.isCollapsed;
        group.itemLimit = group.isCollapsed ? group.defaultItemLimit : group.filters.length;
    }
}
