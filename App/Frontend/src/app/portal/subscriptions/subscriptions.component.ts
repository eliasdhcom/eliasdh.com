/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersService, Customer, CustomerWebsite } from '../../services/customers.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
    imports: [CommonModule],
    templateUrl: './subscriptions.component.html',
    styleUrls: ['./subscriptions.component.css']
})
export class PortalSubscriptionsComponent implements OnInit, OnDestroy {
    subscriptions: FlatSubscription[] = [];
    loading = true;
    error = '';
    searchQuery = '';
    filterLive: 'all' | 'live' | 'inactive' = 'all';
    _highlightId: string | null = null;
    failedGroupLogos = new Set<string>();
    private pendingHighlightId: string | null = null;
    private destroy$ = new Subject<void>();

    @Input()
    set highlightId(val: string | null) {
        this.pendingHighlightId = val;
        if (val && !this.loading) this.doHighlight(val);
    }

    constructor(private customersService: CustomersService) {}

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
        this.customersService.getAllCustomers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.subscriptions = (response.data ?? [])
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
    }

    getMultiplier(freq: string): number {
        if (freq === 'yearly') return 12;
        if (freq === 'quarterly') return 3;
        return 1;
    }

    getPeriodPayment(s: FlatSubscription): number { return s.payment * this.getMultiplier(s.frequency); }
    getPeriodDiscount(s: FlatSubscription): number { return s.discount * this.getMultiplier(s.frequency); }

    getSubtotal(s: FlatSubscription): number {
        return (s.subtotal ?? Math.max(0, s.payment - s.discount)) * this.getMultiplier(s.frequency);
    }
    getVat(s: FlatSubscription): number {
        const monthlySub = s.subtotal ?? Math.max(0, s.payment - s.discount);
        return (s.vat ?? monthlySub * VAT_RATE) * this.getMultiplier(s.frequency);
    }
    getTotal(s: FlatSubscription): number {
        const monthlySub = s.subtotal ?? Math.max(0, s.payment - s.discount);
        return (s.total ?? monthlySub * (1 + VAT_RATE)) * this.getMultiplier(s.frequency);
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

    getSubscriptionClass(type: string): string {
        const t = type.toLowerCase();
        if (t.includes('enterprise')) return 'subscriptions-badge--enterprise';
        if (t.includes('business'))   return 'subscriptions-badge--business';
        if (t.includes('startup'))    return 'subscriptions-badge--startup';
        if (t.includes('growth'))     return 'subscriptions-badge--growth';
        if (t.includes('basic'))      return 'subscriptions-badge--basic';
        if (t.includes('free'))       return 'subscriptions-badge--free';
        if (t.includes('todo'))       return 'subscriptions-badge--todo';
        return 'subscriptions-badge--custom';
    }

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