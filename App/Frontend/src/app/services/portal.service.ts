/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/07/2026
**/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';
import { Customer } from './customers.service';
import { Invoice } from './invoice-builder.service';

/** Same shape as `Invoice`, but as received over HTTP: date fields are ISO strings, not `Date` instances. */
export type PortalMeInvoice = Omit<Invoice, 'issueDate' | 'dueDate' | 'periodStart' | 'periodEnd'> & {
    issueDate:   string;
    dueDate:     string;
    periodStart: string;
    periodEnd:   string;
};

export interface PortalMe {
    customer: Customer;
    invoices: PortalMeInvoice[];
}

@Injectable({ providedIn: 'root' })
export class PortalService {
    private readonly apiUrl = `${environment.eliasdhApiUrl}/api/v1/portal`;

    constructor(private http: HttpClient, private authService: AuthService) {}

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        let headers = new HttpHeaders({ 'Content-Type': 'application/json', 'x-api-key': environment.eliasdhApiKey });
        if (token) headers = headers.set('Authorization', `Bearer ${token}`);
        return headers;
    }

    getMe(): Observable<{ success: boolean; data: PortalMe }> {
        return this.http.get<{ success: boolean; data: PortalMe }>(
            `${this.apiUrl}/me`,
            { headers: this.getHeaders() }
        );
    }
}
