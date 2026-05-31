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

export interface PricingPlan {
    id:           number;
    name:         string;
    monthlyPrice: number;
}

@Injectable({ providedIn: 'root' })
export class PricingPlansService {
    private readonly apiUrl = `${environment.eliasdhApiUrl}/api/v1/pricing`;

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

    getAll(): Observable<{ success: boolean; data: PricingPlan[] }> {
        return this.http.get<{ success: boolean; data: PricingPlan[] }>(this.apiUrl, { headers: this.getHeaders() });
    }

    create(data: { name: string; monthlyPrice: number }): Observable<{ success: boolean; data: PricingPlan }> {
        return this.http.post<{ success: boolean; data: PricingPlan }>(this.apiUrl, data, { headers: this.getAuthHeaders() });
    }

    update(id: number, data: { name?: string; monthlyPrice?: number }): Observable<{ success: boolean; data: PricingPlan }> {
        return this.http.put<{ success: boolean; data: PricingPlan }>(`${this.apiUrl}/${id}`, data, { headers: this.getAuthHeaders() });
    }

    delete(id: number): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
    }
}