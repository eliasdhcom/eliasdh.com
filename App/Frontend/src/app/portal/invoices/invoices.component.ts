/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CustomersService } from '../../services/customers.service';
import { InvoicesService } from '../../services/invoices.service';
import { InvoiceBuilderService, Invoice, InvoiceGroup } from '../../services/invoice-builder.service';
import { InvoicePdfService } from '../../services/invoice-pdf.service';
import { PricingPlansService } from '../../services/pricing-plans.service';
import { LogsService } from '../../services/logs.service';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

export type { Invoice, InvoiceGroup };

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

@Component({
    selector: 'app-portal-invoices',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './invoices.component.html',
    styleUrls: ['./invoices.component.css']
})
export class PortalInvoicesComponent implements OnInit, OnDestroy {
    invoices: Invoice[] = [];
    loading = true;
    error = '';
    searchQuery = '';
    filterYear: number | 'all' = 'all';
    filterQuarter: number | 'all' = 'all';
    filterMonth: number | 'all' = 'all';
    availableYears: number[] = [];
    generatingPdfId: string | null = null;
    failedGroupLogos = new Set<string>();
    paidConfirmId: string | null = null;
    paidConfirmCurrentState = false;
    showVatModal = false;
    vatYear = 0;
    vatQuarter = 0;
    private destroy$ = new Subject<void>();

    constructor(
        private customersService: CustomersService,
        private invoicesService: InvoicesService,
        private invoiceBuilderService: InvoiceBuilderService,
        private invoicePdfService: InvoicePdfService,
        private cdr: ChangeDetectorRef,
        readonly pricingPlansService: PricingPlansService,
        private logsService: LogsService,
        private translate: TranslateService
    ) {}

    ngOnInit(): void {
        this.loadInvoices();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadInvoices(): void {
        this.loading = true;
        this.error = '';
        forkJoin({
            customers: this.customersService.getAllCustomers(),
            statuses:  this.invoicesService.getAllStatuses().pipe(
                catchError(() => of({ success: true, data: [] as any[] }))
            ),
            plans: this.pricingPlansService.getAll().pipe(
                catchError(() => of({ success: true, data: [] as any[] }))
            )
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ({ customers, statuses, plans }) => {
                this.pricingPlansService.setPlanColors(plans.data ?? []);
                this.invoices = this.invoiceBuilderService.buildInvoices(customers.data ?? [], statuses.data ?? []);
                this.availableYears = [...new Set(this.invoices.map(i => i.issueDate.getFullYear()))].sort((a, b) => b - a);
                this.loading = false;
            },
            error: () => {
                this.error = 'Facturen konden niet worden geladen.';
                this.loading = false;
            }
        });
    }

    private getQuarter(date: Date): number {
        return Math.floor(date.getMonth() / 3) + 1;
    }

    get filteredInvoices(): Invoice[] {
        return this.invoices.filter(inv => {
            if (this.filterYear !== 'all' && inv.issueDate.getFullYear() !== this.filterYear) return false;
            if (this.filterQuarter !== 'all' && this.getQuarter(inv.issueDate) !== this.filterQuarter) return false;
            if (this.filterMonth !== 'all' && inv.issueDate.getMonth() + 1 !== this.filterMonth) return false;
            if (!this.searchQuery.trim()) return true;
            const q = this.searchQuery.toLowerCase();
            return (
                inv.id.toLowerCase().includes(q) ||
                inv.customerName.toLowerCase().includes(q) ||
                inv.customerId.toLowerCase().includes(q) ||
                inv.subscriptionName.toLowerCase().includes(q) ||
                inv.subscriptionId.toLowerCase().includes(q) ||
                inv.subscriptionType.toLowerCase().includes(q)
            );
        });
    }

    get groupedInvoices(): InvoiceGroup[] {
        const map = new Map<string, InvoiceGroup>();
        for (const inv of this.filteredInvoices) {
            if (!map.has(inv.customerId)) {
                map.set(inv.customerId, {
                    customerId: inv.customerId,
                    customerName: inv.customerName,
                    customerLogo: inv.customerLogo,
                    items: []
                });
            }
            map.get(inv.customerId)!.items.push(inv);
        }
        const groups = Array.from(map.values()).sort((a, b) => a.customerId.localeCompare(b.customerId));
        groups.forEach(g => g.items.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime()));
        return groups;
    }

    private get yearBase(): Invoice[] {
        return this.filterYear === 'all'
            ? this.invoices
            : this.invoices.filter(i => i.issueDate.getFullYear() === this.filterYear);
    }

    private get quarterBase(): Invoice[] {
        const base = this.yearBase;
        return this.filterQuarter === 'all' ? base : base.filter(i => this.getQuarter(i.issueDate) === this.filterQuarter);
    }

    get availableQuarters(): number[] {
        return [...new Set(this.yearBase.map(i => this.getQuarter(i.issueDate)))].sort((a, b) => a - b);
    }

    get availableMonths(): number[] {
        return [...new Set(this.quarterBase.map(i => i.issueDate.getMonth() + 1))].sort((a, b) => a - b);
    }

    get totalRevenue(): number {
        return this.filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    }

    getYearCount(year: number): number {
        return this.invoices.filter(i => i.issueDate.getFullYear() === year).length;
    }

    getQuarterCount(quarter: number): number {
        return this.yearBase.filter(i => this.getQuarter(i.issueDate) === quarter).length;
    }

    getMonthCount(month: number): number {
        return this.quarterBase.filter(i => i.issueDate.getMonth() + 1 === month).length;
    }

    get allAllPaid(): boolean {
        return this.invoices.length > 0 && this.invoices.every(i => i.paid);
    }

    get allUnpaidCount(): number {
        return this.invoices.filter(i => !i.paid).length;
    }

    isYearAllPaid(year: number): boolean {
        const inv = this.invoices.filter(i => i.issueDate.getFullYear() === year);
        return inv.length > 0 && inv.every(i => i.paid);
    }

    getYearUnpaidCount(year: number): number {
        return this.invoices.filter(i => i.issueDate.getFullYear() === year && !i.paid).length;
    }

    isQuarterAllPaid(quarter: number): boolean {
        const inv = this.yearBase.filter(i => this.getQuarter(i.issueDate) === quarter);
        return inv.length > 0 && inv.every(i => i.paid);
    }

    getQuarterUnpaidCount(quarter: number): number {
        return this.yearBase.filter(i => this.getQuarter(i.issueDate) === quarter && !i.paid).length;
    }

    isMonthAllPaid(month: number): boolean {
        const inv = this.quarterBase.filter(i => i.issueDate.getMonth() + 1 === month);
        return inv.length > 0 && inv.every(i => i.paid);
    }

    getMonthUnpaidCount(month: number): number {
        return this.quarterBase.filter(i => i.issueDate.getMonth() + 1 === month && !i.paid).length;
    }

    getMonthName(month: number): string {
        return MONTH_NAMES[month - 1] ?? '';
    }

    onSearch(event: Event): void {
        this.searchQuery = (event.target as HTMLInputElement).value;
    }

    private autoSelectSingleMonth(): void {
        const months = this.availableMonths;
        this.filterMonth = months.length === 1 ? months[0] : 'all';
    }

    setYearFilter(year: number | 'all'): void {
        this.filterYear = year;
        this.filterQuarter = 'all';
        this.autoSelectSingleMonth();
    }

    setQuarterFilter(quarter: number | 'all'): void {
        this.filterQuarter = quarter;
        this.autoSelectSingleMonth();
    }

    setMonthFilter(month: number | 'all'): void {
        this.filterMonth = month;
    }

    showGroupLogo(group: InvoiceGroup): boolean {
        return !!group.customerLogo && !this.failedGroupLogos.has(group.customerId);
    }

    handleGroupLogoError(customerId: string): void {
        this.failedGroupLogos.add(customerId);
    }

    getGroupInitials(name: string): string {
        return name.split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
    }

    getBadgeStyle(type: string) { return this.pricingPlansService.getBadgeStyle(type); }

    formatSubscriptionId(id: string): string {
        return id.startsWith('domain:') ? id.slice('domain:'.length) : id;
    }

    getDueDateStatus(inv: Invoice): string {
        if (inv.paid) return 'paid';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(inv.dueDate);
        due.setHours(0, 0, 0, 0);
        const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
        if (days < 0) return 'red';
        if (days <= 7) return 'orange';
        return 'green';
    }

    getDueDateLabel(inv: Invoice): string {
        if (inv.paid) return 'Betaald';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(inv.dueDate);
        due.setHours(0, 0, 0, 0);
        const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
        if (days < 0) return `${Math.abs(days)}d vervallen`;
        if (days === 0) return 'Vandaag';
        if (days === 1) return 'Morgen';
        return `${days}d resterend`;
    }

    getPeriodProgress(inv: Invoice): number {
        const now   = Date.now();
        const start = inv.periodStart.getTime();
        const end   = inv.periodEnd.getTime();
        if (now <= start) return 0;
        if (now >= end)   return 100;
        return Math.round(((now - start) / (end - start)) * 100);
    }

    isTodayInPeriod(inv: Invoice): boolean {
        const p = this.getPeriodProgress(inv);
        return p > 0 && p < 100;
    }

    getPeriodStatus(inv: Invoice): string {
        if (inv.paid) return 'paid';
        const p = this.getPeriodProgress(inv);
        if (p >= 90) return 'red';
        if (p >= 70) return 'orange';
        return 'green';
    }

    private isQuarterComplete(year: number, quarter: number): boolean {
        return new Date() > new Date(year, quarter * 3, 0, 23, 59, 59, 999);
    }

    private invoicesForYearQuarter(year: number, quarter: number): Invoice[] {
        return this.invoices.filter(i =>
            i.issueDate.getFullYear() === year && this.getQuarter(i.issueDate) === quarter
        );
    }

    get vatModalAvailableYears(): number[] {
        return [...new Set(this.invoices.map(i => i.issueDate.getFullYear()))]
            .filter(y => [1,2,3,4].some(q => this.invoicesForYearQuarter(y, q).length > 0))
            .sort((a, b) => b - a);
    }

    vatModalQuartersForYear(year: number): number[] {
        return [1,2,3,4].filter(q => this.invoicesForYearQuarter(year, q).length > 0);
    }

    getVatQuarterStatus(year: number, quarter: number): 'ready' | 'ended-unpaid' | 'ongoing-paid' | 'ongoing-unpaid' {
        const ended   = this.isQuarterComplete(year, quarter);
        const invs    = this.invoicesForYearQuarter(year, quarter);
        const allPaid = invs.length > 0 && invs.every(i => i.paid);
        const anyUnpaid = invs.some(i => !i.paid);
        if (ended  && allPaid)  return 'ready';
        if (ended  && anyUnpaid) return 'ended-unpaid';
        if (!ended && !anyUnpaid) return 'ongoing-paid';
        return 'ongoing-unpaid';
    }

    get vatCurrentStatus(): 'ready' | 'ended-unpaid' | 'ongoing-paid' | 'ongoing-unpaid' {
        return this.getVatQuarterStatus(this.vatYear, this.vatQuarter);
    }

    openVatModal(): void {
        const years = this.vatModalAvailableYears;
        if (!years.length) return;
        this.vatYear = years[0];
        const qs = this.vatModalQuartersForYear(this.vatYear);
        this.vatQuarter = qs[qs.length - 1] ?? 0;
        this.showVatModal = true;
    }

    closeVatModal(): void { this.showVatModal = false; }

    get vatEmptyText(): string {
        return this.translate.instant('PORTAL.INVOICES.VAT.EMPTY', { q: this.vatQuarter, year: this.vatYear });
    }

    get vatNoteText(): string {
        return this.translate.instant('PORTAL.INVOICES.VAT.NOTE', { q: this.vatQuarter, year: this.vatYear });
    }

    setVatYear(year: number): void {
        this.vatYear = year;
        const qs = this.vatModalQuartersForYear(year);
        this.vatQuarter = qs[qs.length - 1] ?? 0;
    }

    get vatInvoices(): Invoice[] {
        if (!this.vatYear || !this.vatQuarter) return [];
        return this.invoicesForYearQuarter(this.vatYear, this.vatQuarter);
    }

    get vatByCustomer(): { customerId: string; customerName: string; invoiceCount: number; subtotal: number; vat: number; total: number }[] {
        const map = new Map<string, { customerId: string; customerName: string; invoiceCount: number; subtotal: number; vat: number; total: number }>();
        for (const inv of this.vatInvoices) {
            if (!map.has(inv.customerId))
                map.set(inv.customerId, { customerId: inv.customerId, customerName: inv.customerName, invoiceCount: 0, subtotal: 0, vat: 0, total: 0 });
            const row = map.get(inv.customerId)!;
            row.invoiceCount++;
            row.subtotal = parseFloat((row.subtotal + inv.subtotal).toFixed(2));
            row.vat      = parseFloat((row.vat      + inv.vat    ).toFixed(2));
            row.total    = parseFloat((row.total    + inv.total  ).toFixed(2));
        }
        return Array.from(map.values()).sort((a, b) => a.customerId.localeCompare(b.customerId));
    }

    get vatTotals(): { invoiceCount: number; subtotal: number; vat: number; total: number } {
        return this.vatByCustomer.reduce(
            (acc, r) => ({
                invoiceCount: acc.invoiceCount + r.invoiceCount,
                subtotal:     parseFloat((acc.subtotal + r.subtotal).toFixed(2)),
                vat:          parseFloat((acc.vat      + r.vat     ).toFixed(2)),
                total:        parseFloat((acc.total    + r.total   ).toFixed(2))
            }),
            { invoiceCount: 0, subtotal: 0, vat: 0, total: 0 }
        );
    }

    formatDateShort(date: Date): string {
        return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    requestTogglePaid(id: string): void {
        const inv = this.invoices.find(i => i.id === id);
        if (!inv) return;
        this.paidConfirmCurrentState = inv.paid;
        this.paidConfirmId = id;
    }

    cancelPaidConfirm(): void {
        this.paidConfirmId = null;
    }

    confirmTogglePaid(): void {
        if (!this.paidConfirmId) return;
        const id = this.paidConfirmId;
        this.paidConfirmId = null;
        this.togglePaid(id);
    }

    togglePaid(id: string): void {
        const inv = this.invoices.find(i => i.id === id);
        if (!inv) return;
        inv.paid = !inv.paid;
        this.invoicesService.updateStatus({
            customerId:       inv.customerId,
            subscriptionId:   inv.subscriptionId,
            periodStart:      inv.periodStart.toISOString(),
            invoiceType:      inv.invoiceType,
            paid:             inv.paid,
            amount:           inv.total,
            frequency:        inv.frequency,
            subscriptionName: inv.subscriptionName,
            subscriptionType: inv.subscriptionType,
            subscriptionUrl:  inv.subscriptionUrl
        }).pipe(takeUntil(this.destroy$)).subscribe();
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    formatPeriod(start: Date, end: Date, freq: string): string {
        if (freq === 'monthly') return start.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' });
        if (freq === 'quarterly') return `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
        if (freq === 'yearly') return String(start.getFullYear());
        return `${this.formatDate(start)} – ${this.formatDate(end)}`;
    }

    getFrequencyLabel(freq: string): string {
        const map: Record<string, string> = {
            monthly: 'Maandelijks', quarterly: 'Kwartaal',
            yearly: 'Jaarlijks', 'one-time': 'Eenmalig'
        };
        return map[freq] ?? freq;
    }

    async downloadPdf(invoice: Invoice): Promise<void> {
        if (typeof window === 'undefined') return;
        this.generatingPdfId = invoice.id;
        this.cdr.detectChanges();
        try {
            await this.invoicePdfService.generate(invoice);
            this.logsService.logEvent({
                action:     'DOWNLOAD',
                resource:   'invoice',
                resourceId: `${invoice.customerId}/${invoice.subscriptionId}`,
                details:    `PDF gedownload: factuur ${invoice.id} — ${invoice.customerName} (${this.formatPeriod(invoice.periodStart, invoice.periodEnd, invoice.frequency)})`
            }).subscribe();
        } catch (err) {
            console.error('PDF generatie mislukt:', err);
        } finally {
            this.generatingPdfId = null;
            this.cdr.detectChanges();
        }
    }
}