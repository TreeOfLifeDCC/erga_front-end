import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  getData(pageIndex: number, pageSize: number, filterValue: string, sortActive: string, sortDirection: string) {
    console.log(pageIndex);
    console.log(pageSize);
    const offset = pageIndex * pageSize;
    let url = `https://portal.erga-biodiversity.eu/api/data_portal?limit=${pageSize}&offset=${offset}`;
    if (filterValue) {
      url += `&search=${filterValue}`;
    }
    if (sortActive && sortDirection) {
      url += `&sort=${sortActive}:${sortDirection}`;
    }
    console.log(url);
    return this.http.get<any>(url);
  }
}
