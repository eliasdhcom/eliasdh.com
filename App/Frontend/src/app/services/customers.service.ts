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

export interface CustomerLocation {
    id?:         number;
    street:      string;
    number:      string;
    postalCode:  string;
    city:        string;
    country:     string;
    vat?:        string;
    latitude:    number;
    longitude:   number;
    socialLinks?: SocialLink[];
}

export type SubscriptionFrequency = 'monthly' | 'quarterly' | 'yearly' | 'one-time';

export interface CustomerWebsite {
    id:               string;
    name:             string;
    url:              string;
    subscriptionType: string;
    isLive:           boolean;
    startDate:        string;
    frequency:        SubscriptionFrequency;
    payment:          number;
    discount:         number;
    subtotal:         number;
    vat:              number;
    total:            number;
    visitors?:        number;
}

export interface SocialLink {
    type: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'youtube' | 'github';
    url:  string;
}

export interface CustomerDomain {
    id?:         number;
    name:        string;
    renewalDate: string;
    annualPrice: number;
}

export interface Customer {
    id:           string;
    name:         string;
    isHQ?:        boolean;
    firstName?:   string;
    lastName?:    string;
    email?:       string;
    phone?:       string;
    mobile?:      string;
    vat?:         string | null;
    logo?:        string;
    showOnHomePage?: boolean;
    socialLinks?: SocialLink[];
    websites:     CustomerWebsite[];
    locations:    CustomerLocation[];
    domains?:           CustomerDomain[];
    address:            string;
    latitude:           number;
    longitude:          number;
    agreementSignedAt?:  string | null;
    agreementSignature?: string | null;
}

export interface MetricsResponse {
    success:   boolean;
    domain:    string;
    visitors:  number;
    timestamp: string;
}

export interface CustomersResponse {
    success: boolean;
    data:    Customer[];
    count:   number;
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
    private readonly apiUrl     = `${environment.eliasdhApiUrl}/api/v1/customers`;
    private readonly metricsUrl = `${environment.eliasdhApiUrl}/api/v1/metrics`;

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

    getAllCustomers(): Observable<CustomersResponse> {
        return this.http.get<CustomersResponse>(this.apiUrl, { headers: this.getHeaders() });
    }

    getCustomerById(id: string): Observable<{ success: boolean; data: Customer }> {
        return this.http.get<{ success: boolean; data: Customer }>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    createCustomer(data: Partial<Customer>): Observable<{ success: boolean; data: Customer }> {
        return this.http.post<{ success: boolean; data: Customer }>(this.apiUrl, data, { headers: this.getAuthHeaders() });
    }

    updateCustomer(id: string, data: Partial<Customer>): Observable<{ success: boolean; data: Customer }> {
        return this.http.put<{ success: boolean; data: Customer }>(`${this.apiUrl}/${id}`, data, { headers: this.getAuthHeaders() });
    }

    deleteCustomer(id: string): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
    }

    signAgreement(id: string, signature: string): Observable<{ success: boolean; signedAt: string }> {
        return this.http.post<{ success: boolean; signedAt: string }>(
            `${this.apiUrl}/${id}/agreement/sign`,
            { signature },
            { headers: this.getAuthHeaders() }
        );
    }

    getVisitorCount(domain: string): Observable<MetricsResponse> {
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return this.http.get<MetricsResponse>(`${this.metricsUrl}/visitors/${cleanDomain}`, { headers: this.getHeaders() });
    }
}