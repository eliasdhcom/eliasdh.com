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
import { UsersService, PortalUser } from '../../services/users.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const DOMAIN_EXCL = 8.26;
const TAX_RATE    = 0.20;
const WORK_HOURS  = 2080;
const DAYS_YEAR   = 365;

const RATES_DEFAULT = { rszEmployee: 13.07, bv: 25, rszEmployer: 25 };

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

    costs: CostItem[]  = [];
    employees: PortalUser[] = [];

    savingIds  = new Set<number>();
    addingCost = false;

    rates = { ...RATES_DEFAULT };

    collapsed: Record<'overview' | 'costs' | 'payroll' | 'summary', boolean> =
        { overview: false, costs: false, payroll: false, summary: false };

    private destroy$ = new Subject<void>();

    constructor(
        private customersService: CustomersService,
        private costsService:     CostsService,
        private usersService:     UsersService
    ) {}

    ngOnInit(): void { this.loadData(); }
    ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

    loadData(): void {
        this.loading = true;
        forkJoin({
            customers: this.customersService.getAllCustomers(),
            costs:     this.costsService.getAll(),
            users:     this.usersService.getAllUsers()
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ({ customers, costs, users }) => {
                this.computeRevenue(customers.data ?? []);
                this.costs     = costs.data ?? [];
                this.employees = (users.data ?? []).filter(u =>
                    u.active && (u.role.toLowerCase() === 'admin' || u.role.toLowerCase() === 'employee') && u.netSalary > 0
                );
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

                const isFree = website.subscriptionType.toLowerCase().includes('free') || website.subscriptionType.toLowerCase().includes('todo');

                if (website.payment > 0 && !isFree && website.frequency !== 'one-time') {
                    annualExcl += Math.max(0, website.payment - website.discount) * 12;
                }
                if (!isFree) annualExcl += DOMAIN_EXCL;
            }
        }

        this.revenueExcl = annualExcl;
    }

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

    toggleSection(key: 'overview' | 'costs' | 'payroll' | 'summary'): void {
        this.collapsed[key] = !this.collapsed[key];
    }

    private get rszEmployeeFrac(): number  { return this.rates.rszEmployee / 100; }
    private get bvFrac(): number           { return this.rates.bv           / 100; }
    private get rszEmployerFrac(): number  { return this.rates.rszEmployer  / 100; }
    private get netToGross(): number       { return 1 / ((1 - this.rszEmployeeFrac) * (1 - this.bvFrac)); }

    grossSalary(netMonthly: number): number {
        return netMonthly * this.netToGross;
    }

    rsz(netMonthly: number): number {
        return this.grossSalary(netMonthly) * this.rszEmployeeFrac;
    }

    bv(netMonthly: number): number {
        return (this.grossSalary(netMonthly) - this.rsz(netMonthly)) * this.bvFrac;
    }

    employerCostMonthly(netMonthly: number): number {
        return this.grossSalary(netMonthly) * (1 + this.rszEmployerFrac);
    }

    employerCostAnnual(netMonthly: number): number {
        return this.employerCostMonthly(netMonthly) * 12;
    }

    get totalAnnualPayrollCosts(): number {
        return this.employees.reduce((s, e) => s + this.employerCostAnnual(e.netSalary), 0);
    }

    get grossProfitYear(): number { return this.revenueExcl - this.totalAnnualCosts - this.totalAnnualPayrollCosts; }
    get taxYear(): number          { return Math.max(0, this.grossProfitYear) * TAX_RATE; }
    get netProfitYear(): number    { return this.grossProfitYear - this.taxYear; }

    revenueFor(divisor: number): number { return this.revenueExcl / divisor; }
    netFor(divisor: number): number     { return this.netProfitYear / divisor; }

    readonly periods = [
        { label: 'Per uur',      divisor: WORK_HOURS },
        { label: 'Per dag',      divisor: DAYS_YEAR  },
        { label: 'Per maand',    divisor: 12         },
        { label: 'Per kwartaal', divisor: 4          },
        { label: 'Per jaar',     divisor: 1          }
    ];

    fmt(n: number): string {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(n);
    }

    trackById(_: number, item: CostItem): number { return item.id; }
}