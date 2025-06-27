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
import {MatLine} from "@angular/material/core";
import {MatList, MatListItem} from "@angular/material/list";

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
        JsonPipe,
        MatLine,
        MatList,
        MatListItem
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
    showMetagenomes= false;
    nbnatlas: any;
    nbnatlasMapUrl: string;
    @Input() height = 200;
    @Input() width = 200;
    @Input() loader = '../../assets/200.gif';
    isLoading: boolean;
    url: SafeResourceUrl;
    isMapLoading: boolean = true;
    isDataLoaded: boolean = false;

    aggregations : any;
    activeFilters:any = [];
    searchText = '';
    searchSymbiontsText = '';
    searchRelatedmetaGenomesText='';
    filters = {
        sex: {},
        trackingSystem: {},
        organismPart: {}
    };

    showAllFilters = {
        metadataTab: {
            sex: false,
            organismPart: false,
            trackingSystem: false,
        },
        symbiontsTab: {
            sex: false,
            organismPart: false,
            trackingSystem: false,
        },
        metagenomesTab: {
            sex: false,
            organismPart: false,
            trackingSystem: false,
        }
    };

    metadataSexFilters: any = [];
    metadataTrackingSystemFilters: any  = [];
    metadataOrganismPartFilters: any= [];

    symbiontsSexFilters: any = [];
    symbiontsTrackingSystemFilters: any = [];
    symbiontsOrganismPartFilters: any = [];

    metagenomesSexFilters: any = [];
    metagenomesTrackingSystemFilters: any = [];
    metagenomesOrganismPartFilters: any = [];

    filterJson = {
        sex: '',
        organismPart: '',
        trackingSystem: '',
        search: ''
    };
    metagenomesRecordsTotalCount: number | undefined;
    @ViewChild('metagenomesRecordsPaginator') metagenomesPaginator: MatPaginator  | undefined;
    @ViewChild('metagenomesRecordsSort') metagenomesSort: MatSort  | undefined;
    @ViewChild('assembliesMetagenomesPaginator') assembliesMetPaginator: MatPaginator  | undefined;
    @ViewChild('assembliesMetagenomesSort') assembliesMetSort: MatSort | undefined;

    @ViewChild('relatedSymbiontsSort') relatedSymbiontsSort: MatSort  | undefined;
    @ViewChild('assembliesSymbiontsSort') assembliesSymbiontsSort: MatSort  | undefined;




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
        this._apiService.getDetailsData(organismId, 'data_portal_test').subscribe(
            data => {
                this.isLoadingResults = false;
                this.isRateLimitReached = data === null;
                this.aggregations = data.aggregations;
                this.organismData = data.results[0]['_source'];
                this.getFilters();
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
                    this.annotationData = new MatTableDataSource();
                    this.annotationDataLength = 0;
                }

                if (data.results[0]['_source']['assemblies'] && data.results[0]['_source']['assemblies'].length !== 0) {
                    this.assembliesData = new MatTableDataSource(data.results[0]['_source']['assemblies']);
                    this.assembliesDataLength = data.results[0]['_source']['assemblies'].length;
                    this.assembliesData.paginator = this.assembliesPaginator;
                    this.assembliesData.sort = this.assembliesSort;
                    this.showData = true;
                } else {
                    this.assembliesData = new MatTableDataSource();
                    this.assembliesDataLength = 0;
                }

                if (data.results[0]['_source']['experiment'] && data.results[0]['_source']['experiment'].length !== 0) {
                    this.filesData = new MatTableDataSource(data.results[0]['_source']['experiment']);
                    this.filesDataLength = data.results[0]['_source']['experiment'].length;
                    this.filesData.paginator = this.filesPaginator;
                    this.filesData.sort = this.filesSort;
                    this.showData = true;
                } else {
                    this.filesData = new MatTableDataSource();
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
                    // this.dataSourceMetagenomesRecords.paginator = this.metagenomesRecordsPaginator;
                    this.showMetagenomes = true;
                    // this.annotationData.sort = this.annotationSort;
                } else {
                    this.dataSourceMetagenomesRecords = new MatTableDataSource();
                    // this.dataSourceMetagenomesRecords.paginator = this.metagenomesRecordsPaginator;
                    this.specMetagenomesTotalCount = 0;
                }

                if (data.results[0]['_source']['metagenomes_assemblies'] !== undefined && data.results[0]['_source']['metagenomes_assemblies'].length) {
                    this.dataSourceMetagenomesAssemblies = new MatTableDataSource<any>(data.results[0]['_source']['metagenomes_assemblies']);
                    this.dataSourceMetagenomesAssembliesCount = data.results[0]['_source']['metagenomes_assemblies'] ? data.results[0]['_source']['metagenomes_assemblies'].length : 0;
                } else {
                    this.dataSourceMetagenomesAssemblies = new MatTableDataSource();
                    this.dataSourceMetagenomesAssembliesCount = 0;
                }




                setTimeout(() => {
                    this.assembliesData.paginator = this.assembliesPaginator;
                    this.assembliesData.sort = this.assembliesSort;
                    this.filesData.paginator = this.filesPaginator;
                    this.filesData.sort = this.filesSort;

                    this.dataSourceMetagenomesAssemblies.paginator = this.assembliesMetPaginator;
                    this.dataSourceMetagenomesAssemblies.sort = this.assembliesMetSort;
                    this.dataSourceMetagenomesRecords.paginator = this.metagenomesPaginator;
                    this.dataSourceMetagenomesRecords.sort = this.metagenomesSort;

                    this.metadataData.paginator = this.metadataPaginator;
                    this.metadataData.sort = this.metadataSort;
                    this.annotationData.paginator = this.annotationPaginator;
                    this.annotationData.sort = this.annotationSort;
                }, 50)

                this.isDataLoaded = true;
        });


    }

    getFilters() {
        this.metadataSexFilters = this.aggregations.metadata_filters.sex_filter.buckets;
        this.metadataTrackingSystemFilters = this.aggregations.metadata_filters.tracking_status_filter.buckets;
        this.metadataOrganismPartFilters = this.aggregations.metadata_filters.organism_part_filter.buckets;

        this.symbiontsSexFilters = this.aggregations.symbionts_filters.sex_filter.buckets;
        this.symbiontsTrackingSystemFilters = this.aggregations.symbionts_filters.tracking_status_filter.buckets;
        this.symbiontsOrganismPartFilters = this.aggregations.symbionts_filters.organism_part_filter.buckets;

        this.metagenomesSexFilters = this.aggregations.metagenomes_filters.sex_filter.buckets;
        this.metagenomesTrackingSystemFilters = this.aggregations.metagenomes_filters.tracking_status_filter.buckets;
        this.metagenomesOrganismPartFilters = this.aggregations.metagenomes_filters.
            organism_part_filter.buckets;
    }

    applyFilter(label: string, filterValue: string, dataSource: MatTableDataSource<any>, tabName: string): void {
        // reset showAllFilters
        this.showAllFilters = {
            metadataTab: { sex: false, organismPart: false, trackingSystem: false },
            symbiontsTab: { sex: false, organismPart: false, trackingSystem: false },
            metagenomesTab: { sex: false, organismPart: false, trackingSystem: false }
        };

        // @ts-ignore
        const index = this.activeFilters.indexOf(filterValue);
        this.createFilterJson(label, filterValue, dataSource);
        if (index !== -1) {
            this.removeFilter(filterValue, dataSource, tabName);
        } else {
            if (label !== 'search') {
                // @ts-ignore
                this.activeFilters.push(filterValue);
            }

            dataSource.filter = JSON.stringify(this.filterJson);
            if (tabName === 'metadataTab') {
                this.generateFilters(dataSource.filteredData, 'metadata');
            } else if (tabName === 'symbiontsTab') {
                this.generateFilters(dataSource.filteredData, 'symbionts');
            } else if (tabName === 'metagenomesTab') {
                this.generateFilters(dataSource.filteredData, 'metagenomes');
            }
        }
    }

    generateFilters(data: any, filterType: string) {
        const filters = {
            sex: {},
            trackingSystem: {},
            organismPart: {},
        };

        // @ts-ignore
        this[`${filterType}SexFilters`] = [];
        // @ts-ignore
        this[`${filterType}TrackingSystemFilters`] = [];
        // @ts-ignore
        this[`${filterType}OrganismPartFilters`] = [];

        // generate filter counts
        for (const item of data) {
            if (item.sex != null) {
                // @ts-ignore
                filters.sex[item.sex] = (filters.sex[item.sex] || 0) + 1;
            }
            if (item.trackingSystem != null) {
                // @ts-ignore
                filters.trackingSystem[item.trackingSystem] = (filters.trackingSystem[item.trackingSystem] || 0) + 1;
            }
            if (item.organismPart != null) {
                // @ts-ignore
                filters.organismPart[item.organismPart] = (filters.organismPart[item.organismPart] || 0) + 1;
            }
        }

        const createFilterArray = (filterObj: { [s: string]: unknown; } | ArrayLike<unknown>) =>
            Object.entries(filterObj).map(([key, doc_count]) => ({key, doc_count}));

        // @ts-ignore
        this[`${filterType}SexFilters`] = createFilterArray(filters.sex);
        // @ts-ignore
        this[`${filterType}TrackingSystemFilters`] = createFilterArray(filters.trackingSystem);
        // @ts-ignore
        this[`${filterType}OrganismPartFilters`] = createFilterArray(filters.organismPart);
    }


    removeFilter(filter: string, dataSource: MatTableDataSource<any>, tabName: string) {
        if (filter !== undefined) {
            // @ts-ignore
            const filterIndex = this.activeFilters.indexOf(filter);
            if (this.activeFilters.length !== 0) {
                this.spliceFilterArray(filter);
                this.activeFilters.splice(filterIndex, 1);
                dataSource.filter = JSON.stringify(this.filterJson);
                if (tabName === 'metadataTab') {
                    this.generateFilters(dataSource.filteredData, 'metadata');
                } else if (tabName === 'symbiontsTab') {
                    this.generateFilters(dataSource.filteredData, 'symbionts');
                }else if (tabName === 'metagenomesTab') {
                    this.generateFilters(dataSource.filteredData, 'metagenomes');
                }

            } else {
                this.filterJson.sex = '';
                this.filterJson.organismPart = '';
                this.filterJson.trackingSystem = '';
                dataSource.filter = JSON.stringify(this.filterJson);
                // this.getBiosampleById();
            }
        }
    }

    spliceFilterArray(filter: string) {
        if (this.filterJson.sex === filter) {
            this.filterJson.sex = '';
        } else if (this.filterJson.organismPart === filter) {
            this.filterJson.organismPart = '';
        } else if (this.filterJson.trackingSystem === filter) {
            this.filterJson.trackingSystem = '';
        }
    }

    symbiontsAssembliesSearch(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSourceSymbiontsAssemblies.filter = filterValue.trim().toLowerCase();
    }

    metagenomesAssembliesSearch(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSourceMetagenomesAssemblies.filter = filterValue.trim().toLowerCase();
    }

    createFilterJson(key:any, value:any, dataSource:any) {
        if (key === 'sex') {
            this.filterJson.sex = value;
        } else if (key === 'organismPart') {
            this.filterJson.organismPart = value;
        } else if (key === 'trackingSystem') {
            this.filterJson.trackingSystem = value;
        } else if (key === 'search') {
            this.filterJson.search = value.toLowerCase();
        }

        dataSource.filterPredicate = (data:any, filter:any): boolean => {
            const filterObj: {
                sex: string,
                organismPart: string,
                trackingSystem: string,
                search: string
            } = JSON.parse(filter);

            const sex = !filterObj.sex || data.sex === filterObj.sex;
            const organismPart = !filterObj.organismPart || data.organismPart === filterObj.organismPart;
            const trackingSystem = !filterObj.trackingSystem || data.trackingSystem === filterObj.trackingSystem;

            // apply text search on fields
            const searchText = filterObj.search?.toLowerCase() || '';
            const searchMatch = !searchText ||
                data.sex?.toLowerCase().includes(searchText) ||
                data.organismPart?.toLowerCase().includes(searchText) ||
                data.trackingSystem?.toLowerCase().includes(searchText) ||
                data.accession?.toLowerCase().includes(searchText) ||
                data.commonName?.toLowerCase().includes(searchText);

            return sex && organismPart && trackingSystem && searchMatch;
        };
    }
    getSearchResults(dataType: string) {

        if (dataType === 'relatedOrganisms') {
            this.applyFilter('search', this.searchText, this.metadataData, 'metadataTab');
        }

        if (dataType === 'relatedSymbionts') {
            this.applyFilter('search', this.searchSymbiontsText, this.dataSourceSymbiontsRecords, 'symbiontsTab');
        }
        if (dataType === 'relatedMetaGenomes') {
            this.applyFilter('search', this.searchRelatedmetaGenomesText, this.dataSourceMetagenomesRecords, 'metagenomesTab');
        }

    }



    resetDataset(tabName: string){
        this.activeFilters = [];
        this.searchText = '';
        this.searchSymbiontsText = '';
        this.searchRelatedmetaGenomesText = '';
        this.filterJson = {
            sex: '',
            organismPart: '',
            trackingSystem: '',
            search: ''
        };
        if (tabName === 'metadataTab' || tabName== 'Metadata') {
            this.metadataData.filterPredicate = (data: any, filter: any) => true;
            this.metadataData.filter = '';
            this.generateFilters(this.metadataData.filteredData, 'metadata' );
        } else if (tabName === 'symbiontsTab' || tabName== 'Symbionts') {
            this.dataSourceSymbiontsRecords.filterPredicate = (data: any, filter:any) => true;
            this.dataSourceSymbiontsRecords.filter = '';
            this.generateFilters(this.dataSourceSymbiontsRecords.filteredData, 'symbionts');
        } else if (tabName === 'metagenomesTab' || tabName== 'Metagenomes') {
            this.dataSourceMetagenomesRecords.filterPredicate = (data: any, filter:any) => true;
            this.dataSourceMetagenomesRecords.filter = '';
            this.generateFilters(this.dataSourceMetagenomesRecords.filteredData, 'metagenomes');
        }
    }


    toggleFilter(key1: string, key2: string): void {
        // @ts-ignore
        this.showAllFilters[key1][key2] = !this.showAllFilters[key1][key2];
    }

    // @ts-ignore
    checkFilterIsActive(filter: string) {
        // @ts-ignore
        if (this.activeFilters.indexOf(filter) !== -1) {
            return 'background-color: #A8BAA8; color: white;';
            ;
        }
    }
    getHumanReadableName(key: string) {
        return this.humanReadableColumns[key as keyof typeof this.humanReadableColumns];
    }

    keyInSpecialColumns(key: string) {
        return this.specialColumns.indexOf(key) !== -1;
    }


    tabClick({$event}: { $event: any }) {
        this.resetDataset($event.tab.textLabel);
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


    getSelectedFilterList(activeFilters: { [key in FilterKey]: string[] }): Record<FilterKey, string[]> {
        return Object.keys(activeFilters).reduce((acc, key) => {
            const k = key as FilterKey;
            if (activeFilters[k].length > 0) {
                acc[k] = activeFilters[k];
            }
            return acc;
        }, {} as Record<FilterKey, string[]>);
    }


    assembliesSearch(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.assembliesData.filter = filterValue.trim().toLowerCase();
    }

    filesSearch(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.filesData.filter = filterValue.trim().toLowerCase();
    }


    generateUrl(link: string){
        if (!link.startsWith('http')) {
           return "https://" + link;
        }
        return link;
    }
}
