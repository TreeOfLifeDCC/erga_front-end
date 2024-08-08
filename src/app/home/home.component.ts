import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router, NavigationEnd, RouterLink} from "@angular/router";
import {ApiService} from "../api.service";
import {MatChip, MatChipSet} from "@angular/material/chips";
import {MatCard, MatCardActions, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
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
export class HomeComponent implements OnInit, OnDestroy {
  private twitter: any;
  data: any;

  constructor(private _router: Router, private _apiService: ApiService) {
    this.initTwitterWidget();
  }

  ngOnInit(): void {
    this._apiService.getSummaryData().subscribe(data => {
      this.data = data['results'][0]['_source'];
      console.log(this.data);
    });
  }

  initTwitterWidget() {
    this.twitter = this._router.events.subscribe(val => {
      if (val instanceof NavigationEnd) {
        (<any>window).twttr = (function (d, s, id) {
          let js: any, fjs = d.getElementsByTagName(s)[0],
            t = (<any>window).twttr || {};
          if (d.getElementById(id)) return t;
          js = d.createElement(s);
          js.id = id;
          js.src = "https://platform.twitter.com/widgets.js";
          // @ts-ignore
          fjs.parentNode.insertBefore(js, fjs);

          t._e = [];
          t.ready = function (f: any) {
            t._e.push(f);
          };

          return t;
        }(document, "script", "twitter-wjs"));

        if ((<any>window).twttr.ready())
          (<any>window).twttr.widgets.load();

      }
    });
  }

  ngOnDestroy() {
    this.twitter.unsubscribe();
  }

  getData(data: any, key: string) {
    if (data)
      return data[key];
  }

}
