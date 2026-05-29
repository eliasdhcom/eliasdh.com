/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersService, Customer, SubscriptionFrequency } from '../../services/customers.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface MonthBar {
    label: string;
    amount: number;
    isPast: boolean;
    isCurrent: boolean;
    isFuture: boolean;
}

interface TypeStat {
    type: string;
    count: number;
    liveCount: number;
    cssClass: string;
}

const VAT_RATE   = 0.21;
const DOMAIN_VAT = +(8.26 * (1 + VAT_RATE)).toFixed(2);
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Component({
    selector: 'app-portal-overview',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.css']
})
export class PortalOverviewComponent implements OnInit, OnDestroy {
    loading = true;

    customerCount       = 0;
    liveCount           = 0;
    inactiveCount       = 0;
    mrr                 = 0;
    arr                 = 0;
    paidAmount          = 0;
    paidCount           = 0;
    outstandingAmount   = 0;
    outstandingCount    = 0;
    totalInvoicedAmount = 0;
    totalInvoiceCount   = 0;
    totalWebsites       = 0;

    monthBars: MonthBar[] = [];
    chartMax              = 1;
    typeStats: TypeStat[] = [];

    private destroy$ = new Subject<void>();

    constructor(private customersService: CustomersService) {}

    ngOnInit(): void  { this.loadData(); }
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadData(): void {
        this.loading = true;
        this.customersService.getAllCustomers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (r) => { this.computeStats(r.data ?? []); this.loading = false; },
                error: ()  => { this.loading = false; }
            });
    }

    private computeStats(customers: Customer[]): void {
        const now          = new Date();
        const currentYear  = now.getFullYear();
        const currentMonth = now.getMonth();
        const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);

        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 2, 0);
        endDate.setHours(23, 59, 59, 999);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nonHQ       = customers.filter(c => !c.isHQ);
        const allWebsites = nonHQ.flatMap(c => c.websites ?? []);

        const isActuallyLive = (w: { isLive: boolean; startDate?: string }) =>
            w.isLive && !!w.startDate && new Date(w.startDate) <= today;

        this.customerCount = nonHQ.length;
        this.liveCount     = allWebsites.filter(isActuallyLive).length;
        this.inactiveCount = allWebsites.length - this.liveCount;
        this.totalWebsites = allWebsites.length;

        let mrrTotal = 0;
        for (const customer of nonHQ) {
            for (const website of (customer.websites ?? [])) {
                if (!isActuallyLive(website)) continue;
                if (website.frequency === 'one-time') continue;
                const isFree = this.isFreeOrTodo(website.subscriptionType);
                if (website.payment > 0 && !isFree) {
                    const subtotal = website.subtotal ?? Math.max(0, website.payment - website.discount);
                    mrrTotal += subtotal * (1 + VAT_RATE);
                }
            }
        }
        this.mrr = mrrTotal;
        this.arr = mrrTotal * 12;

        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        const monthlyMap = new Map<string, number>();
        let paid = 0, paidCnt = 0, outstanding = 0, outstandingCnt = 0;

        const addInvoice = (start: Date, amount: number) => {
            const key = `${start.getFullYear()}-${start.getMonth()}`;
            monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + amount);
            if (start < currentMonthStart) {
                paid += amount;
                paidCnt++;
            } else {
                outstanding += amount;
                outstandingCnt++;
            }
        };

        for (const customer of nonHQ) {
            for (const website of (customer.websites ?? [])) {
                if (!website.startDate) continue;
                const isFree = this.isFreeOrTodo(website.subscriptionType);

                if (website.payment > 0 && !isFree) {
                    const m   = this.getMultiplier(website.frequency);
                    const ms  = website.subtotal ?? Math.max(0, website.payment - website.discount);
                    const amt = (website.total ?? ms * (1 + VAT_RATE)) * m;
                    for (const { start } of this.getBillingPeriods(website.startDate, website.frequency, endDate)) {
                        addInvoice(start, amt);
                    }
                }

                if (!isFree) {
                    for (const { start } of this.getBillingPeriods(website.startDate, 'yearly', endDate)) {
                        addInvoice(start, DOMAIN_VAT);
                    }
                }
            }
        }

        this.paidAmount          = paid;
        this.paidCount           = paidCnt;
        this.outstandingAmount   = outstanding;
        this.outstandingCount    = outstandingCnt;
        this.totalInvoicedAmount = paid + outstanding;
        this.totalInvoiceCount   = paidCnt + outstandingCnt;

        this.monthBars = MONTH_LABELS.map((label, m) => ({
            label,
            amount: monthlyMap.get(`${currentYear}-${m}`) ?? 0,
            isPast:    m < currentMonth,
            isCurrent: m === currentMonth,
            isFuture:  m > currentMonth
        }));
        this.chartMax = Math.max(...this.monthBars.map(b => b.amount), 1);

        const typeMap     = new Map<string, number>();
        const typeLiveMap = new Map<string, number>();
        for (const w of allWebsites) {
            const t = w.subscriptionType || 'Custom';
            typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
            if (w.isLive) typeLiveMap.set(t, (typeLiveMap.get(t) ?? 0) + 1);
        }
        this.typeStats = Array.from(typeMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({
                type,
                count,
                liveCount: typeLiveMap.get(type) ?? 0,
                cssClass: this.getTypeClass(type)
            }));
    }

    private isFreeOrTodo(type: string): boolean {
        const t = type.toLowerCase();
        return t.includes('free') || t.includes('todo');
    }

    private getMultiplier(freq: string): number {
        if (freq === 'yearly')    return 12;
        if (freq === 'quarterly') return 3;
        return 1;
    }

    private getBillingPeriods(startDateStr: string, frequency: SubscriptionFrequency, endDate: Date): { start: Date; end: Date }[] {
        const periods: { start: Date; end: Date }[] = [];
        const startDate = new Date(startDateStr);
        if (isNaN(startDate.getTime())) return periods;

        if (frequency === 'one-time') {
            const end = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
            if (startDate <= endDate) periods.push({ start: startDate, end });
            return periods;
        }

        let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (cursor <= endDate) {
            const periodStart = new Date(cursor);
            let periodEnd: Date;
            switch (frequency) {
                case 'monthly':
                    periodEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
                    cursor    = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
                    break;
                case 'quarterly':
                    periodEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 0);
                    cursor    = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);
                    break;
                case 'yearly':
                    periodEnd = new Date(cursor.getFullYear() + 1, cursor.getMonth(), 0);
                    cursor    = new Date(cursor.getFullYear() + 1, cursor.getMonth(), 1);
                    break;
                default: return periods;
            }
            if (periodStart <= endDate) periods.push({ start: periodStart, end: periodEnd });
        }
        return periods;
    }

    private getTypeClass(type: string): string {
        const t = type.toLowerCase();
        if (t.includes('enterprise')) return 'overview-badge--enterprise';
        if (t.includes('business'))   return 'overview-badge--business';
        if (t.includes('startup'))    return 'overview-badge--startup';
        if (t.includes('growth'))     return 'overview-badge--growth';
        if (t.includes('basic'))      return 'overview-badge--basic';
        if (t.includes('free'))       return 'overview-badge--free';
        if (t.includes('todo'))       return 'overview-badge--todo';
        return 'overview-badge--custom';
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    formatCurrencyFull(amount: number): string {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    getBarHeight(amount: number): number {
        return this.chartMax > 0 ? Math.max((amount / this.chartMax) * 100, amount > 0 ? 3 : 0) : 0;
    }

    getTypeBarWidth(count: number): number {
        return this.totalWebsites > 0 ? (count / this.totalWebsites) * 100 : 0;
    }

    get currentYear(): number { return new Date().getFullYear(); }
}