import {Component, OnInit} from '@angular/core';
import {DynamicScriptLoaderService} from './services/dynamic-script-loader.service';
import {ActivatedRoute} from "@angular/router";

@Component({
    selector: 'app-phylogeny',
    templateUrl: './phylogeny.component.html',
    styleUrls: ['./phylogeny.component.css'],
    standalone: true,
    providers: [DynamicScriptLoaderService]
})
export class PhylogenyComponent implements OnInit {

    constructor(private dynamicScriptLoader: DynamicScriptLoaderService,) {
        this.loadScripts();
    }

    ngOnInit(): void {
    }

    private loadScripts() {
        // You can load multiple scripts by just providing the key as argument into load method of the service
        this.dynamicScriptLoader.load('d3min', 'd3tree', 'autocomplete').then(data => {
            // Script Loaded Successfully
        }).catch(error => console.log(error));
    }

}
