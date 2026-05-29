/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersService, Customer, CustomerLocation, SubscriptionFrequency } from '../../services/customers.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface Invoice {
    id: string;
    number: number;
    issueDate: Date;
    dueDate: Date;
    periodStart: Date;
    periodEnd: Date;
    customerId: string;
    customerName: string;
    customerLogo?: string;
    customerVat: string;
    customerAddress: string;
    customerLocations: CustomerLocation[];
    subscriptionId: string;
    subscriptionName: string;
    subscriptionType: string;
    subscriptionUrl: string;
    frequency: SubscriptionFrequency;
    payment: number;
    discount: number;
    subtotal: number;
    vat: number;
    total: number;
    invoiceType: 'subscription' | 'domain';
}

export interface InvoiceGroup {
    customerId: string;
    customerName: string;
    customerLogo?: string;
    items: Invoice[];
}

const VAT_RATE = 0.21;
const DOMAIN_PRICE = 8.26;
const DOMAIN_VAT = +(DOMAIN_PRICE * VAT_RATE).toFixed(2);
const DOMAIN_TOTAL = +(DOMAIN_PRICE + DOMAIN_VAT).toFixed(2);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

@Component({
    selector: 'app-portal-invoices',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './invoices.component.html',
    styleUrls: ['./invoices.component.css']
})
export class PortalInvoicesComponent implements OnInit, OnDestroy {
    invoices: Invoice[] = [];
    loading = true;
    error = '';
    searchQuery = '';
    filterYear: number | 'all' = 'all';
    filterMonth: number | 'all' = 'all';
    availableYears: number[] = [];
    generatingPdfId: string | null = null;
    failedGroupLogos = new Set<string>();
    private destroy$ = new Subject<void>();

    constructor(
        private customersService: CustomersService,
        private cdr: ChangeDetectorRef
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
        this.customersService.getAllCustomers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.invoices = this.generateInvoices(response.data ?? []);
                    this.availableYears = [...new Set(this.invoices.map(i => i.issueDate.getFullYear()))].sort((a, b) => b - a);
                    this.loading = false;
                },
                error: () => {
                    this.error = 'Facturen konden niet worden geladen.';
                    this.loading = false;
                }
            });
    }

    private getMultiplier(freq: string): number {
        if (freq === 'yearly') return 12;
        if (freq === 'quarterly') return 3;
        return 1;
    }

    private generateInvoices(customers: Customer[]): Invoice[] {
        // Generate up to end of next month
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 2, 0);
        endDate.setHours(23, 59, 59, 999);

        const raw: Omit<Invoice, 'id' | 'number'>[] = [];

        for (const customer of customers.filter(c => !c.isHQ)) {
            for (const website of (customer.websites ?? [])) {
                if (!website.startDate) continue;

                const isFree = website.subscriptionType.toLowerCase().includes('free') || website.subscriptionType.toLowerCase().includes('todo');

                const baseInfo = {
                    customerId: customer.id,
                    customerName: customer.name,
                    customerLogo: customer.logo,
                    customerVat: customer.vat ?? '',
                    customerAddress: customer.address ?? '',
                    customerLocations: customer.locations ?? [],
                    subscriptionId: website.id,
                    subscriptionUrl: website.url
                };

                if (website.payment > 0 && !isFree) {
                    const m = this.getMultiplier(website.frequency);
                    const monthlySub = website.subtotal ?? Math.max(0, website.payment - website.discount);
                    const periodicPayment  = website.payment * m;
                    const periodicDiscount = website.discount * m;
                    const periodicSubtotal = monthlySub * m;
                    const periodicVat      = (website.vat ?? monthlySub * VAT_RATE) * m;
                    const periodicTotal    = (website.total ?? monthlySub * (1 + VAT_RATE)) * m;

                    for (const { start, end } of this.getBillingPeriods(website.startDate, website.frequency, endDate)) {
                        const due = new Date(start);
                        due.setDate(due.getDate() + 30);
                        raw.push({
                            ...baseInfo,
                            issueDate: new Date(start),
                            dueDate: due,
                            periodStart: start,
                            periodEnd: end,
                            subscriptionName: website.name,
                            subscriptionType: website.subscriptionType,
                            frequency: website.frequency,
                            payment: periodicPayment,
                            discount: periodicDiscount,
                            subtotal: periodicSubtotal,
                            vat: periodicVat,
                            total: periodicTotal,
                            invoiceType: 'subscription'
                        });
                    }
                }

                if (!isFree) {
                    for (const { start, end } of this.getBillingPeriods(website.startDate, 'yearly', endDate)) {
                        const due = new Date(start);
                        due.setDate(due.getDate() + 30);
                        raw.push({
                            ...baseInfo,
                            issueDate: new Date(start),
                            dueDate: due,
                            periodStart: start,
                            periodEnd: end,
                            subscriptionName: 'Domeinnaam',
                            subscriptionType: 'Domain',
                            frequency: 'yearly',
                            payment: DOMAIN_PRICE,
                            discount: 0,
                            subtotal: DOMAIN_PRICE,
                            vat: DOMAIN_VAT,
                            total: DOMAIN_TOTAL,
                            invoiceType: 'domain'
                        });
                    }
                }
            }
        }

        raw.sort((a, b) => {
            const byDate = a.issueDate.getTime() - b.issueDate.getTime();
            if (byDate !== 0) return byDate;
            const byCustomer = a.customerId.localeCompare(b.customerId);
            if (byCustomer !== 0) return byCustomer;
            if (a.invoiceType !== b.invoiceType) return a.invoiceType === 'subscription' ? -1 : 1;
            return a.subscriptionId.localeCompare(b.subscriptionId);
        });

        return raw.map((inv, i) => ({
            ...inv,
            id: String(i + 1).padStart(8, '0'),
            number: i + 1
        }));
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
                    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
                    break;
                case 'quarterly':
                    periodEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 0);
                    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);
                    break;
                case 'yearly':
                    periodEnd = new Date(cursor.getFullYear() + 1, cursor.getMonth(), 0);
                    cursor = new Date(cursor.getFullYear() + 1, cursor.getMonth(), 1);
                    break;
                default:
                    return periods;
            }

            if (periodStart <= endDate) periods.push({ start: periodStart, end: periodEnd });
        }

        return periods;
    }

    get filteredInvoices(): Invoice[] {
        return this.invoices.filter(inv => {
            if (this.filterYear !== 'all' && inv.issueDate.getFullYear() !== this.filterYear) return false;
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

    get availableMonths(): number[] {
        const base = this.filterYear === 'all'
            ? this.invoices
            : this.invoices.filter(i => i.issueDate.getFullYear() === this.filterYear);
        return [...new Set(base.map(i => i.issueDate.getMonth() + 1))].sort((a, b) => a - b);
    }

    get totalRevenue(): number {
        return this.filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    }

    getYearCount(year: number): number {
        return this.invoices.filter(i => i.issueDate.getFullYear() === year).length;
    }

    getMonthCount(month: number): number {
        const base = this.filterYear === 'all'
            ? this.invoices
            : this.invoices.filter(i => i.issueDate.getFullYear() === this.filterYear);
        return base.filter(i => i.issueDate.getMonth() + 1 === month).length;
    }

    getMonthName(month: number): string {
        return MONTH_NAMES[month - 1] ?? '';
    }

    onSearch(event: Event): void {
        this.searchQuery = (event.target as HTMLInputElement).value;
    }

    setYearFilter(year: number | 'all'): void {
        this.filterYear = year;
        this.filterMonth = 'all';
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

    getSubscriptionClass(type: string): string {
        const t = type.toLowerCase();
        if (t === 'domain')           return 'invoices-badge--domain';
        if (t.includes('enterprise')) return 'invoices-badge--enterprise';
        if (t.includes('business'))   return 'invoices-badge--business';
        if (t.includes('startup'))    return 'invoices-badge--startup';
        if (t.includes('growth'))     return 'invoices-badge--growth';
        if (t.includes('basic'))      return 'invoices-badge--basic';
        return 'invoices-badge--custom';
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(amount);
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
            const [jsPDFModule, logoBase64] = await Promise.all([
                import('jspdf'),
                this.loadLogoBase64()
            ]);
            this.buildPdf(jsPDFModule.jsPDF, invoice, logoBase64);
        } catch (err) {
            console.error('PDF generatie mislukt:', err);
        } finally {
            this.generatingPdfId = null;
            this.cdr.detectChanges();
        }
    }

    private async loadLogoBase64(): Promise<string | null> {
        try {
            const response = await fetch('assets/media/images/logo.png');
            const blob = await response.blob();
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    }

    private buildPdf(JsPDF: any, inv: Invoice, logoBase64: string | null): void {
        const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = 210, M = 15, CW = W - M * 2;
        const P: [number, number, number] = [79, 148, 240]; // #4f94f0
        const fmt = (n: number) => this.formatCurrency(n);
        const fd = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const freqEn: Record<string, string> = {
            monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly', 'one-time': 'One-time'
        };
        const periodEn = (start: Date, end: Date, freq: string): string => {
            if (freq === 'monthly') return start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
            if (freq === 'quarterly') return `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
            if (freq === 'yearly') return String(start.getFullYear());
            return `${fd(start)} – ${fd(end)}`;
        };
        const nameEn: Record<string, string> = { 'Domeinnaam': 'Domain name' };
        const itemName = nameEn[inv.subscriptionName] ?? inv.subscriptionName;

        // ── Header band ──────────────────────────────────────────────
        doc.setFillColor(...P);
        doc.rect(0, 0, W, 32, 'F');

        const logoSize = 16, logoX = M, logoY = 8;
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
        }

        const textX = logoBase64 ? M + logoSize + 4 : M;
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20); doc.setFont('helvetica', 'bold');
        doc.text('EliasDH', textX, 17);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
        doc.text('eliasdh.com', textX, 23);
        doc.setFontSize(24); doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', W - M, 18, { align: 'right' });

        // ── From + Invoice details ───────────────────────────────────
        const col2X = M + CW / 2 + 8;
        let y = 42;

        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130);
        doc.text('FROM', M, y); y += 5;
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
        doc.text('EliasDH BV', M, y); y += 5;
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 70);
        doc.text('info@eliasdh.com', M, y); y += 4;
        doc.text('eliasdh.com', M, y); y += 4;
        doc.text('VAT: BE1034925266', M, y);

        let ry = 42;
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130);
        doc.text('INVOICE DETAILS', W - M, ry, { align: 'right' }); ry += 5;

        const details: [string, string][] = [
            ['Invoice number', inv.id],
            ['Invoice date',   fd(inv.issueDate)],
            ['Due date',       fd(inv.dueDate)],
            ['Period',         periodEn(inv.periodStart, inv.periodEnd, inv.frequency)],
            ['Reference',      inv.id]
        ];
        for (const [label, val] of details) {
            doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(70, 70, 70);
            doc.text(`${label}:`, col2X, ry);
            doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20);
            doc.text(val, W - M, ry, { align: 'right' }); ry += 5;
        }

        // ── Divider ──────────────────────────────────────────────────
        y = 82;
        doc.setDrawColor(210, 210, 210); doc.line(M, y, W - M, y); y += 7;

        // ── Bill to ──────────────────────────────────────────────────
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130);
        doc.text('BILL TO', M, y); y += 5;
        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
        doc.text(inv.customerName, M, y); y += 5;
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 70);

        const loc = inv.customerLocations?.[0];
        if (loc) {
            doc.text(`${loc.street} ${loc.number}`, M, y); y += 4;
            doc.text(`${loc.postalCode} ${loc.city}`, M, y); y += 4;
            if (loc.country) { doc.text(loc.country, M, y); y += 4; }
        } else if (inv.customerAddress) {
            doc.text(inv.customerAddress, M, y); y += 4;
        }
        if (inv.customerVat) { doc.text(`VAT: ${inv.customerVat}`, M, y); y += 4; }

        // ── Table ────────────────────────────────────────────────────
        y += 5;
        doc.setFillColor(241, 243, 248);
        doc.rect(M, y, CW, 8, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(70, 70, 70);
        doc.text('DESCRIPTION', M + 3, y + 5.3);
        doc.text('TYPE', M + 95, y + 5.3);
        doc.text('FREQUENCY', M + 125, y + 5.3);
        doc.text('AMOUNT', W - M - 3, y + 5.3, { align: 'right' });
        y += 8;

        doc.setFillColor(251, 252, 254);
        doc.rect(M, y, CW, 14, 'F');
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
        doc.text(itemName, M + 3, y + 5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(120, 120, 120);
        doc.text(inv.subscriptionUrl, M + 3, y + 10);
        doc.setFontSize(8.5); doc.setTextColor(20, 20, 20);
        doc.text(inv.subscriptionType, M + 95, y + 5);
        doc.text(freqEn[inv.frequency] ?? inv.frequency, M + 125, y + 5);
        doc.setFont('helvetica', 'bold');
        doc.text(fmt(inv.payment), W - M - 3, y + 5, { align: 'right' });
        y += 14;

        doc.setDrawColor(210, 210, 210); doc.line(M, y, W - M, y); y += 6;

        // ── Totals ───────────────────────────────────────────────────
        const tX = W - M - 62, tVX = W - M;

        const addRow = (label: string, val: string) => {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(70, 70, 70);
            doc.text(label, tX, y);
            doc.setTextColor(20, 20, 20); doc.text(val, tVX, y, { align: 'right' });
            y += 5.5;
        };

        addRow('Base price:', fmt(inv.payment));
        if (inv.discount > 0) {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(70, 70, 70);
            doc.text('Discount:', tX, y);
            doc.setTextColor(16, 185, 129); doc.text(`−${fmt(inv.discount)}`, tVX, y, { align: 'right' });
            y += 5.5;
            addRow('Subtotal:', fmt(inv.subtotal));
        }
        doc.setDrawColor(210, 210, 210); doc.line(tX, y, tVX, y); y += 4;
        addRow('VAT (21%):', fmt(inv.vat));
        doc.line(tX, y, tVX, y); y += 3;

        doc.setFillColor(...P);
        doc.roundedRect(tX - 2, y, tVX - tX + 4, 10, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        doc.text('TOTAL:', tX, y + 6.5);
        doc.text(fmt(inv.total), tVX, y + 6.5, { align: 'right' });
        y += 17;

        // ── Footer ───────────────────────────────────────────────────
        doc.setDrawColor(210, 210, 210); doc.line(M, y, W - M, y); y += 6;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(70, 70, 70);
        doc.text('Payment instructions:', M, y); y += 5;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
        doc.text(`Please transfer before ${fd(inv.dueDate)} quoting the reference number.`, M, y); y += 4.5;
        doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
        doc.text('IBAN:', M, y);
        doc.setFont('helvetica', 'normal');
        doc.text('BE44 7310 7368 8245', M + 12, y);
        doc.setFont('helvetica', 'bold');
        doc.text('Reference:', M + 70, y);
        doc.setFont('helvetica', 'normal');
        doc.text(inv.id, M + 95, y);
        y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(150, 150, 150);
        doc.text('EliasDH BV  ·  VAT: BE1034925266  ·  info@eliasdh.com  ·  eliasdh.com', M, y);

        doc.save(`${inv.id}.pdf`);
    }
}