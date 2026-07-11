/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

    async forgotPassword(email: string): Promise<boolean> {
        try {
            const res = await firstValueFrom(
                this.http.post<{ success: boolean }>(
                    `${environment.eliasdhApiUrl}/api/v1/auth/forgot-password`,
                    { email: email.trim() }
                )
            );
            return !!res?.success;
        } catch { return false; }
    }

    async verifyResetCode(email: string, code: string): Promise<boolean> {
        try {
            const res = await firstValueFrom(
                this.http.post<{ success: boolean }>(
                    `${environment.eliasdhApiUrl}/api/v1/auth/verify-reset-code`,
                    { email: email.trim(), code }
                )
            );
            return !!res?.success;
        } catch { return false; }
    }

    async resetPassword(email: string, code: string, password: string): Promise<boolean> {
        try {
            const res = await firstValueFrom(
                this.http.post<{ success: boolean }>(
                    `${environment.eliasdhApiUrl}/api/v1/auth/reset-password`,
                    { email: email.trim(), code, password }
                )
            );
            return !!res?.success;
        } catch { return false; }
    }

    async login(email: string, password: string, latitude?: number, longitude?: number): Promise<boolean> {
        try {
            const res = await firstValueFrom(
                this.http.post<{ success: boolean; token: string; data: AuthUser }>(
                    `${environment.eliasdhApiUrl}/api/v1/auth/login`,
                    { email: email.trim(), password, latitude: latitude ?? null, longitude: longitude ?? null }
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

    async recordLoginLocation(latitude: number, longitude: number): Promise<void> {
        const token = this.getToken();
        if (!token || !isPlatformBrowser(this.platformId)) return;
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'x-api-key':    environment.eliasdhApiKey,
            'Authorization': `Bearer ${token}`
        });
        try {
            await firstValueFrom(
                this.http.post(`${environment.eliasdhApiUrl}/api/v1/auth/login-location`, { latitude, longitude }, { headers })
            );
        } catch { }
    }

    logout(): void {
        const token = this.getToken();
        if (token && isPlatformBrowser(this.platformId)) {
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'x-api-key':    environment.eliasdhApiKey,
                'Authorization': `Bearer ${token}`
            });
            this.http.post(`${environment.eliasdhApiUrl}/api/v1/auth/logout`, {}, { headers })
                .subscribe({ error: () => {} });
        }
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

    isStaff(user: AuthUser | null): boolean {
        const role = (user?.role ?? '').toLowerCase();
        return role === 'admin' || role === 'employee';
    }

    async getLiveLocationPermission(): Promise<string> {
        if (!isPlatformBrowser(this.platformId)) return 'denied';
        if (!navigator.permissions?.query) return navigator.geolocation ? 'prompt' : 'denied';
        try {
            const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            return status.state;
        } catch {
            return 'prompt';
        }
    }

    getLiveNotificationPermission(): string {
        if (!isPlatformBrowser(this.platformId) || typeof Notification === 'undefined') return 'granted';
        return Notification.permission;
    }

    async hasStaffPermissionsGranted(): Promise<boolean> {
        const notifOk = this.getLiveNotificationPermission() === 'granted';
        const locationOk = (await this.getLiveLocationPermission()) === 'granted';
        return notifOk && locationOk;
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