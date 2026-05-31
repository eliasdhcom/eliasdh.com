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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface CostItem {
    id: number;
    name: string;
    amount: number;
    frequency: 'monthly' | 'quarterly' | 'yearly';
    type: 'fixed' | 'variable';
}

const VAT_RATE      = 0.21;
const DOMAIN_EXCL   = 8.26;
const TAX_RATE      = 0.20;
const WORK_HOURS    = 2080; // 8h × 260 werkdagen
const DAYS_YEAR     = 365;

@Component({
    selector: 'app-portal-analysis',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    templateUrl: './analysis.component.html',
    styleUrls: ['./analysis.component.css']
})
export class PortalAnalysisComponent implements OnInit, OnDestroy {
    loading = true;
    revenueExcl  = 0;
    revenueIncl  = 0;

    costs: CostItem[] = [
        { id: 1, name: 'KBC-Business Pro Zichtrekening', amount: 4.25,   frequency: 'monthly', type: 'fixed' },
        { id: 2, name: 'KBC-Business Pro Debetkaart',    amount: 0.75,   frequency: 'monthly', type: 'fixed' },
        { id: 3, name: 'Aansprakelijkheidsverzekering',  amount: 382.40, frequency: 'yearly',  type: 'fixed' },
        { id: 4, name: 'Domain name (eliasdh.com)',      amount: 20.00,  frequency: 'yearly',  type: 'fixed' },
        { id: 5, name: 'Accountant',                     amount: 2200.00,frequency: 'yearly',  type: 'fixed' },
        { id: 6, name: 'Billit',                         amount: 25.00,  frequency: 'monthly', type: 'fixed' }
    ];
    private nextId = 8;
    private destroy$ = new Subject<void>();

    constructor(private customersService: CustomersService) {}

    ngOnInit(): void { this.loadRevenue(); }
    ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

    loadRevenue(): void {
        this.loading = true;
        this.customersService.getAllCustomers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (r) => { this.computeRevenue(r.data ?? []); this.loading = false; },
                error: ()  => { this.loading = false; }
            });
    }

    private computeRevenue(customers: Customer[]): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let annualExcl = 0;

        for (const customer of customers.filter(c => !c.isHQ)) {
            for (const website of (customer.websites ?? [])) {
                if (!website.isLive || !website.startDate) continue;
                if (new Date(website.startDate) > today) continue;

                const isFree = website.subscriptionType.toLowerCase().includes('free') || website.subscriptionType.toLowerCase().includes('todo');

                if (website.payment > 0 && !isFree && website.frequency !== 'one-time') {
                    const sub = Math.max(0, website.payment - website.discount);
                    annualExcl += sub * 12;
                }

                if (!isFree) annualExcl += DOMAIN_EXCL;
            }
        }

        this.revenueExcl = annualExcl;
        this.revenueIncl = annualExcl * (1 + VAT_RATE);
    }

    get totalAnnualCosts(): number {
        return this.costs.reduce((sum, c) => sum + this.annualCost(c), 0);
    }

    get totalAnnualFixedCosts(): number {
        return this.costs.filter(c => c.type === 'fixed').reduce((sum, c) => sum + this.annualCost(c), 0);
    }

    get totalAnnualVariableCosts(): number {
        return this.costs.filter(c => c.type === 'variable').reduce((sum, c) => sum + this.annualCost(c), 0);
    }

    annualCost(c: CostItem): number {
        if (c.frequency === 'monthly')   return c.amount * 12;
        if (c.frequency === 'quarterly') return c.amount * 4;
        return c.amount;
    }

    addCost(): void {
        this.costs.push({ id: this.nextId++, name: '', amount: 0, frequency: 'yearly', type: 'fixed' });
    }

    removeCost(id: number): void {
        this.costs = this.costs.filter(c => c.id !== id);
    }

    // ── Profit ──────────────────────────────────────────────────────

    get grossProfitYear(): number  { return this.revenueExcl - this.totalAnnualCosts; }
    get taxYear(): number           { return Math.max(0, this.grossProfitYear) * TAX_RATE; }
    get netProfitYear(): number     { return this.grossProfitYear - this.taxYear; }

    // ── Per period ──────────────────────────────────────────────────

    revenueFor(divisor: number): number      { return this.revenueExcl / divisor; }
    revenueInclFor(divisor: number): number  { return this.revenueIncl / divisor; }
    grossFor(divisor: number): number        { return this.grossProfitYear / divisor; }
    taxFor(divisor: number): number          { return this.taxYear / divisor; }
    netFor(divisor: number): number          { return this.netProfitYear / divisor; }

    readonly periods = [
        { label: 'Per uur',     note: `${WORK_HOURS} u/jaar`,  divisor: WORK_HOURS },
        { label: 'Per dag',     note: `${DAYS_YEAR} dgn/jaar`, divisor: DAYS_YEAR  },
        { label: 'Per maand',   note: '12 mnd/jaar',           divisor: 12         },
        { label: 'Per kwartaal',note: '4 kw/jaar',             divisor: 4          },
        { label: 'Per jaar',    note: 'volledig boekjaar',     divisor: 1          }
    ];

    fmt(n: number): string {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n);
    }

    trackById(_: number, item: CostItem): number { return item.id; }
}