import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ApiService} from "../../api.service";
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {MatPaginator} from "@angular/material/paginator";
import {merge, of as observableOf} from "rxjs";
import {catchError, map, startWith, switchMap} from "rxjs/operators";
import {keyframes} from "@angular/animations";

@Component({
  selector: 'app-data-portal-details',
  templateUrl: './data-portal-details.component.html',
  styleUrls: ['./data-portal-details.component.css']
})
export class DataPortalDetailsComponent implements OnInit, AfterViewInit {
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

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  showMetadata = false;
  showData = false;
  showGenomeNote = false;

  @ViewChild('metadataPaginator') metadataPaginator: MatPaginator;
  @ViewChild('metadataSort') metadataSort: MatSort;

  @ViewChild('annotationPaginator') annotationPaginator: MatPaginator;
  @ViewChild('annotationSort') annotationSort: MatSort;

  @ViewChild('assembliesPaginator') assembliesPaginator: MatPaginator;
  @ViewChild('assembliesSort') assembliesSort: MatSort;

  @ViewChild('filesPaginator') filesPaginator: MatPaginator;
  @ViewChild('filesSort') filesSort: MatSort;

  constructor(private route: ActivatedRoute, private _apiService: ApiService) {}

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    const routeParams = this.route.snapshot.paramMap;
    const organismId = routeParams.get('organismId');
    this._apiService.getDetailsData(organismId).subscribe(
      data => {
        this.isLoadingResults = false;
        this.isRateLimitReached = data === null;

        this.organismData = data.results[0]['_source'];
        this.metadataData = new MatTableDataSource(data.results[0]['_source']['records']);
        this.metadataDataLength = data.results[0]['_source']['records'].length;

        this.annotationData = new MatTableDataSource(data.results[0]['_source']['annotation']);
        this.annotationDataLength = data.results[0]['_source']['annotation'].length;

        this.assembliesData = new MatTableDataSource(data.results[0]['_source']['assemblies']);
        this.assembliesDataLength = data.results[0]['_source']['assemblies'].length;

        this.filesData = new MatTableDataSource(data.results[0]['_source']['experiment']);
        this.filesDataLength = data.results[0]['_source']['experiment'].length;

        this.goatData = new MatTableDataSource(data.results[0]['_source']['goat_info']['attributes'])
        this.goatDataLength = data.results[0]['_source']['goat_info']['attributes'].length;
        this.goatDataLink = data.results[0]['_source']['goat_info']['url'];


        this.metadataData.paginator = this.metadataPaginator;
        this.metadataData.sort = this.metadataSort;

        this.annotationData.paginator = this.annotationPaginator;
        this.annotationData.sort = this.annotationSort;

        this.assembliesData.paginator = this.assembliesPaginator;
        this.assembliesData.sort = this.assembliesSort;

        this.filesData.paginator = this.filesPaginator;
        this.filesData.sort = this.filesSort;

        if (data.results[0]['_source']['records'].length > 0) {
          this.showMetadata = true;
        }
        if (data.results[0]['_source']['annotation'].length > 0 ||
          data.results[0]['_source']['assemblies'].length > 0 || data.results[0]['_source']['experiment'].length > 0) {
          this.showData = true;
        }
        if (data.results[0]['_source']['genome_notes'] && data.results[0]['_source']['genome_notes'].length !== 0) {
          this.showGenomeNote = true;
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

  generateTolidLink(data: any) {
    const organismName = data.organism.split(' ').join('_');
    const firstChar: string = data.tolid.charAt(0);
    const clade = this.codes[firstChar as keyof typeof this.codes];
    return `https://tolqc.cog.sanger.ac.uk/darwin/${clade}/${organismName}`;
  }

}
