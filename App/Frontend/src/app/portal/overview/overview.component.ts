/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { CustomersService, Customer, SubscriptionFrequency } from '../../services/customers.service';
import { InvoicesService, InvoiceStatus } from '../../services/invoices.service';
import { PricingPlansService } from '../../services/pricing-plans.service';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

interface MonthBar {
    label: string;
    amount: number;
    paidAmount: number;
    outstandingAmount: number;
    isPast: boolean;
    isCurrent: boolean;
    isFuture: boolean;
}

interface TypeStat {
    type: string;
    count: number;
    liveCount: number;
    color: string;
}

const VAT_RATE = 0.21;
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Component({
    selector: 'app-portal-overview',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.css']
})
export class PortalOverviewComponent implements OnInit, OnDestroy {
    @Output() navigateTo = new EventEmitter<string>();

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

    constructor(
        private customersService: CustomersService,
        private invoicesService: InvoicesService,
        readonly pricingPlansService: PricingPlansService
    ) {}

    ngOnInit(): void  { this.loadData(); }
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadData(): void {
        this.loading = true;
        forkJoin({
            customers: this.customersService.getAllCustomers(),
            statuses:  this.invoicesService.getAllStatuses().pipe(
                catchError(() => of({ success: true, data: [] as InvoiceStatus[] }))
            ),
            plans: this.pricingPlansService.getAll().pipe(
                catchError(() => of({ success: true, data: [] as any[] }))
            )
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ({ customers, statuses, plans }) => {
                this.pricingPlansService.setPlanColors(plans.data ?? []);
                this.computeStats(customers.data ?? [], statuses.data ?? []);
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    private computeStats(customers: Customer[], invoiceStatuses: InvoiceStatus[]): void {
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
                    const subtotal = Math.max(0, website.payment - website.discount);
                    mrrTotal += subtotal * (1 + VAT_RATE);
                }
            }
        }
        this.mrr = mrrTotal;
        this.arr = mrrTotal * 12;

        const paidKeys = new Set(
            invoiceStatuses
                .filter(s => s.paid)
                .map(s => `${s.customerId}_${s.subscriptionId}_${s.periodStart}_${s.invoiceType}`)
        );

        const monthlyMap     = new Map<string, number>();
        const monthlyPaidMap = new Map<string, number>();
        let paid = 0, paidCnt = 0, outstanding = 0, outstandingCnt = 0;

        const addInvoice = (invoiceKey: string, start: Date, amount: number) => {
            const monthKey = `${start.getFullYear()}-${start.getMonth()}`;
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + amount);
            if (paidKeys.has(invoiceKey)) {
                paid += amount;
                paidCnt++;
                monthlyPaidMap.set(monthKey, (monthlyPaidMap.get(monthKey) ?? 0) + amount);
            } else {
                outstanding += amount;
                outstandingCnt++;
            }
        };

        for (const customer of nonHQ) {
            for (const website of (customer.websites ?? [])) {
                if (!website.startDate) continue;
                const isFree = this.isFreeOrTodo(website.subscriptionType);
                if (website.payment <= 0 || isFree) continue;

                const m        = this.getMultiplier(website.frequency);
                const subtotal = Math.max(0, website.payment - website.discount);
                const amt      = subtotal * (1 + VAT_RATE) * m;
                for (const { start } of this.getBillingPeriods(website.startDate, website.frequency, endDate)) {
                    const k = `${customer.id}_${website.id}_${start.toISOString()}_subscription`;
                    addInvoice(k, start, amt);
                }
            }

            for (const domain of (customer.domains ?? [])) {
                if (!domain.renewalDate || domain.annualPrice <= 0) continue;
                const domainId = `domain:${String(domain.id ?? 0).padStart(4, '0')}`;
                const amt      = +(domain.annualPrice * (1 + VAT_RATE)).toFixed(2);
                for (const { start } of this.getBillingPeriods(domain.renewalDate, 'yearly', endDate)) {
                    const k = `${customer.id}_${domainId}_${start.toISOString()}_domain`;
                    addInvoice(k, start, amt);
                }
            }
        }

        this.paidAmount          = paid;
        this.paidCount           = paidCnt;
        this.outstandingAmount   = outstanding;
        this.outstandingCount    = outstandingCnt;
        this.totalInvoicedAmount = paid + outstanding;
        this.totalInvoiceCount   = paidCnt + outstandingCnt;

        this.monthBars = MONTH_LABELS.map((label, m) => {
            const total = monthlyMap.get(`${currentYear}-${m}`) ?? 0;
            const paidM = monthlyPaidMap.get(`${currentYear}-${m}`) ?? 0;
            return {
                label,
                amount:          total,
                paidAmount:      paidM,
                outstandingAmount: Math.max(0, total - paidM),
                isPast:    m < currentMonth,
                isCurrent: m === currentMonth,
                isFuture:  m > currentMonth
            };
        });
        this.chartMax = Math.max(...this.monthBars.map(b => b.amount), 1);

        const typeMap     = new Map<string, number>();
        const typeLiveMap = new Map<string, number>();
        for (const w of allWebsites) {
            const t = w.subscriptionType || 'Custom';
            typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
            if (w.isLive) typeLiveMap.set(t, (typeLiveMap.get(t) ?? 0) + 1);
        }
        this.typeStats = Array.from(typeMap.entries())
            .map(([type, count]) => ({
                type,
                count,
                liveCount: typeLiveMap.get(type) ?? 0,
                color: this.pricingPlansService.getPlanColor(type)
            }));

        const coveredKeywords = new Set<string>();
        for (const s of this.typeStats) {
            for (const kw of this.STANDARD_TYPES.map(t => t.label.toLowerCase())) {
                if (s.type.toLowerCase().includes(kw)) coveredKeywords.add(kw);
            }
        }
        for (const { label } of this.STANDARD_TYPES) {
            if (!coveredKeywords.has(label.toLowerCase())) {
                this.typeStats.push({ type: label, count: 0, liveCount: 0, color: this.pricingPlansService.getPlanColor(label) });
            }
        }
        this.typeStats.sort((a, b) => this.getTypeOrder(a.type) - this.getTypeOrder(b.type));
    }

    private isFreeOrTodo(type: string): boolean {
        return type.toLowerCase().includes('free');
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

    private readonly STANDARD_TYPES: { label: string }[] = [
        { label: 'Free'       },
        { label: 'Basic'      },
        { label: 'Startup'    },
        { label: 'Growth'     },
        { label: 'Business'   },
        { label: 'Enterprise' },
    ];

    private readonly TYPE_ORDER = ['free', 'basic', 'startup', 'growth', 'business', 'enterprise'];

    private getTypeOrder(type: string): number {
        const t = type.toLowerCase();
        for (let i = 0; i < this.TYPE_ORDER.length; i++) {
            if (t.includes(this.TYPE_ORDER[i])) return i;
        }
        return this.TYPE_ORDER.length;
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