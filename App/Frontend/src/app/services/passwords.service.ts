/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 07/07/2026
**/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';

export interface PasswordEntry {
    id:            number;
    serviceName:   string;
    loginUrl:      string;
    email:         string;
    username:      string;
    has2fa:        boolean;
    createdBy:     number | null;
    updatedBy:     number | null;
    updatedByName: string;
    createdAt:     string;
    updatedAt:     string;
    hasPassword:   boolean;
}

export interface PasswordEntryInput {
    serviceName: string;
    loginUrl?:   string;
    email?:      string;
    username?:   string;
    password?:   string;
    has2fa?:     boolean;
}

@Injectable({ providedIn: 'root' })
export class PasswordsService {
    private readonly apiUrl = `${environment.eliasdhApiUrl}/api/v1/passwords`;

    constructor(private http: HttpClient, private authService: AuthService) {}

    private getAuthHeaders(vaultToken?: string): HttpHeaders {
        const token = this.authService.getToken();
        let h = new HttpHeaders({ 'Content-Type': 'application/json', 'x-api-key': environment.eliasdhApiKey });
        if (token) h = h.set('Authorization', `Bearer ${token}`);
        if (vaultToken) h = h.set('X-Vault-Token', vaultToken);
        return h;
    }

    getAll(search?: string): Observable<{ success: boolean; data: PasswordEntry[] }> {
        let params = new HttpParams();
        if (search) params = params.set('search', search);
        return this.http.get<{ success: boolean; data: PasswordEntry[] }>(this.apiUrl, { headers: this.getAuthHeaders(), params });
    }

    create(data: PasswordEntryInput): Observable<{ success: boolean; data: PasswordEntry }> {
        return this.http.post<{ success: boolean; data: PasswordEntry }>(this.apiUrl, data, { headers: this.getAuthHeaders() });
    }

    update(id: number, data: Partial<PasswordEntryInput>): Observable<{ success: boolean; data: PasswordEntry }> {
        return this.http.put<{ success: boolean; data: PasswordEntry }>(`${this.apiUrl}/${id}`, data, { headers: this.getAuthHeaders() });
    }

    delete(id: number): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
    }

    verify(password: string): Observable<{ success: boolean; token: string; expiresAt: number }> {
        return this.http.post<{ success: boolean; token: string; expiresAt: number }>(`${this.apiUrl}/verify`, { password }, { headers: this.getAuthHeaders() });
    }

    reveal(id: number, vaultToken: string): Observable<{ success: boolean; data: { password: string } }> {
        return this.http.post<{ success: boolean; data: { password: string } }>(`${this.apiUrl}/${id}/reveal`, {}, { headers: this.getAuthHeaders(vaultToken) });
    }
}
