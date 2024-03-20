import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import {RoutingModule} from "./routing.module";
import {MaterialModule} from "./material.module";
import {FlexLayoutModule} from "@angular/flex-layout";
import { StatusTrackingComponent } from './status-tracking/status-tracking.component';
import { PhylogenyComponent } from './phylogeny/phylogeny.component';
import { AboutComponent } from './about/about.component';
import { ApiDocumentationComponent } from './api-documentation/api-documentation.component';
import { HelpComponent } from './help/help.component';
import { BannerComponent } from './banner/banner.component';
import { DataPortalComponent } from './data-portal/data-portal.component';
import {HttpClientModule} from "@angular/common/http";
import { DataPortalDetailsComponent } from './data-portal/data-portal-details/data-portal-details.component';
import {OrganismDetailsComponent} from "./organism-details/organism-details.component";
import { SpecimenDetailsComponent } from './specimen-details/specimen-details.component';
import {DynamicScriptLoaderService} from "./phylogeny/services/dynamic-script-loader.service";
import {MatTableExporterModule} from "mat-table-exporter";
import { FooterComponent } from './footer/footer.component';
import { NgcCookieConsentModule } from 'ngx-cookieconsent';
import { cookieConfig } from './app.component';
import { SamplingMapComponent } from './sampling-map/sampling-map.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomeComponent,
    StatusTrackingComponent,
    PhylogenyComponent,
    AboutComponent,
    ApiDocumentationComponent,
    HelpComponent,
    BannerComponent,
    DataPortalComponent,
    DataPortalDetailsComponent,
    OrganismDetailsComponent,
    SpecimenDetailsComponent,
    FooterComponent,
    SamplingMapComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RoutingModule,
    MaterialModule,
    FlexLayoutModule,
    HttpClientModule,
    MatTableExporterModule,
    NgcCookieConsentModule.forRoot(cookieConfig)
  ],
  providers: [DynamicScriptLoaderService],
  bootstrap: [AppComponent]
})
export class AppModule { }
