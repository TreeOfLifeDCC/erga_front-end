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
    console.log(filterValue);
    const project_names = ['DToL', '25 genomes'];
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
      let filterItem;
      for (let i = 0; i < filterValue.length; i++) {
        if (project_names.indexOf(filterValue[i]) !== -1) {
          filterValue[i] === 'DToL' ? filterItem = 'project_name:dtol' : filterItem = `project_name:${filterValue[i]}`;
        } else if (filterValue[i].includes('-')) {
          filterItem = filterValue[i].split(' - ')[0].toLowerCase().split(' ').join('_');
          if (filterItem === 'assemblies') {
            filterItem = 'assemblies_status:Done';
          } else
            filterItem = `${filterItem}:Done`;
        } else {
          filterItem = `kingdom:${filterValue[i]}`;
        }
        filterStr === '&filter=' ? filterStr += `${filterItem}` : filterStr += `,${filterItem}`;
        console.log(filterStr);
      }
      url += filterStr;
    }
    console.log(url);
    return this.http.get<any>(url);
  }

  getDetailsData(organismName: any) {
    const url = `https://portal.erga-biodiversity.eu/api/data_portal/${organismName}`;
    return this.http.get<any>(url);
  }
}