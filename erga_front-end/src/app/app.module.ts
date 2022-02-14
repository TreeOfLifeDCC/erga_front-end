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

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomeComponent,
    StatusTrackingComponent,
    PhylogenyComponent,
    AboutComponent,
    ApiDocumentationComponent,
    HelpComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RoutingModule,
    MaterialModule,
    FlexLayoutModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
