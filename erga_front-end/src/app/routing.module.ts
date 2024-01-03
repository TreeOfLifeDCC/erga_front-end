import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {HomeComponent} from "./home/home.component";
import {StatusTrackingComponent} from "./status-tracking/status-tracking.component";
import {PhylogenyComponent} from "./phylogeny/phylogeny.component";
import {AboutComponent} from "./about/about.component";
import {ApiDocumentationComponent} from "./api-documentation/api-documentation.component";
import {HelpComponent} from "./help/help.component";
import {DataPortalComponent} from "./data-portal/data-portal.component";
import {DataPortalDetailsComponent} from "./data-portal/data-portal-details/data-portal-details.component";
import {OrganismDetailsComponent} from "./organism-details/organism-details.component";
import {SpecimenDetailsComponent} from "./specimen-details/specimen-details.component";

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: 'home', component: HomeComponent },
  { path: 'data_portal', component: DataPortalComponent },
  { path: 'data_portal/:organismId', component: DataPortalDetailsComponent },
  { path: 'organism/:organismId', component: OrganismDetailsComponent },
  { path: 'specimen/:specimenId', component: SpecimenDetailsComponent },
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
