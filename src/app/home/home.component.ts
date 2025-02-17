import {Component, OnInit} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {ApiService} from "../api.service";
import {MatChip, MatChipSet} from "@angular/material/chips";
import {
    MatCard,
    MatCardActions,
    MatCardSubtitle,
    MatCardTitle
} from "@angular/material/card";
import {BannerComponent} from "../banner/banner.component";
import {MatAnchor, MatButton} from "@angular/material/button";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    imports: [
        MatChip,
        MatChipSet,
        RouterLink,
        MatCard,
        MatCardTitle,
        MatCardActions,
        MatCardSubtitle,
        BannerComponent,
        MatButton,
        MatAnchor
    ],
    standalone: true
})
export class HomeComponent implements OnInit {
    data: any;
    status_keys: string[] = [];
    projects_keys: string[] = [];
    phylogeny_keys: string[] = [];

    constructor(private _router: Router, private _apiService: ApiService) {
    }

    ngOnInit(): void {
        this._apiService.getDetailsData('summary', 'summary_test').subscribe(data => {
            this.data = data['results'][0]['_source'];
            this.status_keys = Object.keys(this.data.status);
            this.projects_keys = Object.keys(this.data.projects);
            this.phylogeny_keys = Object.keys(this.data.phylogeny);
        });
    }


    getData(data: any, key: string) {
        if (data)
            return data[key];
    }

    getQueryParams(idx: number, key: string) {
        return { [idx]: key };
    }

}
