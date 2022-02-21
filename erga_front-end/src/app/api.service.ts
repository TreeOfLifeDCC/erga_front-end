import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  getData(pageIndex: number, pageSize: number) {
    console.log(pageIndex);
    console.log(pageSize);
    const offset = pageIndex * pageSize;
    const url = `https://portal.erga-biodiversity.eu/api/data_portal?limit=${pageSize}&offset=${offset}`;
    return this.http.get<any>(url);
  }
}
