import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, RouterLink} from "@angular/router";
import {ApiService} from "../api.service";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {
    MatCell,
    MatCellDef, MatColumnDef, MatHeaderCell,
    MatHeaderCellDef, MatHeaderRow,
    MatHeaderRowDef, MatNoDataRow, MatRow,
    MatRowDef,
    MatTable,
    MatTableDataSource
} from "@angular/material/table";
import {MatCard, MatCardActions, MatCardTitle} from "@angular/material/card";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {NgForOf, NgIf} from "@angular/common";
import {ImageSliderComponent} from "../image-slider/image-slider.component";

@Component({
    selector: 'app-organism-details',
    templateUrl: './organism-details.component.html',
    standalone: true,
    imports: [
        MatCard,
        MatCardTitle,
        MatCardActions,
        MatPaginator,
        MatProgressSpinner,
        RouterLink,
        MatTable,
        NgIf,
        NgForOf,
        MatHeaderCellDef,
        MatCellDef,
        MatHeaderRowDef,
        MatRowDef,
        MatNoDataRow,
        MatColumnDef,
        MatHeaderCell,
        MatCell,
        MatHeaderRow,
        MatRow,
        ImageSliderComponent
    ],
    styleUrls: ['./organism-details.component.css']
})
export class OrganismDetailsComponent implements OnInit, AfterViewInit {
    data: any;
    specimensData: any;
    specimensDataLength: number | undefined;
    specimensDisplayedColumns: string[] = ['source', 'type', 'target'];

    resultsLength = 0;
    isLoadingResults = true;
    isRateLimitReached = false;
    pageIndex: number = 0;

    slides: any[];

    @ViewChild(MatPaginator) paginator: MatPaginator | undefined;
    @ViewChild(MatSort) sort: MatSort | undefined;
    protected specimensDetails: boolean;

    constructor(private route: ActivatedRoute, private _apiService: ApiService) { }

    ngOnInit(): void {
    }

    ngAfterViewInit() {
        const routeParams = this.route.snapshot.paramMap;
        const organismId = routeParams.get('organismId');
        this._apiService.getDetailsData(organismId, 'specimens').subscribe(
            data => {
                if (data && data.results && data.results.length > 0 && data.results[0]._source) {
                    this.data = data.results[0]._source;
                    this.specimensDetails = true;
                } else {
                    this.data = { accession: organismId };
                    this.specimensDetails = false;
                }
                this.isLoadingResults = false;
                this.isRateLimitReached = data === null;

                this.specimensData = new MatTableDataSource(this.data['relationships']);
                if (this.data['relationships']) {
                    this.specimensDataLength = this.data['relationships'].length;
                } else {
                    this.specimensDataLength = 0;
                }
                this.specimensData.paginator = this.paginator;
                this.specimensData.sort = this.sort;

                this.slides = this.generateSlides(this.data);
            }
        );
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.specimensData.filter = filterValue.trim().toLowerCase();
        if (this.specimensData.paginator) {
            this.specimensData.paginator.firstPage();
        }
    }

    private generateSlides(data: any) {
        console.log(data);
        const output = [];
        const arr = data.images;
        if (arr!== undefined) {
            for (let i = 0; i < arr.length; i++) {
                const obj = {url: encodeURI(arr[i])
                        .replace('(', '%28')
                        .replace(')', '%29')};
                output.push(obj);
            }
        }

        console.log(output);
        return output;
    }
}
