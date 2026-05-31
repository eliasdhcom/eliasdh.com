/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';

export interface CostItem {
    id:        number;
    name:      string;
    amount:    number;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    type:      'fixed' | 'variable';
    sortOrder: number;
}

@Injectable({ providedIn: 'root' })
export class CostsService {
    private readonly apiUrl = `${environment.eliasdhApiUrl}/api/v1/costs`;

    constructor(private http: HttpClient, private authService: AuthService) {}

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({ 'Content-Type': 'application/json', 'x-api-key': environment.eliasdhApiKey });
    }

    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        let h = new HttpHeaders({ 'Content-Type': 'application/json', 'x-api-key': environment.eliasdhApiKey });
        if (token) h = h.set('Authorization', `Bearer ${token}`);
        return h;
    }

    getAll(): Observable<{ success: boolean; data: CostItem[] }> {
        return this.http.get<{ success: boolean; data: CostItem[] }>(this.apiUrl, { headers: this.getHeaders() });
    }

    create(data: Partial<CostItem>): Observable<{ success: boolean; data: CostItem }> {
        return this.http.post<{ success: boolean; data: CostItem }>(this.apiUrl, data, { headers: this.getAuthHeaders() });
    }

    update(id: number, data: Partial<CostItem>): Observable<{ success: boolean; data: CostItem }> {
        return this.http.put<{ success: boolean; data: CostItem }>(`${this.apiUrl}/${id}`, data, { headers: this.getAuthHeaders() });
    }

    delete(id: number): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
    }
}