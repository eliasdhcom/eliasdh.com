/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/07/2026
**/

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { PortalService, PortalMeInvoice } from '../../services/portal.service';
import { Customer, CustomerLocation, CustomerWebsite, CustomerDomain } from '../../services/customers.service';
import { Invoice } from '../../services/invoice-builder.service';
import { InvoicePdfService } from '../../services/invoice-pdf.service';
import { LogsService } from '../../services/logs.service';
import { PricingPlansService } from '../../services/pricing-plans.service';
import { CompanyContextService } from '../../services/company-context.service';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, skip } from 'rxjs/operators';

type ListSection = 'websites' | 'domains' | 'invoices';

interface LocationGroup {
    location:  CustomerLocation;
    websites:  CustomerWebsite[];
    domains:   CustomerDomain[];
    invoices:  Invoice[];
    visible:   Record<ListSection, number>;
}

const PAGE_SIZE = 3;

@Component({
    selector: 'app-portal-mycompany',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './mycompany.component.html',
    styleUrls: ['./mycompany.component.css']
})
export class PortalMyCompanyComponent implements OnInit, OnDestroy {
    loading = true;
    error   = '';

    customer: Customer | null = null;
    groups:   LocationGroup[] = [];
    generatingPdfId: string | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private portalService: PortalService,
        private invoicePdfService: InvoicePdfService,
        private logsService: LogsService,
        readonly pricingPlansService: PricingPlansService,
        private companyContextService: CompanyContextService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.load();
        this.companyContextService.selectedCustomerId$
            .pipe(skip(1), takeUntil(this.destroy$))
            .subscribe(() => this.load());
    }
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    load(): void {
        this.loading = true;
        this.error   = '';
        const customerId = this.companyContextService.selectedCustomerId$.value;
        forkJoin({
            me:    this.portalService.getMe(customerId),
            plans: this.pricingPlansService.getAll().pipe(catchError(() => of({ success: true, data: [] as any[] })))
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ({ me: r, plans }) => {
                    if (!r.data?.customer) { this.error = 'Geen gegevens gevonden.'; this.loading = false; return; }
                    this.pricingPlansService.setPlanColors(plans.data ?? []);
                    this.customer = r.data.customer;
                    const invoices = (r.data.invoices ?? []).map(inv => this.toInvoice(inv));
                    this.groups = (this.customer.locations ?? []).map((location, index) => ({
                        location,
                        websites: (this.customer!.websites ?? []).filter(w => (w.invoiceLocationIndex ?? 0) === index),
                        domains:  (this.customer!.domains  ?? []).filter(d => (d.invoiceLocationIndex ?? 0) === index),
                        invoices: invoices.filter(inv => inv.invoiceLocationIndex === index),
                        visible:  { websites: PAGE_SIZE, domains: PAGE_SIZE, invoices: PAGE_SIZE }
                    }));
                    this.loading = false;
                },
                error: () => { this.error = 'Gegevens konden niet worden geladen.'; this.loading = false; }
            });
    }

    private toInvoice(raw: PortalMeInvoice): Invoice {
        return {
            ...raw,
            issueDate:   new Date(raw.issueDate),
            dueDate:     new Date(raw.dueDate),
            periodStart: new Date(raw.periodStart),
            periodEnd:   new Date(raw.periodEnd)
        };
    }

    formatAddress(loc: CustomerLocation): string {
        return `${loc.street} ${loc.number}, ${loc.postalCode} ${loc.city}, ${loc.country}`;
    }

    toHref(url: string): string {
        return /^https?:\/\//i.test(url) ? url : `https://${url}`;
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    formatFrequency(freq: string): string {
        const labels: Record<string, string> = { monthly: 'maandelijks', quarterly: 'per kwartaal', yearly: 'jaarlijks', 'one-time': 'eenmalig' };
        return labels[freq] ?? freq;
    }

    getBadgeStyle(type: string) { return this.pricingPlansService.getBadgeStyle(type); }

    showMore(group: LocationGroup, section: ListSection): void {
        group.visible[section] += PAGE_SIZE;
    }

    private formatPeriod(start: Date, end: Date, freq: string): string {
        if (freq === 'monthly') return start.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' });
        if (freq === 'quarterly') return `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
        if (freq === 'yearly') return String(start.getFullYear());
        return `${this.formatDate(start)} – ${this.formatDate(end)}`;
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