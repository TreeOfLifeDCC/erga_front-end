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
import {SamplingMapComponent} from "./sampling-map/sampling-map.component";
import {LookerDashboardsComponent} from "./looker-dashboards/looker-dashboards.component";
import {BulkDownloadsComponent} from "./bulk-downloads/bulk-downloads.component";

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full'},
  { path: 'home', component: HomeComponent , title: "Home"},
  { path: 'data_portal', component: DataPortalComponent, title: "Data Portal" },
  { path: 'data_portal/:organismId', component: DataPortalDetailsComponent  },
  { path: 'organism/:organismId', component: OrganismDetailsComponent, title: "Organism" },
  { path: 'specimen/:specimenId', component: SpecimenDetailsComponent, title: "Specimen" },
  { path: 'status_tracking', component: StatusTrackingComponent , title: "Status Tracking"},
  { path: 'phylogeny', component: PhylogenyComponent , title: "Phylogeny" },
  { path: 'about', component: AboutComponent, title: "About" },
  { path: 'api_documentation', component: ApiDocumentationComponent ,title: "Api Documentation"},
  { path: 'help', component: HelpComponent , title: "Help"},
  { path: 'gis', component: SamplingMapComponent ,title: "Sampling Map"},
  {
    path: 'bulk-downloads' , component: BulkDownloadsComponent
  },
  { path: 'dashboards', component: LookerDashboardsComponent, title: "Dashboards" }
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
