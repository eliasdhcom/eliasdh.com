/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersService, Customer } from '../../services/customers.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-portal-customers',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './customers.component.html',
    styleUrls: ['./customers.component.css']
})
export class PortalCustomersComponent implements OnInit, OnDestroy {
    customers: Customer[] = [];
    loading = true;
    error = '';
    searchQuery = '';
    expandedId: string | null = null;
    failedLogos = new Set<string>();
    encodeURIComponent = encodeURIComponent;
    private destroy$ = new Subject<void>();

    @Output() navigateToSubscription = new EventEmitter<string>();

    constructor(private customersService: CustomersService) {}

    ngOnInit(): void {
        this.loadCustomers();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadCustomers(): void {
        this.loading = true;
        this.error = '';
        this.customersService.getAllCustomers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.customers = (response.data ?? []).filter(c => !c.isHQ);
                    this.loading = false;
                },
                error: () => {
                    this.error = 'Klanten konden niet worden geladen.';
                    this.loading = false;
                }
            });
    }

    get filteredCustomers(): Customer[] {
        if (!this.searchQuery.trim()) return this.customers;
        const q = this.searchQuery.toLowerCase();
        return this.customers.filter(c => {
            if (c.id.toLowerCase().includes(q)) return true;
            if (c.name.toLowerCase().includes(q)) return true;
            if (c.vat.toLowerCase().includes(q)) return true;
            if (`${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase().includes(q)) return true;
            return c.locations?.some(loc =>
                `${loc.street} ${loc.number} ${loc.city} ${loc.postalCode}`.toLowerCase().includes(q)
            ) ?? false;
        });
    }

    onSubscriptionItemClick(websiteId: string): void {
        this.navigateToSubscription.emit(websiteId);
    }

    onSearch(event: Event): void {
        this.searchQuery = (event.target as HTMLInputElement).value;
    }

    toggleExpand(id: string): void {
        this.expandedId = this.expandedId === id ? null : id;
    }

    handleLogoError(id: string): void {
        this.failedLogos.add(id);
    }

    showLogo(customer: Customer): boolean {
        return !!customer.logo && !this.failedLogos.has(customer.id);
    }

    getInitials(name: string): string {
        return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
    }

    formatAddress(loc: Customer['locations'][0]): string {
        return `${loc.street} ${loc.number}, ${loc.postalCode} ${loc.city}`;
    }

    getSubscriptionClass(type: string): string {
        const t = type.toLowerCase();
        if (t.includes('enterprise')) return 'customers-badge--enterprise';
        if (t.includes('business'))   return 'customers-badge--business';
        if (t.includes('startup'))    return 'customers-badge--startup';
        if (t.includes('growth'))     return 'customers-badge--growth';
        if (t.includes('basic'))      return 'customers-badge--basic';
        if (t.includes('free'))       return 'customers-badge--free';
        if (t.includes('todo'))       return 'customers-badge--todo';
        return 'customers-badge--custom';
    }

    getVisibleBadges(customer: Customer) {
        return customer.websites?.slice(0, 3) ?? [];
    }

    getExtraBadgeCount(customer: Customer): number {
        return Math.max(0, (customer.websites?.length ?? 0) - 3);
    }

    hasContactInfo(customer: Customer): boolean {
        return !!(customer.firstName || customer.lastName || customer.email || customer.phone || customer.mobile);
    }
}
