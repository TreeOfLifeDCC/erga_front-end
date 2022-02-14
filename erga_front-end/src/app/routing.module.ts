import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {HomeComponent} from "./home/home.component";
import {StatusTrackingComponent} from "./status-tracking/status-tracking.component";
import {PhylogenyComponent} from "./phylogeny/phylogeny.component";
import {AboutComponent} from "./about/about.component";
import {ApiDocumentationComponent} from "./api-documentation/api-documentation.component";
import {HelpComponent} from "./help/help.component";

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: 'home', component: HomeComponent },
  { path: 'status_tracking', component: StatusTrackingComponent },
  { path: 'phylogeny', component: PhylogenyComponent },
  { path: 'about', component: AboutComponent },
  { path: 'api_documentation', component: ApiDocumentationComponent },
  { path: 'help', component: HelpComponent }
]

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class RoutingModule { }
