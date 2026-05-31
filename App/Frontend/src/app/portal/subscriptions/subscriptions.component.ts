/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { CustomersService, Customer, CustomerWebsite } from '../../services/customers.service';
import { PricingPlansService, PricingPlan } from '../../services/pricing-plans.service';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

export interface FlatSubscription extends CustomerWebsite {
    customerId: string;
    customerName: string;
    customerLogo?: string;
}

export interface SubscriptionGroup {
    customerId: string;
    customerName: string;
    customerLogo?: string;
    items: FlatSubscription[];
}

const VAT_RATE = 0.21;

@Component({
    selector: 'app-portal-subscriptions',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './subscriptions.component.html',
    styleUrls: ['./subscriptions.component.css']
})
export class PortalSubscriptionsComponent implements OnInit, OnDestroy {
    subscriptions: FlatSubscription[] = [];
    pricingPlanNames: string[] = [];
    loading = true;
    error = '';
    searchQuery = '';
    filterLive: 'all' | 'live' | 'inactive' = 'all';
    filterType: string | null = null;
    _highlightId: string | null = null;
    failedGroupLogos = new Set<string>();
    private pendingHighlightId: string | null = null;
    private destroy$ = new Subject<void>();

    @Input()
    set highlightId(val: string | null) {
        this.pendingHighlightId = val;
        if (val && !this.loading) this.doHighlight(val);
    }

    constructor(
        private customersService: CustomersService,
        private pricingPlansService: PricingPlansService
    ) {}

    ngOnInit(): void {
        this.loadSubscriptions();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadSubscriptions(): void {
        this.loading = true;
        this.error = '';
        forkJoin({
            customers: this.customersService.getAllCustomers(),
            plans:     this.pricingPlansService.getAll().pipe(
                catchError(() => of({ success: true, data: [] as PricingPlan[] }))
            )
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ({ customers, plans }) => {
                this.pricingPlanNames = (plans.data ?? []).map(p => p.name);
                this.pricingPlansService.setPlanColors(plans.data ?? []);
                this.subscriptions = (customers.data ?? [])
                    .filter((c: Customer) => !c.isHQ)
                    .flatMap((c: Customer) =>
                        (c.websites ?? []).map(w => ({
                            ...w,
                            customerId: c.id,
                            customerName: c.name,
                            customerLogo: c.logo
                        }))
                    )
                    .sort((a, b) => a.id.localeCompare(b.id));
                this.loading = false;
                if (this.pendingHighlightId) {
                    this.doHighlight(this.pendingHighlightId);
                    this.pendingHighlightId = null;
                }
            },
            error: () => {
                this.error = 'Subscriptions konden niet worden geladen.';
                this.loading = false;
            }
        });
    }

    get filteredSubscriptions(): FlatSubscription[] {
        return this.subscriptions.filter(s => {
            if (this.filterLive === 'live' && !s.isLive) return false;
            if (this.filterLive === 'inactive' && s.isLive) return false;
            if (this.filterType !== null && s.subscriptionType !== this.filterType) return false;
            if (!this.searchQuery.trim()) return true;
            const q = this.searchQuery.toLowerCase();
            return (
                s.id.toLowerCase().includes(q) ||
                s.customerId.toLowerCase().includes(q) ||
                s.name.toLowerCase().includes(q) ||
                s.url.toLowerCase().includes(q) ||
                s.customerName.toLowerCase().includes(q) ||
                s.subscriptionType.toLowerCase().includes(q)
            );
        });
    }

    get availableTypes(): { type: string; count: number }[] {
        const typeMap = new Map<string, number>();
        for (const s of this.subscriptions) {
            if (this.filterLive === 'live' && !s.isLive) continue;
            if (this.filterLive === 'inactive' && s.isLive) continue;
            typeMap.set(s.subscriptionType, (typeMap.get(s.subscriptionType) ?? 0) + 1);
        }
        return Array.from(typeMap.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => {
                const ia = this.pricingPlanNames.findIndex(n => n.toLowerCase() === a.type.toLowerCase());
                const ib = this.pricingPlanNames.findIndex(n => n.toLowerCase() === b.type.toLowerCase());
                if (ia !== -1 && ib !== -1) return ia - ib;
                if (ia !== -1) return -1;
                if (ib !== -1) return 1;
                return a.type.localeCompare(b.type);
            });
    }

    get availableTypeTotal(): number {
        return this.availableTypes.reduce((sum, t) => sum + t.count, 0);
    }

    get groupedFilteredSubscriptions(): SubscriptionGroup[] {
        const map = new Map<string, SubscriptionGroup>();
        for (const s of this.filteredSubscriptions) {
            if (!map.has(s.customerId)) {
                map.set(s.customerId, {
                    customerId: s.customerId,
                    customerName: s.customerName,
                    customerLogo: s.customerLogo,
                    items: []
                });
            }
            map.get(s.customerId)!.items.push(s);
        }
        return Array.from(map.values()).sort((a, b) => a.customerId.localeCompare(b.customerId));
    }

    get liveCount(): number { return this.subscriptions.filter(s => s.isLive).length; }
    get inactiveCount(): number { return this.subscriptions.filter(s => !s.isLive).length; }

    onSearch(event: Event): void {
        this.searchQuery = (event.target as HTMLInputElement).value;
    }

    setFilter(filter: 'all' | 'live' | 'inactive'): void {
        this.filterLive = filter;
        this.filterType = null;
    }

    setTypeFilter(type: string | null): void {
        this.filterType = type;
    }

    getTotal(s: FlatSubscription): number {
        const subtotal = Math.max(0, s.payment - s.discount);
        const multiplier = s.frequency === 'yearly' ? 12 : s.frequency === 'quarterly' ? 3 : 1;
        return subtotal * (1 + VAT_RATE) * multiplier;
    }

    getFrequencyShort(freq: string): string {
        const labels: Record<string, string> = { 'monthly': 'mnd', 'quarterly': 'kw', 'yearly': 'jaar', 'one-time': 'eenmalig' };
        return labels[freq] ?? freq;
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    getFrequencyLabel(freq: string): string {
        const labels: Record<string, string> = {
            'monthly':   'Maandelijks',
            'quarterly': 'Kwartaal',
            'yearly':    'Jaarlijks',
            'one-time':  'Eenmalig'
        };
        return labels[freq] ?? freq;
    }

    getBadgeStyle(type: string) { return this.pricingPlansService.getBadgeStyle(type); }

    getGroupInitials(name: string): string {
        return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
    }

    showGroupLogo(group: SubscriptionGroup): boolean {
        return !!group.customerLogo && !this.failedGroupLogos.has(group.customerId);
    }

    handleGroupLogoError(customerId: string): void {
        this.failedGroupLogos.add(customerId);
    }

    private doHighlight(id: string): void {
        this._highlightId = id;
        setTimeout(() => {
            const el = document.getElementById('sub-' + id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
        setTimeout(() => { this._highlightId = null; }, 4000);
    }
}