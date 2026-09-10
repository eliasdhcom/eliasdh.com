/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/06/2026
**/

import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Routes waarop de cookie consent banner niet getoond mag worden
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

    constructor(private router: Router, @Inject(DOCUMENT) private document: Document) {}

    ngOnInit(): void {
        // Zichtbaarheid bepalen bij het laden van de pagina...
        this.updateVisibility(this.router.url);
        // ...en telkens opnieuw controleren bij elke navigatie
        this.routerSub = this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe((e: any) => this.updateVisibility(e.urlAfterRedirects));
    }

    ngOnDestroy(): void {
        // Memory leak vermijden door de router subscription op te ruimen
        this.routerSub?.unsubscribe();
    }

    // Controleert of de opgegeven url op een uitgesloten route staat
    private isExcluded(url: string): boolean {
        return EXCLUDED_ROUTES.some(route => url.startsWith(route));
    }

    // Bepaalt of de consent banner of de "geblokkeerd" melding getoond moet worden
    private updateVisibility(url: string): void {
        if (this.isExcluded(url)) {
            // Op uitgesloten routes (bv. privacybeleid) nooit iets tonen
            this.showConsent = false;
            this.showBlocked = false;
            this.syncBodyScroll();
            return;
        }
        const consent = localStorage.getItem('cookieConsent');
        if (consent === 'declined') {
            // Gebruiker heeft eerder geweigerd -> blokkeer melding tonen
            this.showBlocked = true;
            this.showConsent = false;
        } else if (!consent) {
            // Nog geen keuze gemaakt -> consent banner tonen
            this.showConsent = true;
            this.showBlocked = false;
        }
        this.syncBodyScroll();
    }

    // Scrollen op de pagina blokkeren zolang de banner of blokkeer-melding zichtbaar is
    private syncBodyScroll(): void {
        const overflow = (this.showConsent || this.showBlocked) ? 'hidden' : '';
        this.document.documentElement.style.overflow = overflow;
        this.document.body.style.overflow = overflow;
    }

    // Gebruiker aanvaardt de cookies
    accept(): void {
        localStorage.setItem('cookieConsent', 'accepted');
        this.showConsent = false;
        this.syncBodyScroll();
    }

    // Gebruiker weigert de cookies
    decline(): void {
        localStorage.setItem('cookieConsent', 'declined');
        this.showConsent = false;
        this.showBlocked = true;
        this.syncBodyScroll();
    }

    // Gebruiker wil zijn eerdere keuze herzien -> keuze wissen en banner opnieuw tonen
    changeChoice(): void {
        localStorage.removeItem('cookieConsent');
        this.showBlocked = false;
        this.showConsent = true;
        this.syncBodyScroll();
    }
}