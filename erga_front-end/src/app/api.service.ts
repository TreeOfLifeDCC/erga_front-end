import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {
  }

  getData(pageIndex: number, pageSize: number, searchValue: string, sortActive: string, sortDirection: string,
          filterValue: string[]) {
    console.log(pageIndex);
    console.log(pageSize);
    console.log(filterValue);
    const offset = pageIndex * pageSize;
    let url = `https://portal.erga-biodiversity.eu/api/data_portal?limit=${pageSize}&offset=${offset}`;
    if (searchValue) {
      url += `&search=${searchValue}`;
    }
    if (sortActive && sortDirection) {
      url += `&sort=${sortActive}:${sortDirection}`;
    }
    if (filterValue.length !== 0) {
      let filterStr = '&filter=';
      for (let i = 0; i < filterValue.length; i++) {
        let filterItem = filterValue[i].split(' - ')[0].toLowerCase().split(' ').join('_');
        if (filterItem === 'assemblies') {
          filterItem = 'assemblies_status:Done';
        } else
          filterItem = `${filterItem}:Done`;
        filterStr === '&filter=' ? filterStr += `${filterItem}` : filterStr += `,${filterItem}`;
        url += filterStr;
      }
    }
    console.log(url);
    return this.http.get<any>(url);
  }
}
