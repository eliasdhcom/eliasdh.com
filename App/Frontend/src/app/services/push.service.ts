/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 04/06/2026
**/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PushService {
    private readonly apiUrl = `${environment.eliasdhApiUrl}/api/v1/push`;
    private swReg: ServiceWorkerRegistration | null = null;

    constructor(private http: HttpClient, private authService: AuthService) {}

    async init(): Promise<void> {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        try {
            this.swReg = await navigator.serviceWorker.register('/sw.js');
        } catch { return; }
    }

    async subscribe(): Promise<void> {
        if (!this.swReg || Notification.permission !== 'granted') return;
        try {
            const keyRes = await fetch(`${this.apiUrl}/vapid-public-key`, {
                headers: { 'x-api-key': environment.eliasdhApiKey }
            });
            const { key } = await keyRes.json();
            const sub = await this.swReg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(key)
            });
            const token = this.authService.getToken();
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'x-api-key': environment.eliasdhApiKey,
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            });
            this.http.post(`${this.apiUrl}/subscribe`, sub.toJSON(), { headers })
                .subscribe({ error: () => {} });
        } catch { }
    }

    private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw     = atob(base64);
        const arr     = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
    }
}