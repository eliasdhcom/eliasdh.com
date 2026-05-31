/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CustomersService, Customer } from '../../services/customers.service';
import { CostsService, CostItem } from '../../services/costs.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const VAT_RATE    = 0.21;
const DOMAIN_EXCL = 8.26;
const TAX_RATE    = 0.20;
const WORK_HOURS  = 2080;
const DAYS_YEAR   = 365;

@Component({
    selector:    'app-portal-analysis',
    standalone:  true,
    imports:     [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './analysis.component.html',
    styleUrls:   ['./analysis.component.css']
})
export class PortalAnalysisComponent implements OnInit, OnDestroy {
    loading      = true;
    revenueExcl  = 0;
    revenueIncl  = 0;

    costs: CostItem[] = [];

    savingIds  = new Set<number>();
    addingCost = false;

    private destroy$ = new Subject<void>();

    constructor(
        private customersService: CustomersService,
        private costsService: CostsService
    ) {}

    ngOnInit(): void { this.loadData(); }
    ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

    loadData(): void {
        this.loading = true;
        forkJoin({
            customers: this.customersService.getAllCustomers(),
            costs:     this.costsService.getAll()
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ({ customers, costs }) => {
                this.computeRevenue(customers.data ?? []);
                this.costs  = costs.data ?? [];
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    private computeRevenue(customers: Customer[]): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let annualExcl = 0;

        for (const customer of customers.filter(c => !c.isHQ)) {
            for (const website of (customer.websites ?? [])) {
                if (!website.isLive || !website.startDate) continue;
                if (new Date(website.startDate) > today)   continue;

                const isFree = website.subscriptionType.toLowerCase().includes('free') ||
                               website.subscriptionType.toLowerCase().includes('todo');

                if (website.payment > 0 && !isFree && website.frequency !== 'one-time') {
                    annualExcl += Math.max(0, website.payment - website.discount) * 12;
                }
                if (!isFree) annualExcl += DOMAIN_EXCL;
            }
        }

        this.revenueExcl = annualExcl;
        this.revenueIncl = annualExcl * (1 + VAT_RATE);
    }

    // ── Totals ──────────────────────────────────────────────────────

    get totalAnnualCosts(): number {
        return this.costs.reduce((s, c) => s + this.annualCost(c), 0);
    }

    get totalAnnualFixedCosts(): number {
        return this.costs.filter(c => c.type === 'fixed').reduce((s, c) => s + this.annualCost(c), 0);
    }

    get totalAnnualVariableCosts(): number {
        return this.costs.filter(c => c.type === 'variable').reduce((s, c) => s + this.annualCost(c), 0);
    }

    annualCost(c: CostItem): number {
        if (c.frequency === 'monthly')   return c.amount * 12;
        if (c.frequency === 'quarterly') return c.amount * 4;
        return c.amount;
    }

    // ── CRUD ────────────────────────────────────────────────────────

    addCost(): void {
        if (this.addingCost) return;
        this.addingCost = true;
        this.costsService.create({ name: '', amount: 0, frequency: 'yearly', type: 'fixed' })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (r) => { this.costs.push(r.data); this.addingCost = false; },
                error: ()  => { this.addingCost = false; }
            });
    }

    saveCost(cost: CostItem): void {
        if (this.savingIds.has(cost.id)) return;
        this.savingIds.add(cost.id);
        this.costsService.update(cost.id, {
            name:      cost.name,
            amount:    cost.amount,
            frequency: cost.frequency,
            type:      cost.type
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next:  () => this.savingIds.delete(cost.id),
            error: () => this.savingIds.delete(cost.id)
        });
    }

    removeCost(id: number): void {
        this.costsService.delete(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: () => { this.costs = this.costs.filter(c => c.id !== id); } });
    }

    isSaving(id: number): boolean { return this.savingIds.has(id); }

    // ── Profit ──────────────────────────────────────────────────────

    get grossProfitYear(): number { return this.revenueExcl - this.totalAnnualCosts; }
    get taxYear(): number          { return Math.max(0, this.grossProfitYear) * TAX_RATE; }
    get netProfitYear(): number    { return this.grossProfitYear - this.taxYear; }

    // ── Per period ──────────────────────────────────────────────────

    revenueFor(divisor: number): number     { return this.revenueExcl / divisor; }
    revenueInclFor(divisor: number): number { return this.revenueIncl / divisor; }
    grossFor(divisor: number): number       { return this.grossProfitYear / divisor; }
    taxFor(divisor: number): number         { return this.taxYear / divisor; }
    netFor(divisor: number): number         { return this.netProfitYear / divisor; }

    readonly periods = [
        { label: 'Per uur',      note: `${WORK_HOURS} u/jaar`,  divisor: WORK_HOURS },
        { label: 'Per dag',      note: `${DAYS_YEAR} dgn/jaar`, divisor: DAYS_YEAR  },
        { label: 'Per maand',    note: '12 mnd/jaar',           divisor: 12         },
        { label: 'Per kwartaal', note: '4 kw/jaar',             divisor: 4          },
        { label: 'Per jaar',     note: 'volledig boekjaar',     divisor: 1          }
    ];

    fmt(n: number): string {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n);
    }

    trackById(_: number, item: CostItem): number { return item.id; }
}
