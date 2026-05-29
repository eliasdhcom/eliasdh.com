/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface AuthUser {
    id?:       number;
    firstName: string;
    lastName:  string;
    email:     string;
    role:      string;
    company:   string;
    phone:     string;
    birthDate: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly TOKEN_KEY = 'eliasdh_portal_token';
    private readonly platformId = inject(PLATFORM_ID);
    private readonly router     = inject(Router);
    private readonly http       = inject(HttpClient);

    async login(email: string, password: string): Promise<boolean> {
        try {
            const res = await firstValueFrom(
                this.http.post<{ success: boolean; token: string; data: AuthUser }>(
                    `${environment.eliasdhApiUrl}/api/v1/auth/login`,
                    { email: email.trim(), password }
                )
            );
            if (res?.success && res.token && isPlatformBrowser(this.platformId)) {
                sessionStorage.setItem(this.TOKEN_KEY, res.token);
            }
            return !!res?.success;
        } catch {
            return false;
        }
    }

    logout(): void {
        if (isPlatformBrowser(this.platformId)) {
            sessionStorage.removeItem(this.TOKEN_KEY);
        }
        this.router.navigate(['/login']);
    }

    isAuthenticated(): boolean {
        if (!isPlatformBrowser(this.platformId)) return false;
        const token = sessionStorage.getItem(this.TOKEN_KEY);
        if (!token) return false;
        const payload = this._decodePayload(token);
        if (!payload) return false;
        return payload.exp > Math.floor(Date.now() / 1000);
    }

    getToken(): string | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        return sessionStorage.getItem(this.TOKEN_KEY);
    }

    getUser(): AuthUser | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        const token = sessionStorage.getItem(this.TOKEN_KEY);
        if (!token) return null;
        const payload = this._decodePayload(token);
        if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) return null;
        return {
            id:        payload.id,
            firstName: payload.firstName ?? '',
            lastName:  payload.lastName  ?? '',
            email:     payload.email     ?? '',
            role:      payload.role      ?? '',
            company:   payload.company   ?? '',
            phone:     payload.phone     ?? '',
            birthDate: payload.birthDate ?? ''
        };
    }

    private _decodePayload(token: string): any {
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        } catch {
            return null;
        }
    }
}