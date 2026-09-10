/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/06/2026
**/

import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

const EXCLUDED_ROUTES = ['/privacypolicy', '/legalguidelines'];

@Component({
    selector: 'app-cookie-consent',
    standalone: true,
    imports: [CommonModule, TranslatePipe, RouterModule],
    templateUrl: './cookie-consent.component.html',
    styleUrls: ['./cookie-consent.component.css']
})

export class CookieConsentComponent implements OnInit, OnDestroy {
    showConsent: boolean = false;
    showBlocked: boolean = false;
    private routerSub!: Subscription;
    private readonly isBrowser: boolean;

    constructor(private router: Router, @Inject(DOCUMENT) private document: Document, @Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngOnInit(): void {
        this.updateVisibility(this.router.url);
        this.routerSub = this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe((e: any) => this.updateVisibility(e.urlAfterRedirects));
    }

    ngOnDestroy(): void {
        this.routerSub?.unsubscribe();
    }

    private isExcluded(url: string): boolean {
        return EXCLUDED_ROUTES.some(route => url.startsWith(route));
    }

    private updateVisibility(url: string): void {
        if (this.isExcluded(url)) {
            this.showConsent = false;
            this.showBlocked = false;
            this.syncBodyScroll();
            return;
        }

        if (!this.isBrowser) return;
        const consent = localStorage.getItem('cookieConsent');
        if (consent === 'declined') {
            this.showBlocked = true;
            this.showConsent = false;
        } else if (!consent) {
            this.showConsent = true;
            this.showBlocked = false;
        }
        this.syncBodyScroll();
    }

    private syncBodyScroll(): void {
        const overflow = (this.showConsent || this.showBlocked) ? 'hidden' : '';
        this.document.documentElement.style.overflow = overflow;
        this.document.body.style.overflow = overflow;
    }

    accept(): void {
        localStorage.setItem('cookieConsent', 'accepted');
        this.showConsent = false;
        this.syncBodyScroll();
    }

    decline(): void {
        localStorage.setItem('cookieConsent', 'declined');
        this.showConsent = false;
        this.showBlocked = true;
        this.syncBodyScroll();
    }

    changeChoice(): void {
        localStorage.removeItem('cookieConsent');
        this.showBlocked = false;
        this.showConsent = true;
        this.syncBodyScroll();
    }
}