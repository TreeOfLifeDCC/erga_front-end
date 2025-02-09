import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ApiService} from "../api.service";
import {MatCard, MatCardActions, MatCardTitle} from "@angular/material/card";
import {FlexLayoutModule} from "@ngbracket/ngx-layout";
import {MatDivider} from "@angular/material/divider";

@Component({
    selector: 'app-specimen-details',
    templateUrl: './specimen-details.component.html',
    standalone: true,
    imports: [
        MatCard,
        MatCardTitle,
        MatCardActions,
        FlexLayoutModule,
        MatDivider
    ],
    styleUrls: ['./specimen-details.component.css']
})
export class SpecimenDetailsComponent implements OnInit {
    data: any;

    constructor(private route: ActivatedRoute, private _apiService: ApiService) {
    }

    ngOnInit(): void {
        const routeParams = this.route.snapshot.paramMap;
        const specimenId = routeParams.get('specimenId');
        this._apiService.getDetailsData(specimenId, 'specimens_test').subscribe(
            data => {
                this.data = data['results'][0]['_source'];
            }
        );
    }

}
