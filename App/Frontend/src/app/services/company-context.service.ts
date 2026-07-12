/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 12/07/2026
**/

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { PortalService, PortalCompany } from './portal.service';

const SELECTED_COMPANY_KEY = 'eliasdh_selected_company';

@Injectable({ providedIn: 'root' })
export class CompanyContextService {
    private readonly platformId   = inject(PLATFORM_ID);
    private readonly portalService = inject(PortalService);

    readonly companies$          = new BehaviorSubject<PortalCompany[]>([]);
    readonly selectedCustomerId$ = new BehaviorSubject<string | null>(null);

    private initialized = false;

    async init(): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;
        try {
            const res = await firstValueFrom(this.portalService.getCompanies());
            const companies = res.data ?? [];
            this.companies$.next(companies);

            const stored = isPlatformBrowser(this.platformId) ? sessionStorage.getItem(SELECTED_COMPANY_KEY) : null;
            const initial = (stored && companies.some(c => c.id === stored)) ? stored : (companies[0]?.id ?? null);
            this.selectedCustomerId$.next(initial);
            if (initial && isPlatformBrowser(this.platformId)) {
                sessionStorage.setItem(SELECTED_COMPANY_KEY, initial);
            }
        } catch {
            this.companies$.next([]);
            this.selectedCustomerId$.next(null);
        }
    }

    selectCompany(id: string): void {
        this.selectedCustomerId$.next(id);
        if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem(SELECTED_COMPANY_KEY, id);
        }
    }
}
