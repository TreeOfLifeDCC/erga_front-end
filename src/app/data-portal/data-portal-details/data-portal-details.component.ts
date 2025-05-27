import {Component, OnInit, AfterViewInit, ViewChild, Input, ElementRef} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../api.service';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import {TitleCasePipe, SlicePipe, JsonPipe} from '@angular/common';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatTableExporterModule } from 'mat-table-exporter';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MapClusterComponent } from '../map-cluster/map-cluster.component';
import { MatColumnDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatFormField } from '@angular/material/form-field';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatCard, MatCardActions, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatInput } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import {MatButtonModule} from "@angular/material/button";
import {FormsModule} from "@angular/forms";

type FilterKey = 'sex' | 'organismPart' | 'trackingSystem';

interface FilterState {
    activeFilters: { [key in FilterKey]: string[] };
    countedFilters: Record<FilterKey, { id: string; value: number }[]>;
    expandedFilters: Record<FilterKey, boolean>;
    filtersLimit: Record<FilterKey, number>;
    searchTerm: string;
    selectedFilters: Record<FilterKey, string[]>;
    filterKeys: FilterKey[];
    data: MatTableDataSource<any>;
}


@Component({
    selector: 'app-data-portal-details',
    templateUrl: './data-portal-details.component.html',
    standalone: true,
    imports: [
        MatTableExporterModule,
        MatExpansionModule,
        RouterLink,
        MapClusterComponent,
        TitleCasePipe,
        FlexLayoutModule,
        MatIconModule,
        SlicePipe,
        MatProgressSpinner,
        MatTab,
        MatTabGroup,
        MatTable,
        MatPaginator,
        MatSort,
        MatColumnDef,
        MatFormField,
        MatFormFieldModule,
        MatChip,
        MatChipSet,
        MatCard,
        MatCardHeader,
        MatCardTitle,
        MatCardActions,
        MatInput,
        MatTableModule,
        MatButtonModule,
        FormsModule,
        JsonPipe
    ],
    styleUrls: ['./data-portal-details.component.css']
})
export class DataPortalDetailsComponent implements OnInit, AfterViewInit {
    organismData: any;
    metadataDisplayedColumns: string[] = ['accession', 'organism', 'commonName', 'sex', 'organismPart', 'trackingSystem'];
    annotationsDisplayedColumns: string[] = ['species', 'accession', 'annotation_gtf', 'annotation_gff3', 'proteins',
        'transcripts', 'softmasked_genome', 'repeat_library', 'other_data', 'view_in_browser'];
    assembliesDisplayedColumns: string[] = ['accession', 'version', 'assembly_name', 'description'];
    filesDisplayedColumns: string[] = ['study_accession', 'sample_accession', 'experiment_accession', 'run_accession',
        'tax_id', 'scientific_name', 'fastq_ftp', 'submitted_ftp', 'sra_ftp', 'library_construction_protocol'];
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

    specialColumns = ['fastq_ftp', 'submitted_ftp', 'sra_ftp'];
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


    dataSourceMetagenomesRecords: any;
    specMetagenomesTotalCount: number;

    dataSourceMetagenomesAssemblies: any;
    dataSourceMetagenomesAssembliesCount: number;



    @ViewChild('relatedmetagenomesRecordsPaginator') metagenomesRecordsPaginator: MatPaginator;
    @ViewChild('assembliesmetagenomesPaginator') assembliesmetagenomesPaginator: MatPaginator ;

    @ViewChild('relatedSymbiontsPaginator') symPaginator: MatPaginator | undefined;
    @ViewChild('assembliesSymbiontsPaginator') asSymPaginator: MatPaginator | undefined;

    isLoadingResults = true;
    isRateLimitReached = false;
    showMetadata = false;
    showData = false;
    showGenomeNote = false;
    geoLocation = false;
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

    filterGroups: { key: FilterKey; title: string }[] = [
        { key: 'sex', title: 'Sex' },
        { key: 'organismPart', title: 'Organism Part' },
        { key: 'trackingSystem', title: 'Tracking System' }
    ];

    organismFilterState: FilterState = {
        activeFilters: { sex: [], organismPart: [], trackingSystem: [] },
        countedFilters: { sex: [], organismPart: [], trackingSystem: [] },
        expandedFilters: { sex: false, organismPart: false, trackingSystem: false },
        filtersLimit: { sex: 3, organismPart: 3, trackingSystem: 3 },
        searchTerm: '',
        selectedFilters: { sex: [], organismPart: [], trackingSystem: [] },
        filterKeys: ['sex', 'organismPart', 'trackingSystem'],
        data: new MatTableDataSource<any>([])
    };

    symbiontsFilterState: FilterState = {
        activeFilters: { sex: [], organismPart: [], trackingSystem: [] },
        countedFilters: { sex: [], organismPart: [], trackingSystem: [] },
        expandedFilters: { sex: false, organismPart: false, trackingSystem: false },
        filtersLimit: { sex: 3, organismPart: 3, trackingSystem: 3 },
        searchTerm: '',
        selectedFilters: { sex: [], organismPart: [], trackingSystem: [] },
        filterKeys: ['sex', 'organismPart', 'trackingSystem'],
        data: new MatTableDataSource<any>([])
    };

    metagenomesFilterState: FilterState = {
        activeFilters: { sex: [], organismPart: [], trackingSystem: [] },
        countedFilters: { sex: [], organismPart: [], trackingSystem: [] },
        expandedFilters: { sex: false, organismPart: false, trackingSystem: false },
        filtersLimit: { sex: 3, organismPart: 3, trackingSystem: 3 },
        searchTerm: '',
        selectedFilters: { sex: [], organismPart: [], trackingSystem: [] },
        filterKeys: ['sex', 'organismPart', 'trackingSystem'],
        data: new MatTableDataSource<any>([])
    };


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
    currentStatus: string = '';

    @ViewChild("tabgroup", { static: false }) tabgroup: MatTabGroup;
    @ViewChild('metadataPaginator') metadataPaginator: MatPaginator;
    @ViewChild('metadataSort') metadataSort: MatSort;
    @ViewChild('annotationPaginator') annotationPaginator: MatPaginator;
    @ViewChild('annotationSort') annotationSort: MatSort;
    @ViewChild('assembliesPaginator') assembliesPaginator: MatPaginator;
    @ViewChild('assembliesSort') assembliesSort: MatSort;
    @ViewChild('filesPaginator') filesPaginator: MatPaginator;
    @ViewChild('filesSort') filesSort: MatSort;
    @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;

    constructor(private route: ActivatedRoute,
                private _apiService: ApiService,
                private sanitizer: DomSanitizer) { }

    ngOnInit(): void {
        this.organismFilterState.countedFilters = {
            sex: [],
            organismPart: [],
            trackingSystem: []
        };
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
                this.metadataData = new MatTableDataSource(this.organismData['records']);

                this.orgGeoList = this.transformGeoList(this.metadataData.filteredData);

                this.specGeoList = [];
                if (this.orgGeoList && this.orgGeoList.length !== 0) {
                    for (let i = 0; i < this.orgGeoList.length; i++) {
                        const { lat, lng } = this.orgGeoList[i];
                        if (lat !== 'not collected' && lat !== 'not provided' && lat !== null && lng !== null) {
                            this.geoLocation = true;
                            break;
                        }
                    }
                }

                this.nbnatlas = this.organismData['nbnatlas'];

                if (this.nbnatlas != null) {
                    this.nbnatlasMapUrl = 'https://easymap.nbnatlas.org/Image?tvk=' +
                        this.nbnatlas.split('/')[4] + '&ref=0&w=400&h=600&b0fill=6ecc39&title=0';
                    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.nbnatlasMapUrl);
                    this.nbnatlasMapUrl = 'https://records.nbnatlas.org/occurrences/search?q=lsid:' +
                        this.nbnatlas.split('/')[4] + '+&nbn_loading=true&fq=-occurrence_status%3A%22absent%22#tab_mapView';
                }

                this.INSDC_ID = (this.organismData['experiment']  && this.organismData['experiment'].length > 0 ) ? this.organismData['experiment'][0]['study_accession'] : '';
                this.currentStatus = this.organismData['currentStatus'];

                this.metadataDataLength = data.results[0]['_source']['records'].length;

                if (data.results[0]['_source']['annotation'] && data.results[0]['_source']['annotation'].length !== 0) {
                    this.annotationData = new MatTableDataSource(data.results[0]['_source']['annotation']);
                    this.annotationDataLength = data.results[0]['_source']['annotation'].length;
                    this.annotationData.paginator = this.annotationPaginator;
                    this.annotationData.sort = this.annotationSort;
                    this.showData = true;
                } else {
                    this.annotationDataLength = 0;
                }

                if (data.results[0]['_source']['assemblies'] && data.results[0]['_source']['assemblies'].length !== 0) {
                    this.assembliesData = new MatTableDataSource(data.results[0]['_source']['assemblies']);
                    this.assembliesDataLength = data.results[0]['_source']['assemblies'].length;
                    this.assembliesData.paginator = this.assembliesPaginator;
                    this.assembliesData.sort = this.assembliesSort;
                    this.showData = true;
                } else {
                    this.assembliesDataLength = 0;
                }

                if (data.results[0]['_source']['experiment'] && data.results[0]['_source']['experiment'].length !== 0) {
                    this.filesData = new MatTableDataSource(data.results[0]['_source']['experiment']);
                    this.filesDataLength = data.results[0]['_source']['experiment'].length;
                    this.filesData.paginator = this.filesPaginator;
                    this.filesData.sort = this.filesSort;
                    this.showData = true;
                } else {
                    this.filesDataLength = 0;
                }

                if (data.results[0]['_source']['goat_info'] && data.results[0]['_source']['goat_info'].hasOwnProperty('attributes')) {
                    this.goatData = new MatTableDataSource(data.results[0]['_source']['goat_info']['attributes']);
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

                if (data.results[0]['_source']['metagenomes_records'] !== undefined && data.results[0]['_source']['metagenomes_records'].length) {
                    this.dataSourceMetagenomesRecords = new MatTableDataSource<any>(data.results[0]['_source']['metagenomes_records']);
                    this.specMetagenomesTotalCount = data.results[0]['_source']['metagenomes_records'].length;
                    this.dataSourceMetagenomesRecords.paginator = this.metagenomesRecordsPaginator;
                    // this.annotationData.sort = this.annotationSort;
                } else {
                    this.dataSourceMetagenomesRecords = new MatTableDataSource();
                    this.specMetagenomesTotalCount = 0;
                }

                if (data.results[0]['_source']['metagenomes_assemblies'] !== undefined && data.results[0]['_source']['metagenomes_assemblies'].length) {
                    this.dataSourceMetagenomesAssemblies = new MatTableDataSource<any>(data.results[0]['_source']['metagenomes_assemblies']);
                    this.dataSourceMetagenomesAssembliesCount = data.results[0]['_source']['metagenomes_assemblies'] ? data.results[0]['_source']['metagenomes_assemblies'].length : 0;
                } else {
                    this.dataSourceMetagenomesAssemblies = new MatTableDataSource();
                    this.dataSourceMetagenomesAssembliesCount = 0;
                }



                this.organismFilterState.data = this.metadataData;
                this.symbiontsFilterState.data = this.dataSourceSymbiontsRecords;
                this.metagenomesFilterState.data = this.dataSourceMetagenomesRecords;

                this.countFilterFields('organism');
                this.countFilterFields('symbionts');
                this.setupFilterPredicate('organism');
                this.setupFilterPredicate('symbionts');
                this.setupFilterPredicate('metagenomes');
                this.countFilterFields('metagenomes');

                this.isDataLoaded = true;
        });
    }

    getHumanReadableName(key: string) {
        return this.humanReadableColumns[key as keyof typeof this.humanReadableColumns];
    }

    keyInSpecialColumns(key: string) {
        return this.specialColumns.indexOf(key) !== -1;
    }

    getKeyFromSpecialColumns(key: string) {
        if (key) {
            const parts = key.split("/");
            return parts[parts.length - 1];
        } else {
            return null;
        }
    }

    getStudyLink(study_id: string) {
        return `https://www.ebi.ac.uk/ena/browser/view/${study_id}`;
    }

    getStyle(status: string) {
        return status === 'Assemblies - Submitted'
            ? 'background-color: limegreen; color: black'
            : 'background-color: yellow; color: black';
    }

    getGenomeNoteData(data: any, key: string) {
        return data && data.length !== 0 ? data[0][key] : undefined;
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

    generateTolidLink(data: any): string {
        const organismName = data.organism.split(' ').join('_');
        if (typeof data.tolid === 'string' && data.tolid.length > 0) {
            const clade = this.codes[data.tolid.charAt(0) as keyof typeof this.codes];
            return `https://tolqc.cog.sanger.ac.uk/darwin/${clade}/${organismName}`;
        } else if (Array.isArray(data.tolid) && data.tolid.length > 0 && typeof data.tolid[0] === 'string') {
            const clade = this.codes[data.tolid[0].charAt(0) as keyof typeof this.codes];
            return `https://tolqc.cog.sanger.ac.uk/darwin/${clade}/${organismName}`;
        }
        return '';
    }

    checkTolidExists(data: { tolid: string | any[] | null | undefined; show_tolqc: boolean; } | undefined) {
        return data && data.tolid && data.tolid.length > 0 && data.show_tolqc === true;
    }

    applySearchFilter(event: Event, dataSource: MatTableDataSource<any>) {
        const searchTerm = (event.target as HTMLInputElement).value.trim().toLowerCase();
        dataSource.filter = JSON.stringify({ search: searchTerm });
    }

    // @ts-ignore
    getFilterState(type: 'organism' | 'symbionts' | 'metagenomes'): FilterState {
        if (type === 'organism'){
            return this.organismFilterState;
        }else  if (type === 'symbionts'){
            return this.symbiontsFilterState;
        }else if (type === 'metagenomes'){
            return this.metagenomesFilterState;
        }
    }

    applyFilter(type: 'organism' | 'symbionts' | 'metagenomes', event: Event, dataSource: MatTableDataSource<any>) {
        const state = this.getFilterState(type);
        state.searchTerm = (event.target as HTMLInputElement).value.trim().toLowerCase();
        const combinedFilter = JSON.stringify({
            search: state.searchTerm,
            filters: state.activeFilters
        });
        dataSource.filter = combinedFilter;
        this.applyFilters(type);
    }

    applyFilters(type: 'organism' | 'symbionts' | 'metagenomes') {
        const state = this.getFilterState(type);
        if (!state.data) {
            return;
        }
        const combinedFilter = JSON.stringify({
            search: state.searchTerm,
            filters: state.activeFilters
        });
        state.data.filter = combinedFilter;
        this.countFilterFields(type);
    }

    toggleFilter(type: 'organism' | 'symbionts' | 'metagenomes', field: FilterKey, value: string) {
        const state = this.getFilterState(type);
        const index = state.activeFilters[field].indexOf(value);
        if (index !== -1) {
            state.activeFilters[field].splice(index, 1);
        } else {
            state.activeFilters[field].push(value);
        }
        state.selectedFilters = this.getSelectedFilterList(state.activeFilters);
        this.applyFilters(type);
    }

    clearFilter(type: 'organism' | 'symbionts' | 'metagenomes', field: FilterKey, value: string): void {
        const state = this.getFilterState(type);
        state.activeFilters[field] = state.activeFilters[field].filter(v => v !== value);
        state.selectedFilters = this.getSelectedFilterList(state.activeFilters);
        this.applyFilters(type);
    }

    clearFilters(type: 'organism' | 'symbionts' | 'metagenomes'): void {
        const state = this.getFilterState(type);
        state.searchTerm = '';
        state.activeFilters = { sex: [], organismPart: [], trackingSystem: [] };
        state.selectedFilters = { sex: [], organismPart: [], trackingSystem: [] };
        this.applyFilters(type);
    }

    countFilterFields(type: 'organism' | 'symbionts' | 'metagenomes') {
        const state = this.getFilterState(type);
        if (!state.data) { return; }
        state.filterKeys.forEach(column => {
            const uniqueValues: Record<string, number> = {};
            state.data.filteredData.forEach((element: { [x: string]: string | number }) => {
                const value = element[column];
                if (value) {
                    const valueStr = value.toString();
                    uniqueValues[valueStr] = (uniqueValues[valueStr] || 0) + 1;
                }
            });
            state.countedFilters[column] = Object.keys(uniqueValues).map(key => ({
                id: key,
                value: uniqueValues[key]
            }));
        });
    }

    toggleFilterView(type: 'organism' | 'symbionts' | 'metagenomes', filterKey: FilterKey): void {
        const state = this.getFilterState(type);
        state.expandedFilters[filterKey] = !state.expandedFilters[filterKey];
    }

    isFilterActive(type: 'organism' | 'symbionts' | 'metagenomes', field: FilterKey, value: string): boolean {
        return this.getFilterState(type).activeFilters[field].includes(value);
    }

    setupFilterPredicate(type: 'organism' | 'symbionts' | 'metagenomes') {
        const state = this.getFilterState(type);
        if (!state.data) {
            return;
        }
        state.data.filterPredicate = (data: any, filter: string) => {
            const parsedFilter = JSON.parse(filter);
            const searchTerm = parsedFilter.search.toLowerCase();
            const filters = parsedFilter.filters;
            const matchesFilters = Object.keys(filters).every(key =>
                filters[key].length === 0 || filters[key].includes(data[key])
            );
            const matchesSearch = Object.values(data).some(value =>
                String(value).toLowerCase().includes(searchTerm)
            );
            return matchesFilters && matchesSearch;
        };
    }

    getSelectedFilterList(activeFilters: { [key in FilterKey]: string[] }): Record<FilterKey, string[]> {
        return Object.keys(activeFilters).reduce((acc, key) => {
            const k = key as FilterKey;
            if (activeFilters[k].length > 0) {
                acc[k] = activeFilters[k];
            }
            return acc;
        }, {} as Record<FilterKey, string[]>);
    }

    getSelectedFilterCount(type: 'organism' | 'symbionts' | 'metagenomes'): number {
        const state = this.getFilterState(type);
        return Object.keys(this.getSelectedFilterList(state.activeFilters)).length;
    }

    generateUrl(link: string){
        if (!link.startsWith('http')) {
           return "https://" + link;
        }
        return link;
    }
}
