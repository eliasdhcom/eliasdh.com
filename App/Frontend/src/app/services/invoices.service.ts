/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';

export interface InvoiceStatus {
    customerId:       string;
    subscriptionId:   string;
    periodStart:      string;
    invoiceType:      'subscription' | 'domain';
    paid:             boolean;
    paidAt:           string | null;
    amount:           number | null;
    frequency:        string | null;
    subscriptionName: string | null;
    subscriptionType: string | null;
    subscriptionUrl:  string | null;
}

@Injectable({ providedIn: 'root' })
export class InvoicesService {
    private readonly apiUrl = `${environment.eliasdhApiUrl}/api/v1/invoices`;

    constructor(private http: HttpClient, private authService: AuthService) {}

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        let h = new HttpHeaders({ 'Content-Type': 'application/json', 'x-api-key': environment.eliasdhApiKey });
        if (token) h = h.set('Authorization', `Bearer ${token}`);
        return h;
    }

    getAllStatuses(): Observable<{ success: boolean; data: InvoiceStatus[] }> {
        return this.http.get<{ success: boolean; data: InvoiceStatus[] }>(
            `${this.apiUrl}/status`,
            { headers: this.getHeaders() }
        );
    }

    updateStatus(status: Omit<InvoiceStatus, 'paidAt'>): Observable<{ success: boolean }> {
        return this.http.patch<{ success: boolean }>(
            `${this.apiUrl}/status`,
            status,
            { headers: this.getHeaders() }
        );
    }
}