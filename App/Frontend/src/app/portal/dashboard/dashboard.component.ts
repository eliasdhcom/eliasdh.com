/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 08/04/2026
**/

import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { AuthService, AuthUser } from '../../services/auth.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { PortalCustomersComponent } from '../customers/customers.component';
import { PortalSubscriptionsComponent } from '../subscriptions/subscriptions.component';
import { PortalInvoicesComponent } from '../invoices/invoices.component';
import { PortalOverviewComponent } from '../overview/overview.component';
import { PortalAnalysisComponent } from '../analysis/analysis.component';
import { PortalUsersComponent } from '../users/users.component';
import { PortalPricingPlansComponent } from '../pricing-plans/pricing-plans.component';
import { UsersService } from '../../services/users.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslatePipe, PortalOverviewComponent, PortalCustomersComponent, PortalSubscriptionsComponent, PortalInvoicesComponent, PortalAnalysisComponent, PortalUsersComponent, PortalPricingPlansComponent],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
    currentView = 'overview';
    sidebarCollapsed = false;
    mobileMenuOpen = false;
    userPanelOpen = false;
    highlightedSubscriptionId: string | null = null;
    private destroy$ = new Subject<void>();

    user:       AuthUser = { firstName: '', lastName: '', email: '', role: '', company: '', phone: '', birthDate: '' };
    userAvatar: string | null = null;

    langDropdownOpen  = false;
    currentLanguage   = 'nl';
    readonly languages = [
        { code: 'nl', name: 'Nederlands' },
        { code: 'en', name: 'English' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'es', name: 'Español' }
    ];

    constructor(
        private authService: AuthService,
        private usersService: UsersService,
        private translate: TranslateService
    ) {}

    ngOnInit(): void {
        this.currentLanguage = this.translate.currentLang || localStorage.getItem('language') || 'nl';
        this.user = this.authService.getUser() ?? { firstName: 'Unknown', lastName: '', email: '', role: '', company: '', phone: '', birthDate: '' };
        if (this.user.id) {
            this.usersService.getUserById(this.user.id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({ next: r => {
                    if (r.data) {
                        this.userAvatar      = r.data.avatar    ?? null;
                        this.user.role       = r.data.role      || this.user.role;
                        this.user.firstName  = r.data.firstName || this.user.firstName;
                        this.user.lastName   = r.data.lastName  || this.user.lastName;
                        this.user.company    = r.data.company   || this.user.company;
                        this.user.phone      = r.data.phone     || this.user.phone;
                    }
                }});
        }
        this.usersService.avatarUpdated$
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ id, avatar }) => {
                if (id === this.user.id) this.userAvatar = avatar;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    navigateTo(view: string): void {
        this.highlightedSubscriptionId = null;
        this.currentView = view;
        if (this.mobileMenuOpen) this.mobileMenuOpen = false;
    }

    onNavigateToSubscription(subscriptionId: string): void {
        this.highlightedSubscriptionId = subscriptionId;
        this.currentView = 'subscriptions';
        if (this.mobileMenuOpen) this.mobileMenuOpen = false;
    }

    toggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    toggleUserPanel(): void {
        this.userPanelOpen = !this.userPanelOpen;
    }

    closeUserPanel(): void {
        this.userPanelOpen = false;
    }

    logout(): void {
        this.authService.logout();
    }

    getUserInitials(): string {
        return ((this.user.firstName?.[0] ?? '') + (this.user.lastName?.[0] ?? '')).toUpperCase();
    }

    getRoleClass(role: string): string {
        const r = (role ?? '').toLowerCase();
        if (r === 'admin')    return 'role--admin';
        if (r === 'employee') return 'role--employee';
        return 'role--customer';
    }

    getViewTitle(): string {
        const keys: Record<string, string> = {
            overview:      'PORTAL.NAV.OVERVIEW',
            customers:     'PORTAL.NAV.CUSTOMERS',
            subscriptions: 'PORTAL.NAV.SUBSCRIPTIONS',
            invoices:      'PORTAL.NAV.INVOICES',
            users:         'PORTAL.NAV.USERS',
            analysis:      'PORTAL.NAV.ANALYSIS',
            pricing:       'PORTAL.NAV.PRICING'
        };
        return this.translate.instant(keys[this.currentView] ?? 'PORTAL.NAV.OVERVIEW');
    }

    toggleLangDropdown(event: Event): void {
        event.stopPropagation();
        this.langDropdownOpen = !this.langDropdownOpen;
    }

    changeLanguage(code: string): void {
        this.translate.use(code);
        localStorage.setItem('language', code);
        this.currentLanguage  = code;
        this.langDropdownOpen = false;
    }

    @HostListener('document:click')
    onDocumentClick(): void {
        if (this.langDropdownOpen) this.langDropdownOpen = false;
    }
}
