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
import { PortalUsersComponent } from '../users/users.component';
import { UsersService } from '../../services/users.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, SharedModule, PortalOverviewComponent, PortalCustomersComponent, PortalSubscriptionsComponent, PortalInvoicesComponent, PortalAnalysisComponent, PortalUsersComponent],
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

    constructor(private authService: AuthService, private usersService: UsersService) {}

    ngOnInit(): void {
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
        const titles: Record<string, string> = {
            overview:      'Overview',
            customers:     'Customers',
            subscriptions: 'Subscriptions',
            invoices:      'Invoices',
            users:         'Users',
            analysis:      'Analysis',
            settings:      'Settings'
        };
        return titles[this.currentView] ?? 'Dashboard';
    }
}
