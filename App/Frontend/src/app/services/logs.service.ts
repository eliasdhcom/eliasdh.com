/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';

export interface LogEntry {
    id:         number;
    userId:     number | null;
    userEmail:  string | null;
    userName:   string | null;
    action:     string;
    resource:   string | null;
    resourceId: string | null;
    details:    string | null;
    ipAddress:  string | null;
    createdAt:  string;
}

export interface LogsResponse {
    success: boolean;
    data:    LogEntry[];
    total:   number;
}

export interface LogsFilter {
    action?:   string;
    resource?: string;
    userId?:   string;
    search?:   string;
    dateFrom?: string;
    dateTo?:   string;
    limit?:    number;
    offset?:   number;
}

@Injectable({ providedIn: 'root' })
export class LogsService {
    private readonly apiUrl = `${environment.eliasdhApiUrl}/api/v1/logs`;

    constructor(private http: HttpClient, private authService: AuthService) {}

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        let h = new HttpHeaders({ 'Content-Type': 'application/json', 'x-api-key': environment.eliasdhApiKey });
        if (token) h = h.set('Authorization', `Bearer ${token}`);
        return h;
    }

    getLogs(filter: LogsFilter = {}): Observable<LogsResponse> {
        let params = new HttpParams();
        if (filter.action)   params = params.set('action',   filter.action);
        if (filter.resource) params = params.set('resource', filter.resource);
        if (filter.userId)   params = params.set('userId',   filter.userId);
        if (filter.search)   params = params.set('search',   filter.search);
        if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom);
        if (filter.dateTo)   params = params.set('dateTo',   filter.dateTo);
        if (filter.limit != null)  params = params.set('limit',  String(filter.limit));
        if (filter.offset != null) params = params.set('offset', String(filter.offset));
        return this.http.get<LogsResponse>(this.apiUrl, { headers: this.getHeaders(), params });
    }
}