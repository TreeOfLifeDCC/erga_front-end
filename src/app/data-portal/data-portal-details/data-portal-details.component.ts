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
import {FlexLayoutModule} from "@angular/flex-layout";
import {MatTableExporterModule} from "mat-table-exporter";
import {MatExpansionPanel} from "@angular/material/expansion";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {MapClusterComponent} from "../map-cluster/map-cluster.component";
import {SafeResourceUrl} from "@angular/platform-browser";

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
        FlexLayoutModule,
        NgForOf,
        MatLabel,
        MatFormField,
        MatTableExporterModule,
        MatExpansionModule,
        MatExpansionPanel,
        MatTableExporterModule,
        RouterLink,
        MapClusterComponent
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

    resultsLength = 0;
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
            }
        );
    }

    applyFilter(event: Event, dataSource: string) {
        const filterValue = (event.target as HTMLInputElement).value;
        if (dataSource === 'metadata') {
            this.metadataData.filter = filterValue.trim().toLowerCase();
            if (this.metadataData.paginator) {
                this.metadataData.paginator.firstPage();
            }
        } else if (dataSource === 'annotation') {
            this.annotationData.filter = filterValue.trim().toLowerCase();
            if (this.annotationData.paginator) {
                this.annotationData.paginator.firstPage();
            }
        } else if (dataSource === 'assemblies') {
            this.assembliesData.filter = filterValue.trim().toLowerCase();
            if (this.assembliesData.paginator) {
                this.assembliesData.paginator.firstPage();
            }
        } else if (dataSource === 'files') {
            this.filesData.filter = filterValue.trim().toLowerCase();
            if (this.filesData.paginator) {
                this.filesData.paginator.firstPage();
            }
        }
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

}
