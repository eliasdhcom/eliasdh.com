/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { CustomersService, Customer } from '../../services/customers.service';
import { InvoicesService, InvoiceStatus } from '../../services/invoices.service';
import { InvoiceBuilderService } from '../../services/invoice-builder.service';
import { PricingPlansService } from '../../services/pricing-plans.service';
import { ClusterComponent } from '../../shared/cluster/cluster.component';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

interface MonthBar {
    label: string;
    amount: number;
    paidAmount: number;
    outstandingAmount: number;
    isPast: boolean;
    isCurrent: boolean;
    isForecast: boolean;
}

interface TypeStat {
    type: string;
    count: number;
    liveCount: number;
    color: string;
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Component({
    selector: 'app-portal-overview',
    standalone: true,
    imports: [CommonModule, TranslatePipe, ClusterComponent],
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

    relevantNamespaces: string[] = [];

    private destroy$ = new Subject<void>();

    constructor(
        private customersService: CustomersService,
        private invoicesService: InvoicesService,
        private invoiceBuilderService: InvoiceBuilderService,
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
                this.computeStats(customers.data ?? [], statuses.data ?? [], plans.data ?? []);
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    private computeStats(customers: Customer[], invoiceStatuses: InvoiceStatus[], allPlans: { name: string }[] = []): void {
        const now          = new Date();
        const currentYear  = now.getFullYear();
        const currentMonth = now.getMonth();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nonHQ       = customers.filter(c => !c.isHQ);
        const allWebsites = nonHQ.flatMap(c => c.websites ?? []);

        // Parse as local date to avoid UTC-offset causing off-by-one day errors
        const parseLocal = (s: string) => {
            const p = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            return p ? new Date(+p[1], +p[2] - 1, +p[3]) : new Date(s);
        };

        const isActuallyLive = (w: { isLive: boolean; startDate?: string }) =>
            w.isLive && !!w.startDate && parseLocal(w.startDate) <= today;

        this.customerCount = nonHQ.length;
        this.liveCount     = allWebsites.filter(isActuallyLive).length;
        this.inactiveCount = allWebsites.length - this.liveCount;
        this.totalWebsites = allWebsites.length;
        this.relevantNamespaces = Array.from(new Set(
            allWebsites.filter(isActuallyLive).map(w => this.urlToNamespace(w.url))
        ));

        let mrrTotal = 0;
        for (const customer of nonHQ) {
            for (const website of (customer.websites ?? [])) {
                if (!isActuallyLive(website)) continue;
                if (website.frequency === 'one-time') continue;
                const isFree = this.isFreeOrTodo(website.subscriptionType);
                if (website.payment > 0 && !isFree) {
                    const subtotal = Math.max(0, website.payment - website.discount);
                    mrrTotal += subtotal;
                }
            }
        }
        this.mrr = mrrTotal;
        this.arr = mrrTotal * 12;

        const monthlyMap     = new Map<string, number>();
        const monthlyPaidMap = new Map<string, number>();
        let paid = 0, paidCnt = 0, outstanding = 0, outstandingCnt = 0;

        const allInvoices = this.invoiceBuilderService.buildInvoices(customers, invoiceStatuses);
        for (const inv of allInvoices) {
            const monthKey = `${inv.issueDate.getFullYear()}-${inv.issueDate.getMonth()}`;
            if (inv.paid) {
                paid += inv.total;
                paidCnt++;
                monthlyMap.set(monthKey,     (monthlyMap.get(monthKey)     ?? 0) + inv.total);
                monthlyPaidMap.set(monthKey, (monthlyPaidMap.get(monthKey) ?? 0) + inv.total);
            } else {
                outstanding += inv.total;
                outstandingCnt++;
                monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + inv.total);
            }
        }

        this.paidAmount          = paid;
        this.paidCount           = paidCnt;
        this.outstandingAmount   = outstanding;
        this.outstandingCount    = outstandingCnt;
        this.totalInvoicedAmount = paid + outstanding;
        this.totalInvoiceCount   = paidCnt + outstandingCnt;

        const bars: MonthBar[] = MONTH_LABELS.map((label, m) => {
            const total = monthlyMap.get(`${currentYear}-${m}`) ?? 0;
            const paidM = monthlyPaidMap.get(`${currentYear}-${m}`) ?? 0;
            return {
                label,
                amount:            total,
                paidAmount:        paidM,
                outstandingAmount: Math.max(0, total - paidM),
                isPast:     m < currentMonth,
                isCurrent:  m === currentMonth,
                isForecast: m > currentMonth
            };
        });

        const forecastEnd = currentMonth + 6;
        if (forecastEnd > 11) {
            const nextYear   = currentYear + 1;
            const extraCount = forecastEnd - 11;
            for (let m = 0; m < extraCount; m++) {
                const total = monthlyMap.get(`${nextYear}-${m}`) ?? 0;
                bars.push({
                    label:             `${MONTH_LABELS[m]} '${String(nextYear).slice(2)}`,
                    amount:            total,
                    paidAmount:        0,
                    outstandingAmount: 0,
                    isPast:            false,
                    isCurrent:         false,
                    isForecast:        true
                });
            }
        }

        this.monthBars = bars;
        this.chartMax  = Math.max(...bars.map(b => b.amount), 1);

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

        const coveredNames = new Set(this.typeStats.map(s => s.type.toLowerCase()));
        for (const plan of allPlans) {
            if (!coveredNames.has(plan.name.toLowerCase())) {
                this.typeStats.push({ type: plan.name, count: 0, liveCount: 0, color: this.pricingPlansService.getPlanColor(plan.name) });
            }
        }
        this.typeStats.sort((a, b) => {
            const priceDiff = this.pricingPlansService.getPlanPrice(a.type) - this.pricingPlansService.getPlanPrice(b.type);
            return priceDiff !== 0 ? priceDiff : a.type.localeCompare(b.type);
        });
    }

    private isFreeOrTodo(type: string): boolean {
        return type.toLowerCase().includes('free');
    }

    private urlToNamespace(url: string): string {
        return url
            .replace(/^https?:\/\//i, '')
            .replace(/\/.*$/, '')
            .replace(/\./g, '')
            .toLowerCase();
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

    get chartYearLabel(): string {
        const y = new Date().getFullYear();
        return new Date().getMonth() + 6 > 11 ? `${y} – ${y + 1}` : String(y);
    }
}