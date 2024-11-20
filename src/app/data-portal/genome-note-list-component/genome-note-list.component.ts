import {Component, Inject, OnDestroy} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatButton} from "@angular/material/button";
import {MatListModule} from "@angular/material/list";

@Component({
    selector: 'genome-note-list',
    templateUrl: './genome-note-list.component.html',
    standalone: true,
    imports: [
        MatButton,
        MatListModule
    ],
    styleUrls: ['./genome-note-list.component.scss']
})
export class GenomeNoteListComponent implements OnDestroy {

    constructor(
        public dialogRef: MatDialogRef<GenomeNoteListComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {

    }

    close(): void {
        this.dialogRef.close();
    }

    ngOnDestroy(): void {
        this.dialogRef.close();
    }
}
