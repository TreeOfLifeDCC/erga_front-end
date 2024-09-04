import {Component, OnInit} from '@angular/core';
import {
    MatSidenavContainer,
    MatSidenavContent
} from "@angular/material/sidenav";
import {MatToolbar} from "@angular/material/toolbar";

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css'],
    imports: [
        MatSidenavContent,
        MatSidenavContainer,
        MatToolbar
    ],
    standalone: true
})
export class FooterComponent implements OnInit {

    constructor() {
    }

    ngOnInit(): void {
    }

}
