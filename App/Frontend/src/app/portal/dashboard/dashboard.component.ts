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
import { PortalLogsComponent } from '../logs/logs.component';
import { PortalPasswordsComponent } from '../passwords/passwords.component';
import { PortalCompanyComponent } from '../company/company.component';
import { PortalMyCompanyComponent } from '../mycompany/mycompany.component';
import { UsersService } from '../../services/users.service';
import { ThemeService } from '../../services/theme.service';
import { PushService } from '../../services/push.service';
import { CompanyContextService } from '../../services/company-context.service';
import { PortalCompany } from '../../services/portal.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, SharedModule, TranslatePipe, PortalOverviewComponent, PortalCustomersComponent, PortalSubscriptionsComponent, PortalInvoicesComponent, PortalAnalysisComponent, PortalUsersComponent, PortalPricingPlansComponent, PortalLogsComponent, PortalPasswordsComponent, PortalCompanyComponent, PortalMyCompanyComponent],
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

    pwaPrompt:    any  = null;
    pwaInstalled       = false;

    langDropdownOpen     = false;
    contactDropdownOpen  = false;
    companyDropdownOpen  = false;
    companies: PortalCompany[] = [];
    selectedCompanyId: string | null = null;
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
        private translate: TranslateService,
        public themeService: ThemeService,
        private pushService: PushService,
        public companyContextService: CompanyContextService
    ) {}

    private readonly onBeforeInstallPrompt = (e: Event) => { e.preventDefault(); this.pwaPrompt = e; };
    private readonly onAppInstalled        = ()          => { this.pwaPrompt = null; this.pwaInstalled = true; };

    private swapManifest(href: string): void {
        const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
        if (link) link.href = href;
    }

    ngOnInit(): void {
        this.swapManifest('assets/portal-manifest.json');
        window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
        window.addEventListener('appinstalled',        this.onAppInstalled);
        this.pushService.subscribe().catch(() => {});
        this.currentLanguage = this.translate.currentLang ?? localStorage.getItem('language') ?? 'nl';
        this.user = this.authService.getUser() ?? { firstName: 'Unknown', lastName: '', email: '', role: '', company: '', phone: '', birthDate: '' };
        if (this.isCustomer) this.currentView = 'mycompany';
        if (this.user.id && Number.isInteger(this.user.id) && this.user.id > 0) {
            this.usersService.getUserById(this.user.id)
                .pipe(takeUntil(this.destroy$))
                .subscribe({ next: r => {
                    if (r.data) {
                        this.userAvatar        = r.data.avatar    ?? null;
                        this.user.role         = r.data.role      || this.user.role;
                        this.user.firstName    = r.data.firstName || this.user.firstName;
                        this.user.lastName     = r.data.lastName  || this.user.lastName;
                        this.user.company      = r.data.company   || this.user.company;
                        this.user.phone        = r.data.phone     || this.user.phone;
                        this.user.birthDate    = r.data.birthDate || this.user.birthDate;
                        this.user.customerId   = r.data.customerId  ?? this.user.customerId;
                        this.user.customerIds  = r.data.customerIds ?? this.user.customerIds;
                    }
                    if (this.isCustomer) this.initCompanySwitcher();
                }});
        }
        this.usersService.avatarUpdated$
            .pipe(takeUntil(this.destroy$))
            .subscribe(({ id, avatar }) => {
                if (id === this.user.id) this.userAvatar = avatar;
            });
    }

    ngOnDestroy(): void {
        this.swapManifest('assets/manifest.json');
        window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
        window.removeEventListener('appinstalled',        this.onAppInstalled);
        this.destroy$.next();
        this.destroy$.complete();
    }

    installPwa(): void {
        if (!this.pwaPrompt) return;
        this.pwaPrompt.prompt();
        this.pwaPrompt.userChoice.then(() => { this.pwaPrompt = null; });
    }

    private readonly adminViews = ['customers','subscriptions','invoices','users','analysis','pricing','logs','passwords','settings'];
    private readonly customerViews = ['mycompany','users'];

    navigateTo(view: string): void {
        if (this.isCustomer) {
            if (!this.customerViews.includes(view)) return;
        } else if (!this.isAdmin && this.adminViews.includes(view)) {
            return;
        }
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
        this.pushService.unsubscribe().finally(() => this.authService.logout());
    }

    getUserInitials(): string {
        return ((this.user.firstName?.[0] ?? '') + (this.user.lastName?.[0] ?? '')).toUpperCase();
    }

    get isAdmin(): boolean {
        return (this.user.role ?? '').toLowerCase() === 'admin';
    }

    get isCustomer(): boolean {
        return (this.user.role ?? '').toLowerCase() === 'customer';
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
            'mycompany':   'PORTAL.NAV.MY_COMPANY',
            customers:     'PORTAL.NAV.CUSTOMERS',
            subscriptions: 'PORTAL.NAV.SUBSCRIPTIONS',
            invoices:      'PORTAL.NAV.INVOICES',
            users:         'PORTAL.NAV.USERS',
            analysis:      'PORTAL.NAV.ANALYSIS',
            pricing:       'PORTAL.NAV.PRICING',
            logs:          'PORTAL.NAV.LOGS',
            passwords:     'PORTAL.NAV.PASSWORDS',
            settings:      'PORTAL.NAV.COMPANY'
        };
        return this.translate.instant(keys[this.currentView] ?? 'PORTAL.NAV.OVERVIEW');
    }

    toggleLangDropdown(event: Event): void {
        event.stopPropagation();
        this.contactDropdownOpen = false;
        this.companyDropdownOpen = false;
        this.langDropdownOpen = !this.langDropdownOpen;
    }

    toggleContactDropdown(event: Event): void {
        event.stopPropagation();
        this.langDropdownOpen = false;
        this.companyDropdownOpen = false;
        this.contactDropdownOpen = !this.contactDropdownOpen;
    }

    toggleCompanyDropdown(event: Event): void {
        event.stopPropagation();
        this.langDropdownOpen = false;
        this.contactDropdownOpen = false;
        this.companyDropdownOpen = !this.companyDropdownOpen;
    }

    private initCompanySwitcher(): void {
        this.companyContextService.companies$
            .pipe(takeUntil(this.destroy$))
            .subscribe(companies => this.companies = companies);
        this.companyContextService.selectedCustomerId$
            .pipe(takeUntil(this.destroy$))
            .subscribe(id => this.selectedCompanyId = id);
        this.companyContextService.init();
    }

    get selectedCompanyName(): string {
        return this.companies.find(c => c.id === this.selectedCompanyId)?.name ?? '';
    }

    selectCompany(id: string): void {
        this.companyContextService.selectCompany(id);
        this.companyDropdownOpen = false;
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
        if (this.contactDropdownOpen) this.contactDropdownOpen = false;
        if (this.companyDropdownOpen) this.companyDropdownOpen = false;
    }
}