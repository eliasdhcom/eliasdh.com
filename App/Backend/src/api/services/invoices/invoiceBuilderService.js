/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/07/2026
**/

const VAT_RATE = 0.21;

function getMultiplier(freq) {
    if (freq === 'yearly') return 12;
    if (freq === 'quarterly') return 3;
    return 1;
}

function periodEndFromFreq(start, freq) {
    if (freq === 'yearly')    return new Date(start.getFullYear() + 1, start.getMonth(), 0);
    if (freq === 'quarterly') return new Date(start.getFullYear(), start.getMonth() + 3, 0);
    return new Date(start.getFullYear(), start.getMonth() + 1, 0);
}

function getBillingPeriods(startDateStr, frequency, endDate) {
    const periods = [];
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
        let periodEnd;

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
            default:
                return periods;
        }

        if (periodStart <= endDate) periods.push({ start: periodStart, end: periodEnd });
    }

    return periods;
}

function generateRawInvoices(customers) {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2, 0);
    endDate.setHours(23, 59, 59, 999);

    const raw = [];

    for (const customer of customers.filter(c => !c.isHQ)) {
        const customerBase = {
            customerId:        customer.id,
            customerName:      customer.name,
            customerLogo:      customer.logo,
            customerVat:       customer.vat ?? '',
            customerAddress:   customer.address ?? '',
            customerLocations: customer.locations ?? []
        };

        for (const website of (customer.websites ?? [])) {
            if (!website.startDate) continue;
            const isFree = website.subscriptionType.toLowerCase().includes('free');
            if (website.payment <= 0 || isFree) continue;

            const m                = getMultiplier(website.frequency);
            const monthlySub       = website.subtotal ?? Math.max(0, website.payment - website.discount);
            const periodicPayment  = website.payment  * m;
            const periodicDiscount = website.discount * m;
            const periodicSubtotal = monthlySub       * m;
            const periodicVat      = (website.vat     ?? monthlySub * VAT_RATE) * m;
            const periodicTotal    = (website.total   ?? monthlySub * (1 + VAT_RATE)) * m;

            for (const { start, end } of getBillingPeriods(website.startDate, website.frequency, endDate)) {
                const due = new Date(start);
                due.setDate(due.getDate() + 30);
                raw.push({
                    ...customerBase,
                    subscriptionId:       website.id,
                    subscriptionUrl:      website.url,
                    issueDate:            new Date(start),
                    dueDate:              due,
                    periodStart:          start,
                    periodEnd:            end,
                    subscriptionName:     website.name,
                    subscriptionType:     website.subscriptionType,
                    frequency:            website.frequency,
                    payment:              periodicPayment,
                    discount:             periodicDiscount,
                    subtotal:             periodicSubtotal,
                    vat:                  periodicVat,
                    total:                periodicTotal,
                    invoiceType:          'subscription',
                    paid:                 false,
                    invoiceLocationIndex: website.invoiceLocationIndex ?? 0
                });
            }
        }

        for (const domain of (customer.domains ?? [])) {
            if (!domain.renewalDate || domain.annualPrice <= 0) continue;
            const vatAmt = parseFloat((domain.annualPrice * VAT_RATE).toFixed(2));
            const total  = parseFloat((domain.annualPrice + vatAmt).toFixed(2));

            for (const { start, end } of getBillingPeriods(domain.renewalDate, 'yearly', endDate)) {
                const due = new Date(start);
                due.setDate(due.getDate() + 30);
                raw.push({
                    ...customerBase,
                    subscriptionId:       `domain:${String(domain.id ?? 0).padStart(4, '0')}`,
                    subscriptionUrl:      '',
                    issueDate:            new Date(start),
                    dueDate:              due,
                    periodStart:          start,
                    periodEnd:            end,
                    subscriptionName:     domain.name,
                    subscriptionType:     'Domain',
                    frequency:            'yearly',
                    payment:              domain.annualPrice,
                    discount:             0,
                    subtotal:             domain.annualPrice,
                    vat:                  vatAmt,
                    total,
                    invoiceType:          'domain',
                    paid:                 false,
                    invoiceLocationIndex: domain.invoiceLocationIndex ?? 0
                });
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
        id:     String(i + 1).padStart(8, '0'),
        number: i + 1
    }));
}

function buildInvoices(customers, allStatuses) {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const statusMap = new Map(
        allStatuses.map(s => [
            `${s.customerId}_${s.subscriptionId}_${s.periodStart}_${s.invoiceType}_${s.frequency ?? ''}`,
            {
                paid:             s.paid,
                amount:           s.amount ?? null,
                frequency:        s.frequency ?? null,
                subscriptionName: s.subscriptionName ?? null,
                subscriptionType: s.subscriptionType ?? null,
                subscriptionUrl:  s.subscriptionUrl ?? null
            }
        ])
    );

    let invoices = generateRawInvoices(customers);

    const generatedKeys = new Set();
    invoices.forEach(inv => {
        const baseKey = `${inv.customerId}_${inv.subscriptionId}_${inv.periodStart.toISOString()}_${inv.invoiceType}`;
        generatedKeys.add(`${baseKey}_${inv.frequency}`);
        generatedKeys.add(`${baseKey}_`);
        const stored = statusMap.get(`${baseKey}_${inv.frequency}`) ?? statusMap.get(`${baseKey}_`);
        if (stored) {
            inv.paid = stored.paid;
            if (stored.paid) {
                if (stored.amount !== null) {
                    const storedTotal    = stored.amount;
                    const storedVat      = parseFloat((storedTotal * 0.21 / 1.21).toFixed(2));
                    const storedSubtotal = parseFloat((storedTotal - storedVat).toFixed(2));
                    inv.total    = storedTotal;
                    inv.vat      = storedVat;
                    inv.subtotal = storedSubtotal;
                    inv.payment  = storedSubtotal;
                    inv.discount = 0;
                }
                if (stored.frequency)                inv.frequency        = stored.frequency;
                if (stored.subscriptionName != null) inv.subscriptionName = stored.subscriptionName;
                if (stored.subscriptionType != null) inv.subscriptionType = stored.subscriptionType;
                if (stored.subscriptionUrl  != null) inv.subscriptionUrl  = stored.subscriptionUrl;
            }
        }
    });

    const paidBaseKeys = new Set(
        allStatuses.filter(s => s.paid).map(s => `${s.customerId}_${s.subscriptionId}_${s.periodStart}_${s.invoiceType}`)
    );
    const paidRecordByBase = new Map(
        allStatuses.filter(s => s.paid).map(s => [`${s.customerId}_${s.subscriptionId}_${s.periodStart}_${s.invoiceType}`, s])
    );
    const genWindow = new Date();
    genWindow.setMonth(genWindow.getMonth() + 2, 0);
    genWindow.setHours(23, 59, 59, 999);
    const replacements = [];
    invoices = invoices.filter(inv => {
        if (inv.paid) return true;
        const baseKey = `${inv.customerId}_${inv.subscriptionId}_${inv.periodStart.toISOString()}_${inv.invoiceType}`;
        if (!paidBaseKeys.has(baseKey)) return true;
        const paidRec   = paidRecordByBase.get(baseKey);
        const paidFreq  = paidRec?.frequency ?? inv.frequency;
        const paidEnd   = periodEndFromFreq(inv.periodStart, paidFreq);
        const nextStart = new Date(paidEnd.getFullYear(), paidEnd.getMonth() + 1, 1);
        if (nextStart <= genWindow) {
            const nextEnd = periodEndFromFreq(nextStart, inv.frequency);
            const due     = new Date(nextStart);
            due.setDate(due.getDate() + 30);
            replacements.push({ ...inv, id: '', number: 0, periodStart: nextStart, periodEnd: nextEnd, issueDate: new Date(nextStart), dueDate: due, paid: false });
        }
        return false;
    });
    invoices.push(...replacements);

    const customerMap = new Map(customers.map(c => [c.id, c]));
    for (const s of allStatuses) {
        const key = `${s.customerId}_${s.subscriptionId}_${s.periodStart}_${s.invoiceType}_${s.frequency ?? ''}`;
        if (generatedKeys.has(key)) continue;
        if (s.amount === null && !s.paid) continue;
        const periodStart = new Date(s.periodStart);
        if (isNaN(periodStart.getTime())) continue;
        if (periodStart >= firstOfMonth && !s.paid) continue;

        const customer = customerMap.get(s.customerId);
        if (!customer) continue;
        const website = (customer.websites ?? []).find(w => w.id === s.subscriptionId);
        const domain  = s.invoiceType === 'domain'
            ? (customer.domains ?? []).find(d => `domain:${String(d.id ?? 0).padStart(4, '0')}` === s.subscriptionId)
            : null;

        const storedTotal    = s.amount ?? 0;
        const storedVat      = parseFloat((storedTotal * 0.21 / 1.21).toFixed(2));
        const storedSubtotal = parseFloat((storedTotal - storedVat).toFixed(2));
        const freq           = s.frequency ?? 'monthly';
        const periodEnd      = periodEndFromFreq(periodStart, freq);
        const due            = new Date(periodStart);
        due.setDate(due.getDate() + 30);

        invoices.push({
            id: '',
            number: 0,
            paid: s.paid,
            issueDate: new Date(periodStart),
            dueDate: due,
            periodStart,
            periodEnd,
            customerId:           customer.id,
            customerName:         customer.name,
            customerLogo:         customer.logo,
            customerVat:          customer.vat ?? '',
            customerAddress:      customer.address ?? '',
            customerLocations:    customer.locations ?? [],
            invoiceLocationIndex: website?.invoiceLocationIndex ?? domain?.invoiceLocationIndex ?? 0,
            subscriptionId:       s.subscriptionId,
            subscriptionName:     s.subscriptionName ?? website?.name ?? domain?.name ?? s.subscriptionId,
            subscriptionType:     s.subscriptionType ?? website?.subscriptionType ?? (domain ? 'Domain' : ''),
            subscriptionUrl:      s.subscriptionUrl  ?? website?.url ?? '',
            frequency:            freq,
            payment:              storedSubtotal,
            discount:             0,
            subtotal:             storedSubtotal,
            vat:                  storedVat,
            total:                storedTotal,
            invoiceType:          s.invoiceType
        });
    }

    const bestDomain = new Map();
    for (const inv of invoices) {
        if (inv.invoiceType !== 'domain') continue;
        const key = `${inv.customerId}_${inv.subscriptionName}_${inv.periodStart.toISOString()}`;
        const existing = bestDomain.get(key);
        if (!existing || (inv.paid && !existing.paid)) bestDomain.set(key, inv);
    }
    invoices = invoices.filter(inv => {
        if (inv.invoiceType !== 'domain') return true;
        const key = `${inv.customerId}_${inv.subscriptionName}_${inv.periodStart.toISOString()}`;
        return bestDomain.get(key) === inv;
    });

    const activePaidDomainEnds = new Map();
    for (const inv of invoices) {
        if (inv.paid && inv.invoiceType === 'domain') {
            const key = `${inv.customerId}_${inv.subscriptionName}`;
            const existing = activePaidDomainEnds.get(key);
            if (!existing || inv.periodEnd > existing) activePaidDomainEnds.set(key, inv.periodEnd);
        }
    }
    const nowDate = new Date();
    invoices = invoices.filter(inv => {
        if (inv.paid || inv.invoiceType !== 'domain') return true;
        const key = `${inv.customerId}_${inv.subscriptionName}`;
        const paidEnd = activePaidDomainEnds.get(key);
        return !paidEnd || paidEnd < nowDate;
    });

    invoices.sort((a, b) => {
        const byDate = a.issueDate.getTime() - b.issueDate.getTime();
        if (byDate !== 0) return byDate;
        const byCustomer = a.customerId.localeCompare(b.customerId);
        if (byCustomer !== 0) return byCustomer;
        if (a.invoiceType !== b.invoiceType) return a.invoiceType === 'subscription' ? -1 : 1;
        return a.subscriptionId.localeCompare(b.subscriptionId);
    });
    invoices.forEach((inv, i) => { inv.id = String(i + 1).padStart(8, '0'); inv.number = i + 1; });

    return invoices;
}

module.exports = { buildInvoices, getBillingPeriods, periodEndFromFreq };
