/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 17/12/2025
**/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

interface ContactResponse {
    success: boolean;
    message: string;
    data?: any;
}

@Injectable({
    providedIn: 'root'
})

export class ContactService {
    private apiUrl = `${environment.eliasdhApiUrl}/api/v1/contact`;

    constructor(private http: HttpClient) {}

    submitContactForm(formData: ContactFormData): Observable<ContactResponse> {
        return this.http.post<ContactResponse>(this.apiUrl, formData);
    }

    getContactStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/stats`);
    }
}