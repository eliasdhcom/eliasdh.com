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
    constructor(private http: HttpClient, private authService: AuthService) {}

    async subscribe(): Promise<void> {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        try {
            await navigator.serviceWorker.register('/sw.js');
            const reg = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('SW not ready')), 8000))
            ]);

            const keyRes = await fetch(`${this.apiUrl}/vapid-public-key`, {
                headers: { 'x-api-key': environment.eliasdhApiKey }
            });
            if (!keyRes.ok) return;
            const { key } = await keyRes.json();
            if (!key) return;

            const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({
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

    async unsubscribe(): Promise<void> {
        if (!('serviceWorker' in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.getRegistration('/sw.js');
            if (!reg) return;
            const sub = await reg.pushManager.getSubscription();
            if (!sub) return;
            const token = this.authService.getToken();
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'x-api-key': environment.eliasdhApiKey,
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            });
            await this.http.delete(`${this.apiUrl}/subscribe`, {
                headers,
                body: { endpoint: sub.endpoint }
            }).toPromise().catch(() => {});
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