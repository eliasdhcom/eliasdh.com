/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';

export interface PortalUser {
    id:          number;
    email:       string;
    firstName:   string;
    lastName:    string;
    role:        string;
    company:     string;
    phone:       string;
    birthDate:   string;
    avatar:      string | null;
    createdAt:   string;
    active:      boolean;
    netSalary:   number;
    customerId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
    private readonly apiUrl = `${environment.eliasdhApiUrl}/api/v1/users`;

    readonly avatarUpdated$ = new Subject<{ id: number; avatar: string | null }>();

    constructor(private http: HttpClient, private authService: AuthService) {}

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        if (token) headers = headers.set('Authorization', `Bearer ${token}`);
        return headers;
    }

    getAllUsers(): Observable<{ success: boolean; data: PortalUser[] }> {
        return this.http.get<{ success: boolean; data: PortalUser[] }>(
            this.apiUrl,
            { headers: this.getHeaders() }
        );
    }

    setActive(id: number, active: boolean): Observable<{ success: boolean }> {
        return this.http.patch<{ success: boolean }>(
            `${this.apiUrl}/${id}/active`,
            { active },
            { headers: this.getHeaders() }
        );
    }

    createUser(data: {
        email: string; password: string; firstName: string; lastName: string;
        role: string; company: string; phone: string; birthDate: string; avatar?: string;
        customerId?: string | null;
    }): Observable<{ success: boolean; data: PortalUser }> {
        return this.http.post<{ success: boolean; data: PortalUser }>(
            this.apiUrl,
            data,
            { headers: this.getHeaders() }
        );
    }

    getUserById(id: number): Observable<{ success: boolean; data: PortalUser }> {
        return this.http.get<{ success: boolean; data: PortalUser }>(
            `${this.apiUrl}/${id}`,
            { headers: this.getHeaders() }
        );
    }

    deleteUser(id: number): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(
            `${this.apiUrl}/${id}`,
            { headers: this.getHeaders() }
        );
    }

    updateSalary(id: number, netSalary: number): Observable<{ success: boolean }> {
        return this.http.patch<{ success: boolean }>(
            `${this.apiUrl}/${id}`,
            { netSalary },
            { headers: this.getHeaders() }
        );
    }

    updateUser(id: number, data: Partial<PortalUser>): Observable<{ success: boolean }> {
        return this.http.patch<{ success: boolean }>(
            `${this.apiUrl}/${id}`,
            data,
            { headers: this.getHeaders() }
        );
    }
}
