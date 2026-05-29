/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 08/04/2026
**/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { AuthService, AuthUser } from '../../services/auth.service';
import { PortalCustomersComponent } from '../customers/customers.component';
import { PortalSubscriptionsComponent } from '../subscriptions/subscriptions.component';
import { PortalInvoicesComponent } from '../invoices/invoices.component';
import { PortalOverviewComponent } from '../overview/overview.component';
import { PortalAnalysisComponent } from '../analysis/analysis.component';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, SharedModule, PortalOverviewComponent, PortalCustomersComponent, PortalSubscriptionsComponent, PortalInvoicesComponent, PortalAnalysisComponent],
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

    user: AuthUser = { firstName: '', lastName: '', email: '', role: '', company: '', phone: '', street: '', houseNumber: '', postalCode: '', city: '', country: '', birthDate: '' };

    constructor(private authService: AuthService) {}

    ngOnInit(): void {
        this.user = this.authService.getUser() ?? { firstName: 'Unknown', lastName: '', email: '', role: '', company: '', phone: '', street: '', houseNumber: '', postalCode: '', city: '', country: '', birthDate: '' };
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

    getViewTitle(): string {
        const titles: Record<string, string> = {
            overview:      'Overview',
            customers:     'Customers',
            subscriptions: 'Subscriptions',
            invoices:      'Invoices',
            analysis:      'Analysis',
            settings:      'Settings'
        };
        return titles[this.currentView] ?? 'Dashboard';
    }
}
