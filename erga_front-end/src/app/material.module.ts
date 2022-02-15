import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatGridListModule} from "@angular/material/grid-list";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatListModule} from "@angular/material/list";
import {MatCardModule} from "@angular/material/card";
import {MatDividerModule} from "@angular/material/divider";
import {MatChipsModule} from "@angular/material/chips";
import {MatBadgeModule} from "@angular/material/badge";



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatTooltipModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule
  ],
  exports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatTooltipModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule
  ]
})
export class MaterialModule { }
