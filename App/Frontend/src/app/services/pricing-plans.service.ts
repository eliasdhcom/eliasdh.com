/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AuthService } from './auth.service';

export interface PricingPlan {
    id:           number;
    name:         string;
    monthlyPrice: number;
    color:        string;
}

// Fallback colors for non-plan types (Custom, Todo, Domain)
const FALLBACK_COLORS: Record<string, string> = {
    custom: '#bfe1f6',
    todo:   '#4f94f0',
    domain: '#dbeafe',
};

@Injectable({ providedIn: 'root' })
export class PricingPlansService {
    private readonly apiUrl = `${environment.eliasdhApiUrl}/api/v1/pricing`;

    // Shared color cache — populated by any component that calls setPlanColors()
    private planColorCache = new Map<string, string>();

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

    getAll(): Observable<{ success: boolean; data: PricingPlan[] }> {
        return this.http.get<{ success: boolean; data: PricingPlan[] }>(this.apiUrl, { headers: this.getHeaders() });
    }

    create(data: { name: string; monthlyPrice: number; color?: string }): Observable<{ success: boolean; data: PricingPlan }> {
        return this.http.post<{ success: boolean; data: PricingPlan }>(this.apiUrl, data, { headers: this.getAuthHeaders() });
    }

    update(id: number, data: { name?: string; monthlyPrice?: number; color?: string }): Observable<{ success: boolean; data: PricingPlan }> {
        return this.http.put<{ success: boolean; data: PricingPlan }>(`${this.apiUrl}/${id}`, data, { headers: this.getAuthHeaders() });
    }

    delete(id: number): Observable<{ success: boolean }> {
        return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
    }

    /** Call after loading plans to populate the shared color cache. */
    setPlanColors(plans: PricingPlan[]): void {
        this.planColorCache.clear();
        for (const p of plans) {
            this.planColorCache.set(p.name.toLowerCase(), p.color ?? '#cccccc');
        }
    }

    /** Returns background color for a subscription type name. */
    getPlanColor(typeName: string): string {
        const t = (typeName ?? '').toLowerCase();
        return this.planColorCache.get(t) ?? FALLBACK_COLORS[t] ?? '#d0d0d0';
    }

    /** Returns legible text color (black or white) for a given hex background. */
    getPlanTextColor(bgHex: string): string {
        if (!bgHex || bgHex.length < 4) return '#1a1a1a';
        const h = bgHex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#1a1a1a' : '#ffffff';
    }

    /** Convenience: returns {background, color} style object for a subscription type. */
    getBadgeStyle(typeName: string): { background: string; color: string } {
        const bg = this.getPlanColor(typeName);
        return { background: bg, color: this.getPlanTextColor(bg) };
    }
}
