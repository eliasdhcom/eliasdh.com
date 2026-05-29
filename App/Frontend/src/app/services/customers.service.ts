/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/11/2025
**/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface CustomerLocation {
    street: string;
    number: string;
    postalCode: string;
    city: string;
    country: string;
    vat?: string;
    latitude: number;
    longitude: number;
    socialLinks?: SocialLink[];
}

export type SubscriptionFrequency = 'monthly' | 'quarterly' | 'yearly' | 'one-time';

export interface CustomerWebsite {
    id: string;
    name: string;
    url: string;
    subscriptionType: string;
    isLive: boolean;
    startDate: string;
    frequency: SubscriptionFrequency;
    payment: number;
    discount: number;
    subtotal: number;
    vat: number;
    total: number;
    visitors?: number;
}

export interface SocialLink {
    type: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'youtube' | 'github';
    url: string;
}

export interface Customer {
    id: string;
    name: string;
    isHQ?: boolean;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    vat: string;
    logo?: string;
    socialLinks?: SocialLink[];
    websites: CustomerWebsite[];
    locations: CustomerLocation[];
    address: string;
    latitude: number;
    longitude: number;
}

export interface MetricsResponse {
    success: boolean;
    domain: string;
    visitors: number;
    timestamp: string;
}

export interface CustomersResponse {
    success: boolean;
    data: Customer[];
    count: number;
}

@Injectable({
    providedIn: 'root'
})
export class CustomersService {
    private apiUrl = `${environment.eliasdhApiUrl}/api/v1/customers`;
    private metricsUrl = `${environment.eliasdhApiUrl}/api/v1/metrics`;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'x-api-key': environment.eliasdhApiKey
        });
    }

    getAllCustomers(): Observable<CustomersResponse> {
        return this.http.get<CustomersResponse>(this.apiUrl, { headers: this.getHeaders() });
    }

    getCustomerById(id: string): Observable<{ success: boolean; data: Customer }> {
        return this.http.get<{ success: boolean; data: Customer }>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    getVisitorCount(domain: string): Observable<MetricsResponse> {
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return this.http.get<MetricsResponse>(`${this.metricsUrl}/visitors/${cleanDomain}`, { headers: this.getHeaders() });
    }
}