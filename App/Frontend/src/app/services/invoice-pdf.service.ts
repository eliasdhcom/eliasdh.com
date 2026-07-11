/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/07/2026
**/

import { Injectable } from '@angular/core';
import { Invoice } from './invoice-builder.service';

@Injectable({ providedIn: 'root' })
export class InvoicePdfService {

    async generate(invoice: Invoice): Promise<void> {
        if (typeof window === 'undefined') return;
        const [jsPDFModule, logoBase64] = await Promise.all([
            import('jspdf'),
            this.loadLogoBase64()
        ]);
        this.buildPdf(jsPDFModule.jsPDF, invoice, logoBase64);
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

    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(amount);
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

        y = 82;
        doc.setDrawColor(210, 210, 210); doc.line(M, y, W - M, y); y += 7;

        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130);
        doc.text('BILL TO', M, y); y += 5;
        const loc = inv.customerLocations?.[inv.invoiceLocationIndex] ?? inv.customerLocations?.[0];
        const billToName = loc?.name || inv.customerName;
        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
        doc.text(billToName, M, y); y += 5;
        doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 70);
        if (loc) {
            doc.text(`${loc.street} ${loc.number}`, M, y); y += 4;
            doc.text(`${loc.postalCode} ${loc.city}`, M, y); y += 4;
            if (loc.country) { doc.text(loc.country, M, y); y += 4; }
        } else if (inv.customerAddress) {
            doc.text(inv.customerAddress, M, y); y += 4;
        }
        const vatToShow = loc?.vat || inv.customerVat;
        if (vatToShow) { doc.text(`VAT: ${vatToShow}`, M, y); y += 4; }

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
