import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute, Router} from "@angular/router";

@Injectable({
    providedIn: 'root',

})
export class ApiService {

    constructor(private http: HttpClient,
                private router: Router,
                private activatedRoute: ActivatedRoute) {
    }

    getData(pageIndex: number, pageSize: number, searchValue: string, sortActive: string, sortDirection: string,
            filterValue: string[], currentClass: string, phylogeny_filters: string[], index_name: string) {

        const project_names = [
            'DTOL',
            'ERGA',
            'Project Psyche',
            'ERGA BGE',
            'ERGA Pilot',
            '25 genomes',
            'ATLASea',
            'CBP',
            'ENDEMIXIT',
            'ERGA Community Genomes',
            'ERGA Swiss node'
        ];
        const offset = pageIndex * pageSize;
        let url = `https://portal.erga-biodiversity.eu/api/${index_name}?limit=${pageSize}&offset=${offset}`;
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
                } else if (filterValue[i].includes('-') && !filterValue[i].startsWith('experimentType')) {
                    if (filterValue[i].startsWith('symbionts')) {
                        filterItem = filterValue[i].replace('-', ':');
                    } else {
                        filterItem = filterValue[i].split(' - ')[0].toLowerCase().split(' ').join('_');
                        if (filterItem === 'assemblies') {
                            filterItem = 'assemblies_status:Done';
                        } else
                            filterItem = `${filterItem}:Done`;
                    }
                } else if (filterValue[i].includes('_') && filterValue[i].startsWith('experimentType')) {
                    filterItem = filterValue[i].replace('_', ':');

                } else {
                    filterItem = `${currentClass}:${filterValue[i]}`;
                }
                filterStr === '&filter=' ? filterStr += `${filterItem}` : filterStr += `,${filterItem}`;

            }

            url += filterStr;
        }
        if (phylogeny_filters.length !== 0) {
            let filterStr = '&phylogeny_filters=';
            for (let i = 0; i < phylogeny_filters.length; i++) {
                filterStr === '&phylogeny_filters=' ? filterStr += `${phylogeny_filters[i]}` : filterStr += `-${phylogeny_filters[i]}`;
            }

            url += filterStr;
        }
        url += `&current_class=${currentClass}`;

        // will not reload the page, but will update query params
        this.router.navigate([],
            {
                relativeTo: this.activatedRoute,
                queryParams: {
                    'filter': filterValue,
                    'sortActive': sortActive,
                    'sortDirection': sortDirection,
                    'searchValue': searchValue,
                    'pageIndex': pageIndex,
                    'pageSize': pageSize
                },
                queryParamsHandling: 'merge',
            });

        return this.http.get<any>(url);
    }

    getDetailsData(organismName: any, indexName: string) {
        const url = `https://portal.erga-biodiversity.eu/api/${indexName}/${organismName}`;
        return this.http.get<any>(url);
    }


    downloadRecords(downloadOption: string, pageIndex: number, pageSize: number, searchValue: string, sortActive: string, sortDirection: string,
                    filterValue: string[], currentClass: string, phylogenyFilters: string[], indexName: string,) {

        const url = `https://portal.erga-biodiversity.eu/api/data-download`;

        const projectNames = ['DToL', '25 genomes', 'ERGA', 'CBP', 'ASG'];

        // phylogeny
        const phylogenyStr = phylogenyFilters.length ? phylogenyFilters.join('-') : '';

        // Filter string
        let filterStr = '';

        if (filterValue.length !== 0) {
            const filterItems = [];

            for (const item of filterValue) {
                let filterItem = '';

                if (projectNames.includes(item)) {
                    filterItem = item === 'DToL' ? 'project_name:dtol' : `project_name:${item}`;
                } else if (item.includes('-') && !item.startsWith('experimentType')) {
                    if (item.startsWith('symbionts') || item.startsWith('metagenomes')) {
                        filterItem = item.replace('-', ':');
                    } else {
                        filterItem = item.split(' - ')[0].toLowerCase().replace(/\s+/g, '_');
                        filterItem = (filterItem === 'assemblies') ? 'assemblies_status:Done' :
                            (filterItem === 'genome_notes') ? 'genome_notes:Submitted' :
                                `${filterItem}:Done`;
                    }
                } else if (item.includes('_') && item.startsWith('experimentType')) {
                    filterItem = item.replace('_', ':');
                } else {
                    filterItem = `${currentClass}:${item}`;
                }

                filterItems.push(filterItem);
            }

            filterStr = filterItems.join(',');
        }

        const payload = {
            pageIndex,
            pageSize,
            searchValue,
            sortValue: `${sortActive}:${sortDirection}`,
            filterValue: filterStr || '',
            currentClass,
            phylogenyFilters: phylogenyStr,
            indexName,
            downloadOption
        };
        return this.http.post(url, payload, {responseType: 'blob'});
    }

}
