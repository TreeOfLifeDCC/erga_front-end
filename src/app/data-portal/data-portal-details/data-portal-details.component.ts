import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, RouterLink} from "@angular/router";
import {ApiService} from "../../api.service";
import {MatSort} from "@angular/material/sort";
import {merge, of as observableOf} from "rxjs";
import {catchError, map, startWith, switchMap} from "rxjs/operators";
import {keyframes} from "@angular/animations";
import {MatPaginator} from "@angular/material/paginator";
import { MatExpansionModule } from '@angular/material/expansion';
import {
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatNoDataRow,
    MatRow,
    MatRowDef,
    MatTable,
    MatTableDataSource
} from "@angular/material/table";

import {
    MatCard,
    MatCardActions,
    MatCardContent,
    MatCardHeader,
    MatCardImage,
    MatCardTitle
} from "@angular/material/card";

import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatAnchor, MatButton} from "@angular/material/button";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MatChip} from "@angular/material/chips";
import {NgForOf, NgIf} from "@angular/common";
import {FlexLayoutModule} from "@ngbracket/ngx-layout";
import {MatTableExporterModule} from "mat-table-exporter";
import {MatExpansionPanel} from "@angular/material/expansion";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {TitleCasePipe} from "@angular/common";
import {MapClusterComponent} from "../map-cluster/map-cluster.component";
import {SafeResourceUrl} from "@angular/platform-browser";
import {MatExpansionPanelTitle} from "@angular/material/expansion";
import {MatListOption, MatSelectionList} from "@angular/material/list";
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, ScrollingModule} from "@angular/cdk/scrolling";
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-data-portal-details',
    templateUrl: './data-portal-details.component.html',
    standalone: true,
    imports: [
        MatCardTitle,
        MatCard,
        MatCardActions,
        MatTabGroup,
        MatTab,
        MatProgressSpinner,
        MatButton,
        MatInput,
        MatTable,
        MatSort,
        MatColumnDef,
        MatHeaderCell,
        MatHeaderCellDef,
        MatCellDef,
        MatCell,
        MatAnchor,
        MatChip,
        MatHeaderRow,
        MatHeaderRowDef,
        MatRowDef,
        MatRow,
        MatNoDataRow,
        MatPaginator,
        NgIf,
        MatCardHeader,
        MatCardContent,
        MatCardImage,
        NgForOf,
        MatLabel,
        MatFormField,
        MatTableExporterModule,
        MatExpansionModule,
        MatExpansionPanel,
        MatTableExporterModule,
        RouterLink,
        MapClusterComponent,
        MatExpansionPanel,
        MatExpansionPanelTitle,
        MatSelectionList,
        MatListOption,
        MatExpansionModule,
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        TitleCasePipe,
        ScrollingModule,
        FlexLayoutModule,
        MatIconModule
    ],
    styleUrls: ['./data-portal-details.component.css']
})
export class DataPortalDetailsComponent implements OnInit, AfterViewInit {
    organismData: any;
    metadataDisplayedColumns: string[] = ['accession', 'organism', 'commonName', 'sex', 'organismPart', 'trackingSystem'];
    annotationsDisplayedColumns: string[] = ['species', 'accession', 'annotation_gtf', 'annotation_gff3', 'proteins',
        'transcripts', 'softmasked_genome', 'repeat_library', 'other_data', 'view_in_browser']
    assembliesDisplayedColumns: string[] = ['accession', 'version', 'assembly_name', 'description'];
    filesDisplayedColumns: string[] = ['study_accession', 'sample_accession', 'experiment_accession', 'run_accession',
        'tax_id', 'scientific_name', 'fastq_ftp', 'submitted_ftp', 'sra_ftp', 'library_construction_protocol']
    goatDisplayedColumns: string[] = ['name', 'value', 'count', 'aggregation_method', 'aggregation_source'];

    humanReadableColumns = {
        study_accession: 'Study Accession',
        sample_accession: 'Sample Accession',
        experiment_accession: 'Experiment Accession',
        run_accession: 'Run Accession',
        tax_id: 'Tax ID',
        scientific_name: 'Scientific Name',
        fastq_ftp: 'FASTQ FTP',
        submitted_ftp: 'Submitted FTP',
        sra_ftp: 'SRA FTP',
        library_construction_protocol: 'Library Construction Protocol'
    };

    specialColumns = ['fastq_ftp', 'submitted_ftp', 'sra_ftp']
    popupImage: string | null = null;
    metadataData: any;
    metadataDataLength: number;
    annotationData: any;
    annotationDataLength: number;
    assembliesData: any;
    assembliesDataLength: number;
    filesData: any;
    filesDataLength: number;
    goatData: any;
    goatDataLength: number;
    goatDataLink: string;

    dataSourceSymbiontsRecords: any;
    specSymbiontsTotalCount: number;
    dataSourceSymbiontsAssemblies: any;
    dataSourceSymbiontsAssembliesCount: number;
    displayedColumnsAssemblies = ['accession', 'assembly_name', 'description', 'version'];

    specDisplayedColumns = ['accession', 'organism', 'commonName', 'sex', 'organismPart', 'trackingSystem'];

    @ViewChild('relatedSymbiontsPaginator') symPaginator: MatPaginator | undefined;

    @ViewChild('assembliesSymbiontsPaginator') asSymPaginator: MatPaginator | undefined;

    isLoadingResults = true;
    isRateLimitReached = false;

    showMetadata = false;
    showData = false;
    showGenomeNote = false;

    geoLocation: boolean;
    orgGeoList: any;
    specGeoList: any;

    nbnatlas: any;
    nbnatlasMapUrl: string;
    @Input() height = 200;
    @Input() width = 200;
    @Input() loader = '../../assets/200.gif';
    isLoading: boolean;
    url: SafeResourceUrl;

    isMapLoading: boolean = true;

    isDataLoaded: boolean = false;

    activeFilters: { sex: string[], organismPart: string[], trackingSystem: string[] } = {
        sex: [],
        organismPart: [],
        trackingSystem: []
    };

    countedFilters: Record<string, { id: string, value: number }[]> = {
        sex: [],
        organismPart: [],
        trackingSystem: []
    };

    expandedFilters: Record<string, boolean> = {
        sex: false,
        organismPart: false,
        trackingSystem: false
    };

    visibleFilters: Record<string, any[]> = { sex: [], organismPart: [], trackingSystem: [] };

    filterHeightDefault = 250;
    filterHeightMax = 350;
    filterItemSize = 50;
    filterHeight: Record<string, number> = {
        sex: this.filterHeightDefault,
        organismPart: this.filterHeightDefault,
        trackingSystem: this.filterHeightDefault
    };

    filtersLimit: Record<string, number> = {
        sex: 5,
        organismPart: 5,
        trackingSystem: 5,
    };

    searchTerm: string = '';

    selectedFilters: Record<string, string | number | string[]> = {};

    filterKeys: ("sex" | "organismPart" | "trackingSystem")[] = ['sex', 'organismPart', 'trackingSystem'];

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

    INSDC_ID: string = '';
    currentStatus: string ='';

    @ViewChild("tabgroup", { static: false }) tabgroup: MatTabGroup;

    @ViewChild('metadataPaginator') metadataPaginator: MatPaginator;
    @ViewChild('metadataSort') metadataSort: MatSort;

    @ViewChild('annotationPaginator') annotationPaginator: MatPaginator;
    @ViewChild('annotationSort') annotationSort: MatSort;

    @ViewChild('assembliesPaginator') assembliesPaginator: MatPaginator;
    @ViewChild('assembliesSort') assembliesSort: MatSort;

    @ViewChild('filesPaginator') filesPaginator: MatPaginator;
    @ViewChild('filesSort') filesSort: MatSort;

    constructor(private route: ActivatedRoute,
                private _apiService: ApiService,
                private sanitizer: DomSanitizer) {
    }

    ngOnInit(): void {
        this.countedFilters = {
            sex: [],
            organismPart: [],
            trackingSystem: []
        };

        this.visibleFilters = {
            sex: [],
            organismPart: [],
            trackingSystem: []
        };

        this.countFilterFields();
        this.setupFilterPredicate();
    }

    private transformGeoList(data: any[]): any[] {
        return data.map(item => ({
            commonName: item.commonName,
            organism: item.organism.text,
            lng: item.lon,
            sex: item.sex,
            locality: item.locality,
            accession: item.accession,
            organismPart: item.organismPart,
            lat: item.lat
        }));
    }

    ngAfterViewInit() {
        const routeParams = this.route.snapshot.paramMap;
        const organismId = routeParams.get('organismId');
        this._apiService.getDetailsData(organismId, 'data_portal').subscribe(
            data => {
                this.isLoadingResults = false;
                this.isRateLimitReached = data === null;

                this.organismData = data.results[0]['_source'];
                console.log('DATA', this.organismData);
                this.metadataData = new MatTableDataSource(this.organismData['records']);

                this.orgGeoList = this.transformGeoList(this.metadataData.filteredData);
                this.specGeoList = [];

                if (this.orgGeoList !== undefined && this.orgGeoList.length !== 0) {
                    this.geoLocation = true;
                }

                this.nbnatlas = this.organismData['nbnatlas'];

                if (this.nbnatlas != null) {
                    this.nbnatlasMapUrl = 'https://easymap.nbnatlas.org/Image?tvk=' +
                        this.nbnatlas.split('/')[4] + '&ref=0&w=400&h=600&b0fill=6ecc39&title=0' ;
                    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.nbnatlasMapUrl);
                    this.nbnatlasMapUrl = 'https://records.nbnatlas.org/occurrences/search?q=lsid:' +
                        this.nbnatlas.split('/')[4] + '+&nbn_loading=true&fq=-occurrence_status%3A%22absent%22#tab_mapView';
                }

                this.INSDC_ID = this.organismData['experiment'][0]['study_accession'];
                this.currentStatus = this.organismData['currentStatus'];

                this.metadataDataLength = data.results[0]['_source']['records'].length;

                if (data.results[0]['_source']['annotation'] && data.results[0]['_source']['annotation'].lenght !== 0) {
                    this.annotationData = new MatTableDataSource(data.results[0]['_source']['annotation']);
                    this.annotationDataLength = data.results[0]['_source']['annotation'].length;
                    this.annotationData.paginator = this.annotationPaginator;
                    this.annotationData.sort = this.annotationSort;
                    this.showData = true;
                } else {
                    this.annotationDataLength = 0;
                }

                if (data.results[0]['_source']['assemblies'] && data.results[0]['_source']['assemblies'].lenght !== 0) {
                    this.assembliesData = new MatTableDataSource(data.results[0]['_source']['assemblies']);
                    this.assembliesDataLength = data.results[0]['_source']['assemblies'].length;
                    this.assembliesData.paginator = this.assembliesPaginator;
                    this.assembliesData.sort = this.assembliesSort;
                    this.showData = true;
                } else {
                    this.assembliesDataLength = 0;
                }

                if (data.results[0]['_source']['experiment'] && data.results[0]['_source']['experiment'].lenght !== 0) {
                    this.filesData = new MatTableDataSource(data.results[0]['_source']['experiment']);
                    this.filesDataLength = data.results[0]['_source']['experiment'].length;
                    this.filesData.paginator = this.filesPaginator;
                    this.filesData.sort = this.filesSort;
                    this.showData = true;
                } else {
                    this.filesDataLength = 0;
                }

                if (data.results[0]['_source']['goat_info'] &&
                    data.results[0]['_source']['goat_info'].hasOwnProperty('attributes')) {
                    this.goatData = new MatTableDataSource(data.results[0]['_source']['goat_info']['attributes'])
                    this.goatDataLength = data.results[0]._source.goat_info?.attributes?.length;
                    this.goatDataLink = data.results[0]['_source']['goat_info']['url'];
                } else {
                    this.goatDataLength = 0;
                }

                this.metadataData.paginator = this.metadataPaginator;
                this.metadataData.sort = this.metadataSort;

                if (data.results[0]['_source']['records'].length > 0) {
                    this.showMetadata = true;
                }
                if (data.results[0]['_source']['genome_notes'] && data.results[0]['_source']['genome_notes'].length !== 0) {
                    this.showGenomeNote = true;
                }

                if (data.results[0]['_source']['symbionts_records'] !== undefined && data.results[0]['_source']['symbionts_records'].length) {
                    this.dataSourceSymbiontsRecords = new MatTableDataSource<any>(data.results[0]['_source']['symbionts_records']);
                    this.specSymbiontsTotalCount = data.results[0]['_source']['symbionts_records'] ? data.results[0]['_source']['symbionts_records'].length : 0;
                } else {
                    this.dataSourceSymbiontsRecords = new MatTableDataSource();
                    this.specSymbiontsTotalCount = 0;
                }


                if (data.results[0]['_source']['symbionts_assemblies'] !== undefined && data.results[0]['_source']['symbionts_assemblies'].length) {
                    this.dataSourceSymbiontsAssemblies = new MatTableDataSource<any>(data.results[0]['_source']['symbionts_assemblies']);
                    this.dataSourceSymbiontsAssembliesCount = data.results[0]['_source']['symbionts_assemblies'] ? data.results[0]['_source']['symbionts_assemblies'].length : 0;
                } else {
                    this.dataSourceSymbiontsAssemblies = new MatTableDataSource();
                    this.dataSourceSymbiontsAssembliesCount = 0;
                }

                this.countFilterFields();
                this.setupFilterPredicate();
                this.isDataLoaded = true;

            }
        );
    }

    applyFilter(event: Event, dataSource: MatTableDataSource<any>) {
        this.searchTerm = (event.target as HTMLInputElement).value.trim().toLowerCase();

        const combinedFilter = JSON.stringify({
            search: this.searchTerm,
            filters: this.activeFilters
        });

        dataSource.filter = combinedFilter;
        this.applyFilters();
    }

    getHumanReadableName(key: string) {
        return this.humanReadableColumns[key as keyof typeof this.humanReadableColumns];
    }

    keyInSpecialColumns(key: string) {
        return this.specialColumns.indexOf(key) !== -1;
    }

    getKeyFromSpecialColumns(key: string) {
        if (key) {
            const length = key.split("/").length;
            return key.split("/")[length - 1];
        } else {
            return null;
        }
    }

    getStudyLink(study_id: string) {
        return `https://www.ebi.ac.uk/ena/browser/view/${study_id}`;
    }

    getStyle(status: string) {
        if (status === 'Assemblies - Submitted') {
            return 'background-color: limegreen; color: black';
        } else {
            return 'background-color: yellow; color: black';
        }
    }

    getGenomeNoteData(data: any, key: string) {
        if (data && data.length !== 0) {
            return data[0][key];
        }
    }

    checkNagoyaProtocol(data: any): boolean {
        return data.hasOwnProperty('nagoya_protocol');
    }

    openPopup(imageUrl: string) {
        this.popupImage = imageUrl;
    }

    closePopup() {
        this.popupImage = null;
    }

    sanitizeHTML(content: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(content);
    }

    onMapLoad() {
        this.isMapLoading = false;
    }

    onMapError() {
        console.error('Error loading occurrences map image.');
        this.isMapLoading = false;
    }

    onTabChange(event: any) {
        if (event.tab.textLabel === 'Geo Location Maps') {
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        }
        if (event.tab.textLabel === 'Occurrences Map') {
            this.isMapLoading = true;
        }
    }

    applyFilters() {
        if (!this.metadataData) {
            console.warn("applyFilters()");
            return;
        }

        const combinedFilter = JSON.stringify({
            search: this.searchTerm,
            filters: this.activeFilters
        });

        this.metadataData.filter = combinedFilter;
        this.countFilterFields();
    }

    toggleFilter(field: keyof typeof this.activeFilters, value: string) {
        const index = this.activeFilters[field].indexOf(value);
        if (index !== -1) {
            this.activeFilters[field].splice(index, 1);
        } else {
            this.activeFilters[field].push(value);
        }
        this.selectedFilters = this.getSelectedFilterList();
        this.applyFilters();
    }

    clearFilter(field: keyof typeof this.activeFilters, value: string): void {
        this.activeFilters[field] = this.activeFilters[field].filter(v => v !== value);
        this.selectedFilters = this.getSelectedFilterList();
        this.applyFilters();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.activeFilters = {
            sex: [],
            organismPart: [],
            trackingSystem: []
        };
        this.selectedFilters = {};
        this.applyFilters();
    }

    countFilterFields() {
        if (!this.metadataData || !this.metadataData.filteredData) {
            return;
        }

        const filteredData = this.metadataData.filteredData;

        ['sex', 'organismPart', 'trackingSystem'].forEach(column => {
            const columnValues: { id: string, value: number }[] = [];
            const uniqueValues: Record<string, number> = {};

            filteredData.forEach((element: { [x: string]: string | number }) => {
                const value = element[column] as string | number;
                const valueStr = value ? value.toString() : "Unknown";
                uniqueValues[valueStr] = (uniqueValues[valueStr] || 0) + 1;
            });

            for (const key in uniqueValues) {
                columnValues.push({ id: key, value: uniqueValues[key] });
            }

            this.countedFilters[column] = columnValues;
        });

        ['sex', 'organismPart', 'trackingSystem'].forEach(filterKey => {
            this.updateVisibleFilters(filterKey);
        });
    }

    updateVisibleFilters(filterKey: string) {
        const filters = this.expandedFilters[filterKey]
            ? this.countedFilters[filterKey]
            : this.countedFilters[filterKey].slice(0, this.filtersLimit[filterKey]);

        this.visibleFilters[filterKey] = filters;
        this.filterHeight[filterKey] = Math.min(
            filters.length * this.filterItemSize,
            this.expandedFilters[filterKey] ? this.filterHeightMax : this.filterHeightDefault
        );
    }

    toggleFilterView(filterKey: string): void {
        this.expandedFilters[filterKey] = !this.expandedFilters[filterKey];
        this.updateVisibleFilters(filterKey);
    }

    isFilterActive(field: keyof typeof this.activeFilters, value: string): boolean {
        return this.activeFilters[field].includes(value);
    }

    setupFilterPredicate() {
        if (!this.metadataData) {
            console.warn("setupFilterPredicate()");
            return;
        }

        this.metadataData.filterPredicate = (data: any, filter: string) => {
            const parsedFilter = JSON.parse(filter);
            const searchTerm = parsedFilter.search.toLowerCase();
            const filters = parsedFilter.filters;

            const matchesFilters = Object.keys(filters).every(key => {
                return filters[key].length === 0 || filters[key].includes(data[key]);
            });

            const matchesSearch = Object.values(data).some(value =>
                String(value).toLowerCase().includes(searchTerm)
            );

            return matchesFilters && matchesSearch;
        };
    }

    getSelectedFilterList(): Record<string, string[]> {
        return Object.keys(this.activeFilters).reduce((acc, key) => {
            const values = this.activeFilters[key as keyof typeof this.activeFilters];
            if (values.length > 0) {
                acc[key] = values;
            }
            return acc;
        }, {} as Record<string, string[]>);
    }

    getSelectedFilterCount(): number {
        return Object.keys(this.getSelectedFilterList()).length;
    }

    generateTolidLink(data: any): string {
        const organismName = data.organism.split(' ').join('_');

        if (typeof data.tolid === 'string' && data.tolid.length > 0) {
            const clade = this.codes[data.tolid.charAt(0) as keyof typeof this.codes];
            return `https://tolqc.cog.sanger.ac.uk/darwin/${clade}/${organismName}`;
        }

        else if (Array.isArray(data.tolid) && data.tolid.length > 0 && typeof data.tolid[0] === 'string') {
            const clade = this.codes[data.tolid[0].charAt(0) as keyof typeof this.codes];
            return `https://tolqc.cog.sanger.ac.uk/darwin/${clade}/${organismName}`;
        }

        return '';
    }

    checkTolidExists(data: { tolid: string | any[] | null | undefined; show_tolqc: boolean; } | undefined) {
        return data != undefined && data.tolid != undefined && data.tolid != null && data.tolid.length > 0 &&
            data.show_tolqc === true;
    }

}
